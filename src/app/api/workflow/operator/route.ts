import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

// Phase B uses the canonical Postgres job queue first. This route remains as a
// compatibility trigger for callers that were aimed at the prototype Workflow
// route, but it no longer imports @vercel/workflow.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('x-cubiqo-internal') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const projectId = String(body.projectId || '').trim();
  const taskId = body.taskId ? String(body.taskId) : null;
  const traceId = body.traceId ? String(body.traceId) : null;
  const userId = body.userId ? String(body.userId) : null;

  if (!projectId && !taskId) {
    return NextResponse.json({ error: 'projectId or taskId required' }, { status: 400 });
  }

  // agent_job_queue uses 'state' (not 'status') and has no user_id column.
  // userId is stored in payload so the worker can retrieve it.
  const { data, error } = await supabase
    .from('agent_job_queue')
    .upsert({
      project_id: projectId || null,
      task_id: taskId,
      trace_id: traceId || crypto.randomUUID(),
      job_type: taskId ? 'execute_task' : 'advance_project',
      state: 'queued',
      payload: { ...body, userId },
      idempotency_key: `operator:${projectId || 'none'}:${taskId || 'project'}`,
      run_after: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'idempotency_key' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ queued: true, job: data });
}
