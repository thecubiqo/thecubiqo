import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';
import { resolveStorageUrl } from '../../_lib/storage-url';

export const runtime = 'nodejs';

const TRACKER_STATUSES = [
  'discovered',
  'matched',
  'saved',
  'drafted',
  'tailoring',
  'questions_needed',
  'ready',
  'ready_to_apply',
  'applying',
  'ready_to_submit',
  'submitted',
  'applied',
  'response',
  'interview',
  'offer',
  'failed',
  'cancelled',
  'rejected',
  'withdrawn'
] as const;

type TrackerStatus = typeof TRACKER_STATUSES[number];

const STATUS_ALIASES: Record<string, TrackerStatus> = {
  discovered: 'saved',
  pending: 'saved',
  reviewing: 'drafted',
  prepared: 'ready',
  approved_for_submission: 'ready',
  submitted: 'applied',
  submitted_by_user: 'applied',
  in_progress: 'drafted',
  cancelled: 'withdrawn',
  archived: 'withdrawn'
};

function normalizeText(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function normalizeTrackerStatus(value: unknown): TrackerStatus | null {
  const raw = normalizeText(value, 60).toLowerCase().replace(/\s+/g, '_');
  if ((TRACKER_STATUSES as readonly string[]).includes(raw)) return raw as TrackerStatus;
  return STATUS_ALIASES[raw] || null;
}

function displayTrackerStatus(row: Record<string, any>) {
  return normalizeTrackerStatus(row?.metadata?.tracker_status) || normalizeTrackerStatus(row?.status) || 'saved';
}

function appDbStatus(status: TrackerStatus) {
  // The Phase 10 migration adds `applied` and `response` to job_applications.
  // Older rows still use `submitted`; display normalization keeps both valid.
  if (status === 'drafted') return 'in_progress';
  if (status === 'ready' || status === 'ready_to_apply') return 'ready_to_submit';
  if (status === 'applied' || status === 'response') return 'submitted';
  return status;
}

function listingDbStatus(status: TrackerStatus) {
  if (status === 'drafted') return 'prepared';
  if (status === 'ready_to_submit') return 'ready';
  if (status === 'submitted') return 'submitted';
  if (status === 'response') return 'applied';
  return status;
}

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

  // Sign each application's screenshot path once (private bucket), reuse below.
  const signedShot: Record<string, string | null> = {};
  await Promise.all(applications.map(async (a: any) => {
    signedShot[a.id] = await resolveStorageUrl(auth.supabase, a.screenshot_url);
  }));

  const appsByListing = applications.reduce((acc, app) => {
    if (!acc[app.listing_id]) acc[app.listing_id] = [];
    acc[app.listing_id].push({ ...app, screenshot_url: signedShot[app.id] ?? app.screenshot_url });
    return acc;
  }, {} as Record<string, any[]>);

  // Shape into pipeline stages. `trackerStatus` is the product-facing lifecycle;
  // raw `status` is kept for older records and platform runtime states.
  const pipeline = rows.map((l: any) => {
    const trackerStatus = displayTrackerStatus(l);
    return ({
    id: l.id,
    title: l.title,
    company: l.company,
    location: l.location,
    platform: l.source_platform,
    jobUrl: l.source_url,
    status: trackerStatus,
    rawStatus: l.status || 'discovered',
    trackerStatus,
    atsScore: l.metadata?.score || l.metadata?.ats_score || null,
    postedAt: l.metadata?.posted_at || l.created_at,
    salary: l.metadata?.salary || null,
    tailoringStatus: l.metadata?.tailoring_status || null,
    tailoredResumeId: l.metadata?.tailored_resume_id || null,
    applications: appsByListing[l.id] || [],
    createdAt: l.created_at,
    updatedAt: l.updated_at
  });
  });

  const applicationTracker = applications.map((app: any) => ({
    id: app.id,
    listingId: app.listing_id || null,
    status: displayTrackerStatus(app),
    rawStatus: app.status,
    trackerStatus: displayTrackerStatus(app),
    platform: app.platform,
    applyUrl: app.apply_url,
    submittedAt: app.submitted_at,
    screenshotUrl: signedShot[app.id] ?? app.screenshot_url,
    error: app.error,
    metadata: app.metadata || {},
    createdAt: app.created_at
  }));

  const stages = Object.fromEntries(
    TRACKER_STATUSES.map(status => [status, pipeline.filter((j: any) => j.trackerStatus === status)])
  );

  return NextResponse.json({
    pipeline,
    applications: applicationTracker,
    stages,
    statusLifecycle: TRACKER_STATUSES,
    counts: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, v.length])),
    total: pipeline.length
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = normalizeText(body.id, 100);
  const target = normalizeText(body.target || body.type || 'application', 40).toLowerCase();
  const status = normalizeTrackerStatus(body.status);
  const note = normalizeText(body.note, 1000);

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (!status) {
    return NextResponse.json({
      error: 'Unsupported status',
      allowedStatuses: TRACKER_STATUSES
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  if (target === 'listing' || target === 'job_listing') {
    const { data: existing, error: readError } = await auth.supabase
      .from('job_listings')
      .select('id,metadata')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (readError) {
      if (safeTableMissing(readError)) return missingMigrationResponse('jobs', 'job_listings');
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }
    if (!existing) return NextResponse.json({ error: 'Job listing not found' }, { status: 404 });

    const { data, error } = await auth.supabase
      .from('job_listings')
      .update({
        status: listingDbStatus(status),
        metadata: {
          ...(existing.metadata || {}),
          tracker_status: status,
          tracker_note: note || null,
          tracker_updated_at: now
        },
        updated_at: now
      })
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('id,status,metadata,updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: true, target: 'listing', status, listing: data });
  }

  const { data: existing, error: readError } = await auth.supabase
    .from('job_applications')
    .select('id,metadata,status')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (readError) {
    if (safeTableMissing(readError)) return missingMigrationResponse('job-apply', 'job_applications');
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Job application not found' }, { status: 404 });

  const update: Record<string, unknown> = {
    status: appDbStatus(status),
    metadata: {
      ...(existing.metadata || {}),
      tracker_status: status,
      tracker_note: note || null,
      tracker_updated_at: now,
      previous_status: existing.status
    }
  };
  if (status === 'applied') update.submitted_at = now;
  if (status === 'withdrawn') update.cancelled_at = now;

  const { data, error } = await auth.supabase
    .from('job_applications')
    .update(update)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('id,status,metadata,submitted_at,cancelled_at,updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true, target: 'application', status, application: data });
}
