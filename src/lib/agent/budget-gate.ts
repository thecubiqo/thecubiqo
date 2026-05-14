import type { AgentAuth } from './common';
import { recordBudgetEvent } from './common';

export async function checkBudgetGate(
  auth: AgentAuth,
  input: { projectId: string; taskId?: string | null; traceId: string; projectedCostGbp?: number }
) {
  const projected = input.projectedCostGbp || 0;

  const { data: project } = await auth.supabase
    .from('duo_projects')
    .select('api_cost_gbp,budget_gate_gbp')
    .eq('id', input.projectId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const current = Number(project?.api_cost_gbp || 0);
  const limit = Number(project?.budget_gate_gbp || 5);
  const allowed = current + projected <= limit;

  await recordBudgetEvent(auth, {
    projectId: input.projectId,
    taskId: input.taskId || null,
    traceId: input.traceId,
    eventType: allowed ? 'budget_checked' : 'budget_blocked',
    amountGbp: projected,
    reason: allowed ? 'Within project budget gate' : 'Project budget gate reached',
    metadata: { current, projected, limit }
  });

  return { allowed, current, projected, limit };
}

export async function addProjectCost(
  auth: AgentAuth,
  input: { projectId: string; taskId?: string | null; traceId: string; amountGbp: number; reason: string }
) {
  const { data: project } = await auth.supabase
    .from('duo_projects')
    .select('api_cost_gbp')
    .eq('id', input.projectId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  const nextCost = Number(project?.api_cost_gbp || 0) + input.amountGbp;
  await auth.supabase
    .from('duo_projects')
    .update({ api_cost_gbp: nextCost, updated_at: new Date().toISOString() })
    .eq('id', input.projectId)
    .eq('user_id', auth.user.id);

  await recordBudgetEvent(auth, {
    projectId: input.projectId,
    taskId: input.taskId || null,
    traceId: input.traceId,
    eventType: 'cost_recorded',
    amountGbp: input.amountGbp,
    reason: input.reason
  });
}
