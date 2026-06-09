import type { DuoGoalInput } from '@/next/types/duo';
import type { AgentAuth } from './common';
import { inferDomainFromText, normalizeTraceId, slugTitle, writeTimeline } from './common';
import { interpretGoal } from './goal-interpreter';
import { buildTaskGraph } from './task-graph-builder';
import { matchPlaybook } from './playbook-matcher';

async function loadApprovedCapsule(auth: AgentAuth, capsuleId: string) {
  const { data, error } = await auth.supabase
    .from('capsule_briefings')
    .select('id,signal_id,domain,headline,status,recommended_actions,open_questions')
    .eq('id', capsuleId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'Capsule not found' };
  if (data.status !== 'approved') return { error: 'Capsule must be approved before Duo Mode can operate on it', status: data.status };
  return { capsule: data };
}

async function createTasks(auth: AgentAuth, projectId: string, traceId: string, tasks: ReturnType<typeof buildTaskGraph>) {
  const created: Array<{ id: string; title: string }> = [];

  for (const task of tasks) {
    const { data, error } = await auth.supabase
      .from('duo_tasks')
      .insert({
        user_id: auth.user.id,
        project_id: projectId,
        trace_id: traceId,
        title: task.title,
        description: task.description,
        status: 'pending',
        preferred_route: task.preferredRoute || null,
        route_preference: task.preferredRoute ? [task.preferredRoute] : [],
        connector_platform: task.connectorPlatform || null,
        risk_level: task.riskLevel,
        approval_required: task.approvalRequired,
        can_parallelize: task.canParallelize,
        idempotency_key: `${projectId}:${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        metadata: { dependsOnTitles: task.dependsOnTitles }
      })
      .select('id,title')
      .single();

    if (error) throw new Error(error.message);
    created.push(data);
  }

  for (const task of tasks) {
    const to = created.find(item => item.title === task.title);
    if (!to) continue;
    for (const title of task.dependsOnTitles || []) {
      const from = created.find(item => item.title === title);
      if (!from) continue;
      const { error } = await auth.supabase.from('duo_task_edges').insert({
        project_id: projectId,
        from_task_id: from.id,
        to_task_id: to.id,
        edge_type: 'blocks'
      });
      if (error) throw new Error(`Failed to create task edge: ${error.message}`);
    }
  }

  return created;
}

export async function createDuoProject(auth: AgentAuth, input: DuoGoalInput) {
  let goal = String(input.goal || '').trim();
  let capsule: any = null;

  if (input.capsuleId) {
    const loaded = await loadApprovedCapsule(auth, input.capsuleId);
    if ('error' in loaded) return { status: 'rejected' as const, reason: loaded.error, capsuleStatus: loaded.status || null };
    capsule = loaded.capsule;
    goal ||= capsule.headline || `Act on ${capsule.domain || 'this'} capsule`;
  }

  if (!goal) return { status: 'rejected' as const, reason: 'A goal or approved capsule is required' };

  const domain = input.domain || capsule?.domain || inferDomainFromText(goal);
  const interpretation = await interpretGoal(auth, { goal, domain });
  const playbook = await matchPlaybook(auth, goal, interpretation.domain);
  const traceId = normalizeTraceId();

  const { data: project, error } = await auth.supabase
    .from('duo_projects')
    .insert({
      user_id: auth.user.id,
      trace_id: traceId,
      title: slugTitle(goal),
      goal,
      domain: interpretation.domain,
      status: 'planning',
      success_criteria: interpretation.successCriteria,
      goal_interpretation: interpretation,
      constraints: input.constraints || {},
      risk_level: interpretation.riskLevel,
      playbook_id: playbook?.id || null,
      budget_gate_gbp: input.budgetGateGbp ?? 5,
      verbosity: input.verbosity || 'normal',
      metadata: {
        capsuleId: input.capsuleId || null,
        signalId: input.signalId || capsule?.signal_id || null,
        playbookName: playbook?.name || null
      }
    })
    .select('*')
    .single();

  if (error) return { status: 'failed' as const, reason: error.message };

  const taskPlans = buildTaskGraph(interpretation);
  const tasks = await createTasks(auth, project.id, traceId, taskPlans);

  // Enqueue execute_task jobs for the initial READY wave — tasks with no
  // dependencies. (Previously a single 'duo_project_created' job was enqueued,
  // which the worker silently skips since it only runs 'execute_task' jobs, so
  // nothing ever auto-executed.) Dependent tasks are NOT enqueued here to avoid
  // out-of-order execution; the worker's budget + approval gates still apply.
  const readyTitles = new Set(
    taskPlans.filter(p => !(p.dependsOnTitles && p.dependsOnTitles.length)).map(p => p.title)
  );
  const readyJobs = tasks
    .filter(t => readyTitles.has(t.title))
    .map(t => ({
      user_id: auth.user.id,
      project_id: project.id,
      task_id: t.id,
      trace_id: traceId,
      job_type: 'execute_task',
      state: 'queued',
      payload: { userId: auth.user.id, taskId: t.id },
      idempotency_key: `execute-task:${t.id}`
    }));
  if (readyJobs.length) {
    await auth.supabase.from('agent_job_queue').insert(readyJobs);
  }

  await writeTimeline(auth, {
    projectId: project.id,
    traceId,
    eventType: 'project_created',
    message: `Duo project created: ${project.title}`,
    payload: { taskCount: tasks.length, domain: interpretation.domain }
  });

  return {
    status: 'completed' as const,
    project,
    interpretation,
    tasks
  };
}
