import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { executeTask } from '@/next/lib/agent/worker';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('x-cubiqo-internal') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const workerId = `worker-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from('agent_job_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('run_after', now)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: any[] = [];
  for (const job of jobs || []) {
    await supabase
      .from('agent_job_queue')
      .update({
        status: 'running',
        locked_by: workerId,
        locked_until: new Date(Date.now() + 60_000).toISOString(),
        attempts: Number(job.attempts || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
      .eq('status', 'queued');

    try {
      let result: any = { status: 'skipped', message: 'No executable task on job' };
      if (job.job_type === 'execute_task' && job.task_id && job.user_id) {
        result = await executeTask({ supabase, user: { id: job.user_id } }, job.task_id);
      }

      await supabase
        .from('agent_job_queue')
        .update({
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
          user_id: job.user_id,
          project_id: job.project_id,
          task_id: job.task_id,
          trace_id: job.trace_id,
          job_type: job.job_type,
          payload: job.payload || {},
          error: message,
          attempts
        });
      }

      await supabase
        .from('agent_job_queue')
        .update({
          status: attempts >= Number(job.max_attempts || 3) ? 'dead' : 'queued',
          last_error: message,
          run_after: new Date(Date.now() + attempts * 60_000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      results.push({ jobId: job.id, error: message });
    }
  }

  return NextResponse.json({ workerId, processed: results.length, results });
}
