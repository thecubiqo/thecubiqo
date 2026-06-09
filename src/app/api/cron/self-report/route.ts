import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { sendReportEmail, reportHtml } from '@/next/lib/email/send';

export const runtime = 'nodejs';

const OWNER_EMAIL = 'aditya@cubiqo.ai';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  const key = `self-report:${today}`;
  const { data: existing } = await supabase.from('job_runs').select('id').eq('idempotency_key', key).maybeSingle();
  if (existing) return NextResponse.json({ skipped: true, idempotencyKey: key });

  const { data: run } = await supabase
    .from('job_runs')
    .insert({ job_name: 'self-report', status: 'running', idempotency_key: key, metadata: { date: today } })
    .select('id')
    .single();

  // ── Gather metrics ─────────────────────────────────────────────────────────
  const since = `${today}T00:00:00.000Z`;

  const [
    projects, tasks, toolCalls, failedTasks,
    deadLetters, costRows, users, connectorExpired,
  ] = await Promise.all([
    supabase.from('duo_projects').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('duo_tasks').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('agent_tool_calls').select('*', { count: 'exact', head: true }).gte('started_at', since),
    supabase.from('duo_tasks').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', since),
    supabase.from('dead_letter_jobs').select('*', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('budget_events').select('amount_gbp').gte('created_at', since).limit(5000),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_connectors').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
  ]);

  const totalCostGbp = (costRows.data ?? [])
    .reduce((sum: number, r: any) => sum + parseFloat(r.amount_gbp || 0), 0)
    .toFixed(4);

  const metrics = {
    date: today,
    projectsCreated: projects.count ?? 0,
    tasksCreated: tasks.count ?? 0,
    toolCalls: toolCalls.count ?? 0,
    failedTasks: failedTasks.count ?? 0,
    deadLetters: deadLetters.count ?? 0,
    costGbp: totalCostGbp,
    totalUsers: users.count ?? 0,
    expiredConnectors: connectorExpired.count ?? 0,
  };

  // ── Write to DB ────────────────────────────────────────────────────────────
  await supabase.from('self_reports').upsert({
    report_date: today,
    active_projects: metrics.projectsCreated,
    failed_tasks: metrics.failedTasks,
    cron_summary: metrics,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'report_date' });

  await supabase.from('job_runs').update({
    status: 'completed',
    metadata: metrics,
  }).eq('id', run?.id);

  // ── Email report to owner ──────────────────────────────────────────────────
  const statusLine = metrics.failedTasks > 0 || metrics.deadLetters > 0
    ? `⚠️ ${metrics.failedTasks} failed tasks, ${metrics.deadLetters} dead letters`
    : '✅ All systems nominal';

  const emailResult = await sendReportEmail({
    to: OWNER_EMAIL,
    subject: `CubiQo Daily Report — ${today}`,
    html: reportHtml(`Daily Report — ${today}`, [
      { heading: 'Status', body: statusLine },
      { heading: 'Activity', body: `Projects: ${metrics.projectsCreated} · Tasks: ${metrics.tasksCreated} · Tool calls: ${metrics.toolCalls}` },
      { heading: 'Failures', body: `Failed tasks: ${metrics.failedTasks} · Dead letters: ${metrics.deadLetters}` },
      { heading: 'Cost (today)', body: `£${metrics.costGbp}` },
      { heading: 'Platform', body: `Total users: ${metrics.totalUsers} · Expired connectors: ${metrics.expiredConnectors}` },
    ]),
    text: `CubiQo Daily Report ${today}\n\n${statusLine}\n\nActivity: ${metrics.tasksCreated} tasks, ${metrics.toolCalls} tool calls\nCost: £${metrics.costGbp}\nFailed: ${metrics.failedTasks} tasks\nDead letters: ${metrics.deadLetters}`,
  });

  return NextResponse.json({
    skipped: false,
    idempotencyKey: key,
    metrics,
    email: emailResult,
  });
}
