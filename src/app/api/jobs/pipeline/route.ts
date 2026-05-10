import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

// GET /api/jobs/pipeline — returns all job pipeline items grouped by stage
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
  const stage = url.searchParams.get('stage'); // filter by stage

  let query = auth.supabase
    .from('job_listings')
    .select(`
      id, title, company, location, source_platform, source_url,
      status, description, metadata, created_at, updated_at
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (stage) query = query.eq('status', stage);

  const { data: listings, error } = await query;
  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('jobs', 'job_listings');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch applications linked to these listings
  const rows = (listings || []) as any[];
  const listingIds = rows.map((l: any) => l.id);
  let applications: any[] = [];
  if (listingIds.length) {
    const { data: apps } = await auth.supabase
      .from('job_applications')
      .select('id, listing_id, status, platform, apply_url, submitted_at, screenshot_url, error, metadata, created_at')
      .eq('user_id', auth.user.id)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false });
    applications = apps || [];
  }

  const appsByListing = applications.reduce((acc, app) => {
    if (!acc[app.listing_id]) acc[app.listing_id] = [];
    acc[app.listing_id].push(app);
    return acc;
  }, {} as Record<string, any[]>);

  // Shape into pipeline stages
  const pipeline = rows.map((l: any) => ({
    id: l.id,
    title: l.title,
    company: l.company,
    location: l.location,
    platform: l.source_platform,
    jobUrl: l.source_url,
    status: l.status || 'discovered',
    atsScore: l.metadata?.score || l.metadata?.ats_score || null,
    postedAt: l.metadata?.posted_at || l.created_at,
    salary: l.metadata?.salary || null,
    tailoringStatus: l.metadata?.tailoring_status || null,
    tailoredResumeId: l.metadata?.tailored_resume_id || null,
    applications: appsByListing[l.id] || [],
    createdAt: l.created_at,
    updatedAt: l.updated_at
  }));

  const stages = {
    discovered: pipeline.filter((j: any) => j.status === 'discovered'),
    tailoring: pipeline.filter((j: any) => j.status === 'tailoring'),
    ready: pipeline.filter((j: any) => j.status === 'ready' || j.status === 'prepared'),
    applying: pipeline.filter((j: any) => j.status === 'applying'),
    submitted: pipeline.filter((j: any) => ['submitted', 'applied'].includes(j.status)),
    failed: pipeline.filter((j: any) => j.status === 'failed'),
    interview: pipeline.filter((j: any) => j.status === 'interview')
  };

  return NextResponse.json({
    pipeline,
    stages,
    counts: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, v.length])),
    total: pipeline.length
  });
}
