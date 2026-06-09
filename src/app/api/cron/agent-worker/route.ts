/**
 * GET /api/cron/agent-worker
 * Runs every 5 minutes. Two responsibilities:
 *
 * 1. JOB EXECUTION — pulls queued jobs, executes them, handles retry/dead-letter.
 * 2. SELF-REPORTING (push not pull) — after each run, checks system health thresholds
 *    and pushes alerts to affected users if anything is broken. No admin needed.
 *
 * Thresholds that trigger push alerts:
 *   - Dead-letter spike:     >3 dead jobs in last 60 min
 *   - Cost spike:            >£10 spent across all users in last 24h
 *   - Expired connectors:    any user_connector with status 'expired'
 *   - Cron failure:          any job_run with status 'failed' in last 2h
 *   - Approval backlog:      any duo_approval pending >4h
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { executeTask } from '@/next/lib/agent/worker';
import { sendReportEmail, reportHtml } from '@/next/lib/email/send';

const OWNER_EMAIL = 'aditya@cubiqo.ai';

export const runtime = 'nodejs';
export const maxDuration = 55;

// ── Threshold configuration (can be env-overridden) ─────────────────────────
const DEAD_LETTER_THRESHOLD = parseInt(process.env.SELF_REPORT_DEAD_THRESHOLD || '3', 10);
const COST_SPIKE_GBP        = parseFloat(process.env.SELF_REPORT_COST_SPIKE_GBP || '10');
const APPROVAL_BACKLOG_MINS = parseInt(process.env.SELF_REPORT_APPROVAL_BACKLOG_MINS || '240', 10);

// ── Push helper (in-app + VAPID push) ────────────────────────────────────────
async function pushAlert(supabase: any, userId: string, title: string, message: string, url = '/') {
  // Write in-app notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'self_report_alert',
    title: title.slice(0, 100),
    message: message.slice(0, 500),
    action_url: url,
    read: false,
  }).catch(() => null); // non-fatal

  // Attempt push delivery via internal push/send endpoint
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://cubiqo.ai';
    await fetch(`${base}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cubiqo-internal': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({ userId, title, message, url }),
    });
  } catch { /* push failure is non-fatal */ }
}

// ── Health check: per-user broken connectors ─────────────────────────────────
async function checkExpiredConnectors(supabase: any): Promise<number> {
  const { data } = await supabase
    .from('user_connectors')
    .select('user_id, platform')
    .eq('status', 'expired')
    .limit(50);

  if (!data?.length) return 0;

  // Group by user
  const byUser = new Map<string, string[]>();
  for (const row of data) {
    const platforms = byUser.get(row.user_id) ?? [];
    platforms.push(row.platform);
    byUser.set(row.user_id, platforms);
  }

  for (const [userId, platforms] of byUser) {
    await pushAlert(
      supabase, userId,
      'Connector needs re-authentication',
      `${platforms.slice(0, 3).join(', ')} connector${platforms.length > 1 ? 's have' : ' has'} expired. Re-connect to restore agentic capabilities.`,
      '/connectors'
    );
  }
  return byUser.size;
}

// ── Health check: dead-letter spike ─────────────────────────────────────────
async function checkDeadLetterSpike(supabase: any): Promise<{ count: number; userIds: string[] }> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('dead_letter_jobs')
    .select('id, trace_id, job_type')
    .gte('created_at', since)
    .limit(100);

  const count = data?.length ?? 0;
  if (count < DEAD_LETTER_THRESHOLD) return { count, userIds: [] };

  // Find owner via agent_job_queue → trace
  const { data: adminUsers } = await supabase
    .from('admin_roles')
    .select('user_id')
    .eq('role', 'owner')
    .is('revoked_at', null)
    .limit(5);

  const userIds = (adminUsers ?? []).map((r: any) => r.user_id);

  for (const userId of userIds) {
    await pushAlert(
      supabase, userId,
      `⚠️ ${count} jobs failed in the last hour`,
      `The dead-letter queue has ${count} jobs. Check /admin for details and recommended fixes.`,
      '/admin'
    );
  }

  // Email owner directly for dead-letter spikes
  await sendReportEmail({
    to: OWNER_EMAIL,
    subject: `🚨 CubiQo Alert — ${count} dead-letter jobs in last hour`,
    html: reportHtml('Dead-letter spike detected', [
      { heading: 'Count', body: `${count} jobs in the dead-letter queue (last 60 min)` },
      { heading: 'Action', body: 'Check /admin/cron-health for details and retry options.' },
    ]),
  }).catch(() => null);

  return { count, userIds };
}

// ── Health check: cost spike ─────────────────────────────────────────────────
async function checkCostSpike(supabase: any): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Check budget_events for total cost
  const { data } = await supabase
    .from('budget_events')
    .select('amount_gbp, user_id')
    .gte('created_at', since)
    .limit(5000);

  if (!data?.length) return 0;

  // Sum per user
  const totals = new Map<string, number>();
  for (const row of data) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + parseFloat(row.amount_gbp || 0));
  }

  let alertsSent = 0;
  for (const [userId, total] of totals) {
    if (total >= COST_SPIKE_GBP) {
      await pushAlert(
        supabase, userId,
        `Cost alert: £${total.toFixed(2)} in 24h`,
        `Your agentic tasks have spent £${total.toFixed(2)} in the last 24 hours. Review active projects or adjust your budget gate.`,
        '/duo'
      );
      alertsSent++;
    }
  }
  return alertsSent;
}

// ── Health check: approval backlog ───────────────────────────────────────────
async function checkApprovalBacklog(supabase: any): Promise<number> {
  const cutoff = new Date(Date.now() - APPROVAL_BACKLOG_MINS * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('duo_approvals')
    .select('user_id, id, approval_type')
    .eq('status', 'requested')
    .lt('created_at', cutoff)
    .limit(100);

  if (!data?.length) return 0;

  const byUser = new Map<string, number>();
  for (const row of data) {
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + 1);
  }

  for (const [userId, count] of byUser) {
    await pushAlert(
      supabase, userId,
      `${count} approval${count > 1 ? 's' : ''} waiting for your review`,
      `${count} task${count > 1 ? 's have' : ' has'} been waiting for approval for over ${APPROVAL_BACKLOG_MINS / 60}h. Review to keep your projects moving.`,
      '/duo'
    );
  }
  return byUser.size;
}

// ── Health check: failed cron jobs ───────────────────────────────────────────
async function checkCronFailures(supabase: any): Promise<number> {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('job_runs')
    .select('job_name, error')
    .eq('status', 'failed')
    .gte('started_at', since)
    .limit(20);

  if (!data?.length) return 0;

  const { data: admins } = await supabase
    .from('admin_roles')
    .select('user_id')
    .eq('role', 'owner')
    .is('revoked_at', null)
    .limit(3);

  const userIds = (admins ?? []).map((r: any) => r.user_id);
  const failedJobs = [...new Set((data ?? []).map((r: any) => r.job_name))];

  for (const userId of userIds) {
    await pushAlert(
      supabase, userId,
      `Cron failure: ${failedJobs.slice(0, 2).join(', ')}`,
      `${failedJobs.length} cron job${failedJobs.length > 1 ? 's' : ''} failed in the last 2h: ${failedJobs.join(', ')}. Check /admin/cron-health.`,
      '/admin'
    );
  }
  return failedJobs.length;
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const workerId = `worker-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // ── Phase 1: Execute queued jobs ──────────────────────────────────────────
  const { data: jobs, error } = await supabase
    .from('agent_job_queue')
    .select('*')
    .eq('state', 'queued')
    .lte('run_after', now)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: any[] = [];
  for (const job of jobs || []) {
    // Atomic claim: only proceed if THIS update flipped the row from 'queued'.
    // Without verifying the claim, two concurrent worker ticks could both read
    // the same queued job and execute it twice (double API spend / side-effects).
    const { data: claimed } = await supabase
      .from('agent_job_queue')
      .update({
        state: 'running',
        status: 'running',
        locked_by: workerId,
        locked_at: new Date().toISOString(),
        attempts: Number(job.attempts || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
      .eq('state', 'queued')
      .select('id');

    if (!claimed || claimed.length === 0) {
      // Lost the race — another worker already claimed this job. Skip it.
      continue;
    }

    const payloadUserId = job.user_id || job.payload?.userId || job.payload?.user_id;

    try {
      let result: any = { status: 'skipped', message: 'No executable task on job' };
      if (job.job_type === 'execute_task' && job.task_id && payloadUserId) {
        result = await executeTask({ supabase, user: { id: payloadUserId } }, job.task_id);
      }

      await supabase
        .from('agent_job_queue')
        .update({
          state: result.status === 'failed' ? 'failed' : 'completed',
          status: result.status === 'failed' ? 'failed' : 'completed',
          last_error: result.status === 'failed' ? result.message : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      results.push({ jobId: job.id, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown worker error';
      const attempts = Number(job.attempts || 0) + 1;
      if (attempts >= Number(job.max_attempts || 3)) {
        await supabase.from('dead_letter_jobs').insert({
          original_job_id: job.id,
          trace_id: job.trace_id || null,
          job_type: job.job_type,
          payload: job.payload || {},
          error_history: [{ error: message, attempts, failed_at: new Date().toISOString() }]
        });
      }
      await supabase
        .from('agent_job_queue')
        .update({
          state: attempts >= Number(job.max_attempts || 3) ? 'dead' : 'queued',
          status: attempts >= Number(job.max_attempts || 3) ? 'dead' : 'queued',
          last_error: message,
          run_after: new Date(Date.now() + attempts * 60_000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      results.push({ jobId: job.id, error: message });
    }
  }

  // ── Phase 2: Self-reporting health checks (push not pull) ────────────────
  // Run on every 3rd worker tick to avoid hammering the DB every 5 min.
  // Use a simple modulo on the current minute.
  const minute = new Date().getUTCMinutes();
  const healthReport: Record<string, any> = {};

  if (minute % 15 === 0) {
    // Every 15 minutes: check connectors + approvals (user-facing)
    const [expiredCount, approvalCount] = await Promise.all([
      checkExpiredConnectors(supabase).catch(() => 0),
      checkApprovalBacklog(supabase).catch(() => 0),
    ]);
    healthReport.expiredConnectors = expiredCount;
    healthReport.approvalBacklog = approvalCount;
  }

  if (minute % 30 === 0) {
    // Every 30 minutes: check cost + dead-letter (admin/owner-facing)
    const [deadLetterInfo, costAlerts] = await Promise.all([
      checkDeadLetterSpike(supabase).catch(() => ({ count: 0, userIds: [] })),
      checkCostSpike(supabase).catch(() => 0),
    ]);
    healthReport.deadLetterCount = deadLetterInfo.count;
    healthReport.costAlerts = costAlerts;
  }

  if (minute % 60 === 0) {
    // Every hour: check cron failures
    healthReport.cronFailures = await checkCronFailures(supabase).catch(() => 0);
  }

  return NextResponse.json({
    workerId,
    processed: results.length,
    results,
    healthReport: Object.keys(healthReport).length ? healthReport : 'skipped_this_tick',
  });
}
