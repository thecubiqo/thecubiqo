import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { dispatchNotification } from '@/next/lib/notifications/dispatcher';
import { generateNudge } from '@/next/lib/proactive/nudge-generator';
import { evaluateProactiveTriggers } from '@/next/lib/proactive/trigger-evaluator';

export const runtime = 'nodejs';
export const maxDuration = 55;

function hasInternalSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get('x-cubiqo-internal') === expected || request.headers.get('x-cron-secret') === expected;
}

function windowKey() {
  const now = new Date();
  const hour = Math.floor(now.getUTCHours() / 4) * 4;
  return `${now.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}`;
}

async function acquireLock(supabase: any, idempotencyKey: string) {
  const payload = {
    job_name: 'proactive',
    status: 'running',
    idempotency_key: idempotencyKey,
    dedupe_key: idempotencyKey,
    metadata: { window: idempotencyKey }
  };

  const { data, error } = await supabase.from('job_runs').insert(payload).select('id').maybeSingle();
  if (error?.code === '23505') return { locked: false, id: null, error: null };
  return { locked: Boolean(data?.id && !error), id: data?.id ?? null, error };
}

async function finishLock(supabase: any, id: string | null, status: 'succeeded' | 'failed', metadata: Record<string, unknown>, error?: string) {
  if (!id) return;
  await supabase
    .from('job_runs')
    .update({
      status,
      metadata,
      error: error || null,
      finished_at: new Date().toISOString()
    })
    .eq('id', id);
}

export async function GET(request: NextRequest) {
  if (!hasInternalSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const key = `proactive:${windowKey()}`;
  const lock = await acquireLock(supabase, key);
  if (lock.error) return NextResponse.json({ error: lock.error.message }, { status: 500 });
  if (!lock.locked) return NextResponse.json({ ok: true, skipped: true, idempotencyKey: key });

  const created: Array<{ userId: string; type: string; interventionId: string | null; notificationId: string | null }> = [];

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id,last_seen_at')
      .not('id', 'is', null)
      .gt('last_seen_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order('last_seen_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    for (const user of users || []) {
      const [trigger] = await evaluateProactiveTriggers(supabase, { id: user.id });
      if (!trigger) continue;

      const nudge = generateNudge(trigger);
      const { data: intervention } = await supabase
        .from('interventions_log')
        .insert({
          user_id: user.id,
          intervention_type: nudge.type,
          signal_id: trigger.signalId || null,
          message_sent: nudge.body,
          delivered_via: 'in_app',
          metadata: {
            ...nudge.metadata,
            priority: trigger.priority,
            reason: trigger.reason,
            actionUrl: nudge.actionUrl,
            actionLabel: nudge.actionLabel,
            source: 'cron/proactive'
          }
        })
        .select('id')
        .maybeSingle();

      const notification = await dispatchNotification({
        userId: user.id,
        type: nudge.type,
        title: nudge.title,
        body: nudge.body,
        actionUrl: nudge.actionUrl,
        actionLabel: nudge.actionLabel,
        channels: nudge.channels,
        metadata: { ...nudge.metadata, interventionId: intervention?.id ?? null }
      });

      created.push({
        userId: user.id,
        type: nudge.type,
        interventionId: intervention?.id ?? null,
        notificationId: notification.notificationId
      });
    }

    await finishLock(supabase, lock.id, 'succeeded', { processed: users?.length || 0, created: created.length });
    return NextResponse.json({ ok: true, processed: users?.length || 0, created, idempotencyKey: key });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'proactive cron failed';
    await finishLock(supabase, lock.id, 'failed', { created: created.length }, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
