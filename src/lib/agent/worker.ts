import type { DuoExecutionResult } from '@/next/types/duo';
import type { AgentAuth } from './common';
import { writeTimeline, writeToolCall } from './common';
import { checkBudgetGate, addProjectCost } from './budget-gate';
import { decideRoute } from './decision-router';

function previewForTask(task: any, route: string) {
  return [
    `Task: ${task.title}`,
    `Action route: ${route}`,
    `Draft only unless the user explicitly approves the final action.`,
    '',
    task.description || 'No task description provided.'
  ].join('\n');
}

async function createApproval(auth: AgentAuth, task: any, route: string) {
  const preview = previewForTask(task, route);

  // action_approvals is the canonical approval table for Phase B (no separate duo_approvals)
  const { data: approval, error } = await auth.supabase
    .from('action_approvals')
    .insert({
      user_id: auth.user.id,
      trace_id: task.trace_id,
      project_id: task.project_id,
      task_id: task.id,
      action_type: 'duo_external_action',
      tool_name: route,
      status: 'requested',
      title: `Approve: ${task.title}`,
      summary: task.description || task.title,
      preview_content: preview,
      payload: {
        platform: task.connector_platform || route,
        route,
        risk_level: task.risk_level || 'medium'
      },
      risk_level: (['low', 'medium', 'high'].includes(task.risk_level) ? task.risk_level : 'high') as 'low' | 'medium' | 'high',
      reversible: false,
      requires_user_confirmation: task.risk_level === 'critical' || task.risk_level === 'high',
      user_confirmation_state: task.risk_level === 'critical' ? 'pending' : 'not_required',
      warning_message: 'CubiQo will not perform final send, submit, publish, checkout, payment, or deploy actions without explicit approval.',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return approval.id as string;
}

export async function executeTask(auth: AgentAuth, taskId: string): Promise<DuoExecutionResult> {
  const { data: task, error } = await auth.supabase
    .from('duo_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error || !task) {
    return { status: 'failed', taskId, message: error?.message || 'Task not found' };
  }

  if (task.status === 'completed') {
    return { status: 'already_executed', taskId, message: 'Task was already completed' };
  }

  const budget = await checkBudgetGate(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id,
    projectedCostGbp: 0.02
  });
  if (!budget.allowed) {
    await auth.supabase.from('duo_tasks').update({ status: 'blocked', last_error: 'Budget gate reached' }).eq('id', task.id);
    await writeTimeline(auth, {
      projectId: task.project_id,
      taskId: task.id,
      traceId: task.trace_id,
      eventType: 'task_budget_blocked',
      message: `Budget gate blocked task: ${task.title}`,
      payload: budget
    });
    return { status: 'blocked', taskId, message: 'Budget gate reached' };
  }

  const decision = await decideRoute(auth, task);
  await auth.supabase
    .from('duo_tasks')
    .update({
      selected_route: decision.selectedRoute,
      assigned_route: decision.selectedRoute,
      fallback_route: decision.fallbackRoute,
      approval_required: decision.approvalRequired,
      status: decision.approvalRequired ? 'waiting_approval' : 'running',
      attempts: Number(task.attempts || 0) + 1,
      updated_at: new Date().toISOString(),
      metadata: { ...(task.metadata || {}), routeDecision: decision }
    })
    .eq('id', task.id)
    .eq('user_id', auth.user.id);

  await writeTimeline(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id,
    eventType: 'route_selected',
    message: `Selected ${decision.selectedRoute} for ${task.title}`,
    payload: { ...decision }
  });

  if (decision.approvalRequired) {
    const approvalId = await createApproval(auth, task, decision.selectedRoute);
    await writeTimeline(auth, {
      projectId: task.project_id,
      taskId: task.id,
      traceId: task.trace_id,
      eventType: 'approval_requested',
      message: `Approval requested for: ${task.title}`,
      payload: { approvalId }
    });
    return { status: 'waiting_approval', taskId, approvalId, message: 'Task paused for approval' };
  }

  await writeToolCall(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id,
    toolName: 'duo_deterministic_worker',
    route: decision.selectedRoute,
    status: 'completed',
    input: { title: task.title },
    output: { result: 'Prepared a safe internal draft/evidence item' },
    apiCostGbp: 0.02
  });

  await addProjectCost(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id,
    amountGbp: 0.02,
    reason: 'duo deterministic task execution'
  });

  await auth.supabase
    .from('duo_tasks')
    .update({
      status: 'completed',
      result: 'Completed safely inside CubiQo. No external final action was taken.',
      evidence: { route: decision.selectedRoute, completedAt: new Date().toISOString() },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', task.id)
    .eq('user_id', auth.user.id);

  await writeTimeline(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id,
    eventType: 'task_completed',
    message: `Completed safely: ${task.title}`,
    payload: { route: decision.selectedRoute }
  });

  return { status: 'completed', taskId, message: 'Task completed safely' };
}
