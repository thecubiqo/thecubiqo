import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid approval id' }, { status: 400 });
  const { id } = parsed.data;
  const now = new Date().toISOString();

  const { data: approval, error } = await auth.supabase
    .from('duo_approvals')
    .update({ status: 'approved', decided_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .gt('expires_at', now)
    .select('id,trace_id,project_id,task_id,preview_content,reversible')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (approval.task_id) {
    // Do NOT reset the task to 'ready' — worker.executeTask resumes gated
    // tasks from their 'draft' / 'waiting_approval' status plus the approved
    // approval row. Resetting caused an infinite re-draft→re-approve loop.
    // Enqueue a resume job so the cron worker picks it up promptly.
    // ignoreDuplicates: a re-approve must NOT reset an already-running/completed
    // resume job back to 'queued' (double execution). One resume job per approval.
    await auth.supabase.from('agent_job_queue').upsert({
      user_id: auth.user.id,
      project_id: approval.project_id,
      task_id: approval.task_id,
      trace_id: approval.trace_id,
      job_type: 'execute_task',
      state: 'queued',
      status: 'queued',
      locked_by: null,
      payload: { userId: auth.user.id, taskId: approval.task_id },
      idempotency_key: `resume:${approval.task_id}:${approval.id}`,
    }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
  }

  if (approval.project_id && approval.trace_id) {
    await writeTimeline(auth, {
      projectId: approval.project_id,
      taskId: approval.task_id,
      traceId: approval.trace_id,
      eventType: 'approval_approved',
      message: `User approved: ${(approval.preview_content || '').slice(0, 120)}`,
      payload: { approvalId: approval.id }
    });
  }

  return NextResponse.json({ approval: { ...approval, reversible: Boolean(approval.reversible) } });
}
