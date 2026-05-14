import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const now = new Date().toISOString();

  // action_approvals is the canonical approval table (no separate duo_approvals)
  const { data: approval, error } = await auth.supabase
    .from('action_approvals')
    .update({ status: 'approved', decided_at: now, updated_at: now })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('id,trace_id,project_id,task_id,preview_content')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (approval.task_id) {
    await auth.supabase
      .from('duo_tasks')
      .update({ status: 'ready', updated_at: now })
      .eq('id', approval.task_id)
      .eq('user_id', auth.user.id);
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

  return NextResponse.json({ approval });
}
