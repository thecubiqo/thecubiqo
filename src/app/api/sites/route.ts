import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const slugPattern = /^[a-z0-9][a-z0-9-]{2,62}$/;

const normalizeSlug = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const [sites, templates] = await Promise.all([
    auth.supabase
      .from('sites')
      .select('id,slug,title,status,content,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false }),
    auth.supabase.from('site_templates').select('id,slug,name,category,config').order('name')
  ]);

  if (safeTableMissing(sites.error) || safeTableMissing(templates.error)) {
    return NextResponse.json({
      migrationPending: true,
      sites: [],
      templates: [],
      error: 'sites or site_templates is not available in Supabase yet'
    });
  }

  const error = sites.error || templates.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    migrationPending: false,
    sites: sites.data || [],
    templates: templates.data || []
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const slug = normalizeSlug(body.slug || body.title);
  const title = String(body.title || '').trim().slice(0, 120);

  if (!title || !slugPattern.test(slug)) {
    return NextResponse.json({ error: 'Valid title and slug are required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('sites')
    .insert({
      user_id: auth.user.id,
      slug,
      title,
      template_id: body.templateId || null,
      status: 'draft',
      content: typeof body.content === 'object' && body.content !== null ? body.content : {}
    })
    .select('id,slug,title,status,content,created_at,updated_at')
    .single();

  if (safeTableMissing(error)) {
    return NextResponse.json({ migrationPending: true, error: 'sites is not available in Supabase yet' });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ site: data, migrationPending: false }, { status: 201 });
}
