import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { isAuthorizedCron } from '@/next/app/api/_lib/cron-auth';
import { dispatchNotification } from '@/next/lib/notifications/dispatcher';
import { generateMorningBriefing } from '@/next/lib/proactive/nudge-generator';

export const runtime = 'nodejs';
export const maxDuration = 55;

// Accept both Vercel Bearer cron auth and internal-header auth (see cron-auth).
function hasInternalSecret(request: NextRequest) {
  return isAuthorizedCron(request);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!hasInternalSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const idempotencyKey = `briefings:${todayKey()}`;
  const { data: existing } = await supabase
    .from('job_runs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true, skipped: true, idempotencyKey });

  const { data: run } = await supabase.from('job_runs').insert({
    job_name: 'briefings',
    status: 'running',
    idempotency_key: idempotencyKey,
    dedupe_key: idempotencyKey,
    metadata: { date: todayKey() }
  }).select('id').maybeSingle();

  const sent: Array<{ userId: string; notificationId: string | null }> = [];
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id,last_seen_at,daily_context')
      .not('id', 'is', null)
      .gt('last_seen_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order('last_seen_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    for (const profile of profiles || []) {
      const [{ data: rgy }, { count: openProjects }, { count: pendingApprovals }, { count: socialItems }] = await Promise.all([
        supabase.from('rgy_status').select('status').eq('user_id', profile.id).maybeSingle(),
        supabase.from('duo_projects').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).in('status', ['planning', 'working', 'blocked', 'waiting_user', 'waiting_approval']),
        supabase.from('duo_approvals').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('status', 'pending').gt('expires_at', new Date().toISOString()),
        supabase.from('social_activity_feed').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const briefing = generateMorningBriefing({
        rgyStatus: rgy?.status ?? null,
        openProjects: openProjects || 0,
        pendingApprovals: pendingApprovals || 0,
        socialItems: socialItems || 0,
        observation: profile.daily_context ? String(profile.daily_context).split('\n')[0] : null
      });

      const notification = await dispatchNotification({
        userId: profile.id,
        type: 'morning_briefing',
        title: briefing.title,
        body: briefing.body,
        actionUrl: briefing.actionUrl,
        actionLabel: briefing.actionLabel,
        channels: ['in_app', 'push'],
        metadata: { source: 'cron/briefings', date: todayKey() }
      });

      await supabase.from('interventions_log').insert({
        user_id: profile.id,
        intervention_type: 'morning_briefing',
        message_sent: briefing.body,
        delivered_via: 'in_app',
        metadata: { notificationId: notification.notificationId, source: 'cron/briefings' }
      });

      sent.push({ userId: profile.id, notificationId: notification.notificationId });
    }

    await supabase.from('job_runs').update({
      status: 'succeeded',
      metadata: { sent: sent.length },
      finished_at: new Date().toISOString()
    }).eq('id', run?.id);

    return NextResponse.json({ ok: true, sent, idempotencyKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'briefings cron failed';
    await supabase.from('job_runs').update({
      status: 'failed',
      error: message,
      metadata: { sent: sent.length },
      finished_at: new Date().toISOString()
    }).eq('id', run?.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
