import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { isAuthorizedCron } from '@/next/app/api/_lib/cron-auth';
import { updateRGYStatus } from '@/next/lib/rgy/rgy-engine';

export const runtime = 'nodejs';
export const maxDuration = 55;

// Accept both Vercel Bearer cron auth and internal-header auth (see cron-auth).
function hasInternalSecret(request: NextRequest) {
  return isAuthorizedCron(request);
}

export async function GET(request: NextRequest) {
  if (!hasInternalSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id,last_seen_at')
    .not('id', 'is', null)
    .gt('last_seen_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
    .order('last_seen_at', { ascending: false })
    .limit(250);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const user of users || []) {
    const result = await updateRGYStatus(user.id).catch(() => null);
    results.push({ userId: user.id, status: result?.status ?? null, score: result?.score ?? null });
  }

  await supabase.from('job_runs').insert({
    job_name: 'rgy-eval',
    status: 'succeeded',
    idempotency_key: `rgy-eval:${new Date().toISOString().slice(0, 10)}`,
    dedupe_key: `rgy-eval:${new Date().toISOString().slice(0, 10)}`,
    metadata: { processed: results.length }
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ ok: true, processed: results.length, results });
}
