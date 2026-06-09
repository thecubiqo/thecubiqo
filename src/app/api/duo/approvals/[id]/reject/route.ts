import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });
const rejectBodySchema = z.object({
  note: z.string().max(1000).optional(),
  reason: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'Invalid approval id' }, { status: 400 });
  const { id } = parsedParams.data;
  const parsedBody = rejectBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid rejection payload', issues: parsedBody.error.flatten() }, { status: 400 });
  }
  const body = parsedBody.data;
  const now = new Date().toISOString();
  const note = String(body.note || body.reason || '').slice(0, 1000);

  const { data: approval, error } = await auth.supabase
    .from('duo_approvals')
    .update({
      status: 'rejected',
      rejection_note: note || 'Draft kept, nothing sent.',
      decided_at: now,
      updated_at: now
    })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('id,trace_id,project_id,task_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (approval.task_id) {
    await auth.supabase
      .from('duo_tasks')
      .update({ status: 'blocked', last_error: note || 'User rejected approval', updated_at: now })
      .eq('id', approval.task_id)
      .eq('user_id', auth.user.id);
  }

  if (approval.project_id && approval.trace_id) {
    await writeTimeline(auth, {
      projectId: approval.project_id,
      taskId: approval.task_id,
      traceId: approval.trace_id,
      eventType: 'approval_rejected',
      message: note || 'User rejected approval',
      payload: { approvalId: approval.id }
    });
  }

  return NextResponse.json({ approval });
}
