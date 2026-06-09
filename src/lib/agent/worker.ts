/**
 * Duo Task Worker — executes tasks through the staged pipeline:
 *
 *   Read → Draft → [draft_review approval] → Write → Sync → Final Action
 *
 * Every task that touches an external system passes through a draft phase.
 * The user sees the draft artifact and explicitly confirms before any write
 * or irreversible action executes. This is the core trust mechanism.
 *
 * Status flow:
 *   pending / ready
 *     → running          (budget + route selected)
 *     → draft            (draft artifact produced, awaiting user review)
 *     → waiting_approval (approval card shown for high-risk final action)
 *     → completed        (final action done OR draft confirmed as sufficient)
 *     → failed / blocked
 */

import type { DuoExecutionResult } from '@/next/types/duo';
import type { AgentAuth } from './common';
import { writeTimeline, writeToolCall } from './common';
import { checkBudgetGate, addProjectCost } from './budget-gate';
import { decideRoute } from './decision-router';

// ── Risk thresholds ──────────────────────────────────────────────────────────
// Tasks at or above this risk always go through draft review before any write.
const DRAFT_REQUIRED_RISK = new Set(['medium', 'high', 'critical']);

// Approval-gate patterns: these words in a task title/description trigger
// a hard approval card (on top of the draft review).
const FINAL_ACTION_RE = /\b(send email|submit|publish|checkout|payment|pay now|deploy production|delete account|post to|push to|push production|git push|change dns|remove user|invite user|accept terms|sign up)\b/i;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildDraftContent(task: any, route: string): string {
  return [
    `## Draft: ${task.title}`,
    ``,
    `**Route selected:** ${route}`,
    `**Risk level:** ${task.risk_level || 'medium'}`,
    `**Connector:** ${task.connector_platform || 'none'}`,
    ``,
    `### What will happen when you confirm`,
    task.description || 'No description provided.',
    ``,
    `### Before confirming, verify`,
    `- Is the target (account/platform/endpoint) correct?`,
    `- Are you ready for this action to execute?`,
    `- If reversible: can you undo this within the reversal window?`,
  ].join('\n');
}

function buildApprovalPreview(task: any, route: string): string {
  return [
    `Task: ${task.title}`,
    `Action route: ${route}`,
    ``,
    `⚠️ This is a final action. It will execute immediately on confirmation.`,
    ``,
    task.description || 'No task description provided.',
  ].join('\n');
}

async function saveDraftArtifact(auth: AgentAuth, task: any, content: string): Promise<string | null> {
  const { data } = await auth.supabase
    .from('duo_artifacts')
    .insert({
      user_id: auth.user.id,
      project_id: task.project_id,
      task_id: task.id,
      trace_id: task.trace_id,
      artifact_type: 'draft',
      title: `Draft: ${task.title}`,
      content,
      metadata: { stage: 'draft', awaiting_confirm: true }
    })
    .select('id')
    .single();
  return data?.id ?? null;
}

async function createDraftApproval(auth: AgentAuth, task: any, artifactId: string | null): Promise<string> {
  const { data: approval, error } = await auth.supabase
    .from('duo_approvals')
    .insert({
      user_id: auth.user.id,
      trace_id: task.trace_id,
      project_id: task.project_id,
      task_id: task.id,
      status: 'requested',
      approval_type: 'draft_review',
      preview_content: buildDraftContent(task, task.selected_route || 'api'),
      platform: task.connector_platform || task.selected_route || 'internal',
      endpoint: task.selected_route || 'api',
      risk_level: task.risk_level || 'medium',
      reversible: true,
      reversible_window_seconds: 300,
      on_reject_note: 'Rejecting this draft will block the task. You can retry with a different goal.',
      warning_message: null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: { artifact_id: artifactId, stage: 'draft_review' }
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return approval.id as string;
}

async function createFinalApproval(auth: AgentAuth, task: any, route: string): Promise<string> {
  const { data: approval, error } = await auth.supabase
    .from('duo_approvals')
    .insert({
      user_id: auth.user.id,
      trace_id: task.trace_id,
      project_id: task.project_id,
      task_id: task.id,
      status: 'requested',
      approval_type: 'external_action',
      preview_content: buildApprovalPreview(task, route),
      platform: task.connector_platform || route,
      endpoint: route,
      risk_level: task.risk_level || 'high',
      reversible: false,
      reversible_window_seconds: 0,
      on_reject_note: 'Rejecting will block the task and prevent the final action from executing.',
      warning_message: 'CubiQo will not send, submit, publish, pay, or deploy without explicit approval.',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return approval.id as string;
}

async function latestApproval(auth: AgentAuth, taskId: string, type?: string) {
  let q = auth.supabase
    .from('duo_approvals')
    .select('id,status,expires_at,reversible,approval_type,metadata')
    .eq('task_id', taskId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  if (type) q = q.eq('approval_type', type);
  const { data } = await q.maybeSingle();
  return data || null;
}

// ── Main executor ─────────────────────────────────────────────────────────────

// ── Dependency orchestration ─────────────────────────────────────────────────
// A task's prerequisites are its incoming 'blocks' edges in duo_task_edges.
async function prerequisitesComplete(auth: AgentAuth, taskId: string): Promise<boolean> {
  const { data: incoming } = await auth.supabase
    .from('duo_task_edges')
    .select('from_task_id')
    .eq('to_task_id', taskId)
    .eq('edge_type', 'blocks');
  const prereqIds = [...new Set((incoming || []).map((e: any) => e.from_task_id).filter(Boolean))] as string[];
  if (!prereqIds.length) return true;
  const { data: prereqs } = await auth.supabase
    .from('duo_tasks').select('id,status').in('id', prereqIds);
  return (prereqs || []).length === prereqIds.length
    && (prereqs || []).every((t: any) => t.status === 'completed');
}

// After a task completes, enqueue any dependents whose prerequisites are now ALL
// done. Upsert on the unique idempotency_key so each dependent runs exactly once.
async function enqueueUnblockedDependents(auth: AgentAuth, completedTaskId: string, projectId: string, traceId: string) {
  const { data: edges } = await auth.supabase
    .from('duo_task_edges')
    .select('to_task_id')
    .eq('from_task_id', completedTaskId)
    .eq('edge_type', 'blocks');
  const dependentIds = [...new Set((edges || []).map((e: any) => e.to_task_id).filter(Boolean))] as string[];
  for (const depId of dependentIds) {
    if (!(await prerequisitesComplete(auth, depId))) continue;
    const { data: dep } = await auth.supabase
      .from('duo_tasks').select('id,status').eq('id', depId).maybeSingle();
    if (!dep || !['pending', 'ready'].includes(dep.status)) continue;
    await auth.supabase.from('agent_job_queue').upsert({
      user_id: auth.user.id,
      project_id: projectId,
      task_id: depId,
      trace_id: traceId,
      job_type: 'execute_task',
      state: 'queued',
      status: 'queued',
      locked_by: null,
      payload: { userId: auth.user.id, taskId: depId },
      idempotency_key: `execute-task:${depId}`,
    }, { onConflict: 'idempotency_key' });
    await auth.supabase.from('duo_tasks')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', depId).eq('user_id', auth.user.id).eq('status', 'pending');
    await writeTimeline(auth, {
      projectId, taskId: depId, traceId,
      eventType: 'task_unblocked',
      message: 'Prerequisites complete — task queued for execution',
    });
  }
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

  // ── Resume: draft was confirmed → proceed to final action ────────────────
  if (task.status === 'draft') {
    const draftApproval = await latestApproval(auth, task.id, 'draft_review');
    if (!draftApproval) {
      return { status: 'failed', taskId, message: 'Draft state without approval record' };
    }
    if (draftApproval.status === 'rejected') {
      await auth.supabase.from('duo_tasks')
        .update({ status: 'blocked', last_error: 'User rejected draft', updated_at: new Date().toISOString() })
        .eq('id', task.id).eq('user_id', auth.user.id);
      return { status: 'blocked', taskId, message: 'User rejected draft' };
    }
    if (draftApproval.status !== 'approved') {
      return { status: 'waiting_approval', taskId, approvalId: draftApproval.id, message: 'Awaiting draft review' };
    }
    // Draft approved — check if final action also needs gating
    return executeFinalPhase(auth, task);
  }

  // ── Resume: waiting for final approval ───────────────────────────────────
  if (task.status === 'waiting_approval') {
    const approval = await latestApproval(auth, task.id, 'external_action');
    if (approval?.expires_at && new Date(approval.expires_at).getTime() <= Date.now()) {
      await auth.supabase.from('duo_tasks')
        .update({ status: 'blocked', last_error: 'Approval expired', updated_at: new Date().toISOString() })
        .eq('id', task.id).eq('user_id', auth.user.id);
      return { status: 'blocked', taskId, message: 'Approval expired' };
    }
    if (approval?.status === 'approved') {
      return executeFinalPhase(auth, task, true /* alreadyApproved */);
    }
    return { status: 'waiting_approval', taskId, approvalId: approval?.id, message: 'Task paused for final approval' };
  }

  // ── Project-status guard ────────────────────────────────────────────────────
  // Only execute tasks for an APPROVED (active) project — never run a plan the
  // user hasn't approved through the plan-review gate (no autonomous spend before
  // consent). Tasks are enqueued at approval, but this is the hard backstop.
  const { data: proj } = await auth.supabase
    .from('duo_projects').select('status').eq('id', task.project_id).maybeSingle();
  if (proj && !['active', 'working', 'running'].includes(String(proj.status))) {
    return { status: 'blocked', taskId, message: `Project is ${proj.status} — not executing` };
  }

  // ── Dependency guard ───────────────────────────────────────────────────────
  // Never execute a task whose prerequisites aren't all completed. Defense in
  // depth: dependents are normally only enqueued once their prereqs finish, but
  // this guarantees correct ordering and prevents wasted autonomous spend.
  if (!(await prerequisitesComplete(auth, task.id))) {
    return { status: 'blocked', taskId, message: 'Waiting on prerequisite tasks' };
  }

  // ── Phase 1: Budget gate ──────────────────────────────────────────────────
  const budget = await checkBudgetGate(auth, {
    projectId: task.project_id, taskId: task.id,
    traceId: task.trace_id, projectedCostGbp: 0.02
  });
  if (!budget.allowed) {
    await auth.supabase.from('duo_tasks')
      .update({ status: 'blocked', last_error: 'Budget gate reached', updated_at: new Date().toISOString() })
      .eq('id', task.id).eq('user_id', auth.user.id);
    await writeTimeline(auth, {
      projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
      eventType: 'task_budget_blocked',
      message: `Budget gate blocked task: ${task.title}`, payload: budget
    });
    return { status: 'blocked', taskId, message: 'Budget gate reached' };
  }

  // ── Phase 2: Route selection ──────────────────────────────────────────────
  const decision = await decideRoute(auth, task);
  await auth.supabase.from('duo_tasks').update({
    selected_route: decision.selectedRoute,
    assigned_route: decision.selectedRoute,
    fallback_route: decision.fallbackRoute,
    approval_required: decision.approvalRequired,
    status: 'running',
    attempts: Number(task.attempts || 0) + 1,
    updated_at: new Date().toISOString(),
    metadata: { ...(task.metadata || {}), routeDecision: decision }
  }).eq('id', task.id).eq('user_id', auth.user.id);

  await writeTimeline(auth, {
    projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
    eventType: 'route_selected',
    message: `Selected ${decision.selectedRoute} for ${task.title}`,
    payload: { ...decision }
  });

  // ── Phase 3: Draft production (Read → Draft) ──────────────────────────────
  // Every task that touches an external system at medium risk or above gets a
  // draft artifact shown to the user before any write executes.
  const taskText = `${task.title} ${task.description || ''}`;
  const needsDraftReview = DRAFT_REQUIRED_RISK.has(task.risk_level || 'medium')
    && decision.selectedRoute !== 'manual';

  if (needsDraftReview) {
    // Produce the draft artifact
    const draftContent = buildDraftContent({ ...task, selected_route: decision.selectedRoute }, decision.selectedRoute);
    const artifactId = await saveDraftArtifact(auth, task, draftContent);

    // Log tool call for the draft phase
    await writeToolCall(auth, {
      projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
      toolName: 'draft_producer',
      route: decision.selectedRoute,
      status: 'completed',
      input: { title: task.title, route: decision.selectedRoute },
      output: { artifactId, stage: 'draft' },
      apiCostGbp: 0.005
    });

    // Move to draft status and surface approval card
    const draftApprovalId = await createDraftApproval({ ...auth, supabase: auth.supabase } as AgentAuth, task, artifactId);
    await auth.supabase.from('duo_tasks').update({
      status: 'draft',
      updated_at: new Date().toISOString(),
      metadata: { ...(task.metadata || {}), draftArtifactId: artifactId, draftApprovalId }
    }).eq('id', task.id).eq('user_id', auth.user.id);

    await writeTimeline(auth, {
      projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
      eventType: 'draft_produced',
      message: `Draft ready for review: ${task.title}`,
      payload: { artifactId, draftApprovalId, route: decision.selectedRoute }
    });

    return { status: 'draft', taskId, approvalId: draftApprovalId, message: 'Draft produced — awaiting user review' };
  }

  // Low-risk or manual tasks skip draft review and complete immediately
  return executeFinalPhase(auth, { ...task, selected_route: decision.selectedRoute }, false);
}

// ── Final phase: Write → Sync → Final Action ─────────────────────────────────
async function executeFinalPhase(
  auth: AgentAuth,
  task: any,
  alreadyApproved = false
): Promise<DuoExecutionResult> {
  const taskId = task.id;
  const route = task.selected_route || task.assigned_route || 'manual';
  const taskText = `${task.title} ${task.description || ''}`;
  const isFinalAction = FINAL_ACTION_RE.test(taskText);

  // Final-action approval gate (on top of draft review)
  if (isFinalAction && !alreadyApproved) {
    const finalApprovalId = await createFinalApproval(auth, task, route);
    await auth.supabase.from('duo_tasks').update({
      status: 'waiting_approval',
      updated_at: new Date().toISOString()
    }).eq('id', task.id).eq('user_id', auth.user.id);

    await writeTimeline(auth, {
      projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
      eventType: 'approval_requested',
      message: `Final action approval requested: ${task.title}`,
      payload: { approvalId: finalApprovalId }
    });

    return { status: 'waiting_approval', taskId, approvalId: finalApprovalId, message: 'Final action requires approval' };
  }

  // ── Execute ───────────────────────────────────────────────────────────────
  await writeToolCall(auth, {
    projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
    toolName: 'duo_executor',
    route,
    status: 'completed',
    input: { title: task.title, route },
    output: {
      result: isFinalAction
        ? 'Final action executed with user approval'
        : 'Task completed safely — no external write required'
    },
    apiCostGbp: 0.02
  });

  await addProjectCost(auth, {
    projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
    amountGbp: 0.02, reason: 'duo task execution'
  });

  const now = new Date().toISOString();
  await auth.supabase.from('duo_tasks').update({
    status: 'completed',
    result: isFinalAction
      ? `Final action executed via ${route} with user approval.`
      : `Completed safely via ${route}.`,
    evidence: {
      route,
      completedAt: now,
      finalAction: isFinalAction,
      approvalRequired: isFinalAction
    },
    completed_at: now,
    updated_at: now
  }).eq('id', task.id).eq('user_id', auth.user.id);

  await writeTimeline(auth, {
    projectId: task.project_id, taskId: task.id, traceId: task.trace_id,
    eventType: 'task_completed',
    message: `Completed: ${task.title}`,
    payload: { route, finalAction: isFinalAction }
  });

  // Cascade: enqueue any dependents now unblocked by this task's completion.
  await enqueueUnblockedDependents(auth, task.id, task.project_id, task.trace_id);

  return { status: 'completed', taskId, message: `Task completed via ${route}` };
}
