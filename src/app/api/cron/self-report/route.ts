import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cubiqo-internal') !== secret) {
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

  const [projects, tasks, toolCalls, failures] = await Promise.all([
    supabase.from('duo_projects').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00.000Z`),
    supabase.from('duo_tasks').select('*', { count: 'exact', head: true }).gte('created_at', `${today}T00:00:00.000Z`),
    supabase.from('duo_tool_calls').select('*', { count: 'exact', head: true }).gte('started_at', `${today}T00:00:00.000Z`),
    supabase.from('duo_tasks').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', `${today}T00:00:00.000Z`)
  ]);

  const metrics = {
    projectsCreated: projects.count || 0,
    tasksCreated: tasks.count || 0,
    toolCalls: toolCalls.count || 0,
    failedTasks: failures.count || 0
  };

  await supabase.from('self_reports').upsert({
    report_date: today,
    active_projects: metrics.projectsCreated,
    failed_tasks: metrics.failedTasks,
    cron_summary: metrics,
    generated_at: new Date().toISOString()
  }, { onConflict: 'report_date' });

  await supabase.from('job_runs').update({
    status: 'completed',
    metadata: metrics
  }).eq('id', run?.id);

  return NextResponse.json({ skipped: false, idempotencyKey: key, metrics });
}
