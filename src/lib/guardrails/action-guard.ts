import type { AgentAuth } from '@/next/lib/agent/common';
import { writeTimeline } from '@/next/lib/agent/common';

const FINAL_ACTION_RE = /\b(submit|send|publish|pay|purchase|buy|transfer|trade|apply|delete|cancel|book|order|checkout)\b/i;

export function requiresFinalActionApproval(text: string) {
  return FINAL_ACTION_RE.test(text);
}

export async function createFinalActionApproval(
  auth: AgentAuth,
  input: {
    projectId: string;
    taskId: string;
    traceId: string;
    actionType: string;
    previewContent: string;
    reversible?: boolean;
  },
) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await auth.supabase
    .from('duo_approvals')
    .insert({
      user_id: auth.user.id,
      project_id: input.projectId,
      task_id: input.taskId,
      trace_id: input.traceId,
      action_type: input.actionType,
      preview_content: input.previewContent,
      status: 'pending',
      reversible: Boolean(input.reversible),
      expires_at: expiresAt,
    })
    .select('*')
    .single();

  if (error) return { status: 'failed' as const, reason: error.message };

  await auth.supabase
    .from('duo_tasks')
    .update({ status: 'waiting_approval', updated_at: new Date().toISOString() })
    .eq('id', input.taskId)
    .eq('user_id', auth.user.id);

  await writeTimeline(auth, {
    projectId: input.projectId,
    taskId: input.taskId,
    traceId: input.traceId,
    eventType: 'approval_required',
    message: 'Final action approval required',
    payload: { approval_id: data.id, action_type: input.actionType },
  });

  return { status: 'completed' as const, approval: data };
}
