import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const jobSelect = 'id,company,role,job_url,source,status,fit_score,notes,metadata,created_at,updated_at';

async function selectOwn(
  // Supabase's generated row types are not present in this repo yet.
  supabase: any,
  table: string,
  userId: string,
  select = '*'
) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (safeTableMissing(error)) {
    return { data: [], migrationPending: true, error: null };
  }

  return { data: data || [], migrationPending: false, error: error?.message || null };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const [profiles, searches, resumes, applications] = await Promise.all([
    selectOwn(auth.supabase, 'job_profiles', auth.user.id, 'id,title,target_roles,target_locations,remote_preference,resume_summary,metadata,created_at,updated_at'),
    selectOwn(auth.supabase, 'job_searches', auth.user.id, 'id,query,location,source,status,metadata,created_at,updated_at'),
    selectOwn(auth.supabase, 'resume_versions', auth.user.id, 'id,label,content,source,metadata,created_at,updated_at'),
    selectOwn(auth.supabase, 'job_applications', auth.user.id, jobSelect)
  ]);

  const warnings = [profiles, searches, resumes, applications].filter(item => item.error).map(item => item.error);

  return NextResponse.json({
    migrationPending: [profiles, searches, resumes, applications].some(item => item.migrationPending),
    profiles: profiles.data,
    searches: searches.data,
    resumes: resumes.data,
    applications: applications.data,
    warnings,
    browserAutomation: {
      status: 'deferred',
      reason: 'Direct apply needs extension/cloud browser sandbox, allowlists, audit logs, and user approval per action.'
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '').trim();

  if (action === 'profile') {
    const { data, error } = await auth.supabase
      .from('job_profiles')
      .insert({
        user_id: auth.user.id,
        title: String(body.title || 'Primary job profile').slice(0, 120),
        target_roles: Array.isArray(body.targetRoles) ? body.targetRoles.map(String).slice(0, 12) : [],
        target_locations: Array.isArray(body.targetLocations) ? body.targetLocations.map(String).slice(0, 12) : [],
        remote_preference: String(body.remotePreference || 'flexible').slice(0, 40),
        resume_summary: body.resumeSummary ? String(body.resumeSummary).slice(0, 4000) : null,
        metadata: {}
      })
      .select()
      .single();

    if (safeTableMissing(error)) {
      return NextResponse.json({ migrationPending: true, error: 'job_profiles is not available in Supabase yet' });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data, migrationPending: false }, { status: 201 });
  }

  if (action === 'application') {
    const company = String(body.company || '').trim();
    const role = String(body.role || '').trim();
    if (!company || !role) {
      return NextResponse.json({ error: 'Company and role are required' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('job_applications')
      .insert({
        user_id: auth.user.id,
        company: company.slice(0, 160),
        role: role.slice(0, 160),
        job_url: body.jobUrl ? String(body.jobUrl).slice(0, 1000) : null,
        source: body.source ? String(body.source).slice(0, 40) : 'manual',
        status: body.status ? String(body.status).slice(0, 40) : 'saved',
        fit_score: Number.isFinite(Number(body.fitScore)) ? Number(body.fitScore) : null,
        notes: body.notes ? String(body.notes).slice(0, 4000) : null,
        metadata: {}
      })
      .select(jobSelect)
      .single();

    if (safeTableMissing(error)) {
      return NextResponse.json({ migrationPending: true, error: 'job_applications is not available in Supabase yet' });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ application: data, migrationPending: false }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unsupported job-hunt action' }, { status: 400 });
}
