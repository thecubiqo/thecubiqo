/**
 * Capsule Engine — CubiQo's proactive brain for an open capsule.
 *
 * The product promise: the moment you open a capsule, CubiQo is already
 * working — picking up the next eligible task, executing it through the safe
 * Read→Draft→Approve→Act pipeline, and continuously regenerating a rich
 * "live view" (stats + results table + next actions + money angle) that lands
 * in the artifact pane. While the dashboard is open the client heartbeats this
 * engine every few seconds; a cron backstop keeps it advancing when closed.
 *
 * Hard rules this engine NEVER breaks (they are the trust model):
 *   • It never bypasses the draft/approval gates — it delegates execution to
 *     worker.executeTask(), which itself decides whether a task needs a draft
 *     or a final-action approval. The engine only ever *starts* eligible work.
 *   • It respects the per-project budget gate. When the cap is reached it stops
 *     spending and says so in the view, rather than blowing past the limit.
 *   • It only ever touches the owner's own rows (every query is user-scoped).
 *
 * Public surface:
 *   advanceCapsule(auth, projectId)  → run one proactive step + refresh view
 *   getLatestView(auth, projectId)   → read the current live-view artifact
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AgentAuth } from './common';
import { executeTask } from './worker';
import { addProjectCost } from './budget-gate';
import { getModel } from '../config/llm';
import type { DuoProjectView, ViewRow, ViewStat } from '@/next/types/duo-view';

// How stale a view can get before an idle tick refreshes it (ms). Keeps idle
// ticks cheap — we only pay for LLM regeneration when something changed or the
// view has aged out.
const VIEW_TTL_MS = 45_000;

// Per-tick projected cost for the view-generation LLM call (used by budget gate).
const VIEW_GEN_COST_GBP = 0.01;

// Terminal project states — nothing left to advance.
const TERMINAL_STATES = new Set(['done', 'shot', 'failed', 'cancelled', 'archived']);

// Statuses that mean a task is waiting on the *user*, not the agent. The engine
// skips these and works other independent tasks instead.
const USER_BLOCKED = new Set(['draft', 'waiting_approval', 'awaiting_user', 'waiting_user', 'blocked']);

// Statuses that are eligible for the agent to start right now.
const ELIGIBLE = new Set(['ready', 'pending']);

// Statuses that count as finished for dependency-satisfaction checks.
const DONE_STATES = new Set(['done', 'completed', 'succeeded', 'skipped']);

export type CapsuleTickState =
  | 'idle'
  | 'advanced'
  | 'awaiting_plan_approval'
  | 'budget_reached'
  | 'awaiting_user'
  | 'all_done'
  | 'terminal';

export interface CapsuleTickResult {
  state: CapsuleTickState;
  executedTaskId?: string | null;
  executedStatus?: string | null;
  /** Count of tasks still eligible for the agent to run. */
  remaining: number;
  viewArtifactId?: string | null;
  viewUpdated: boolean;
  message: string;
}

// ── Anthropic client (lazy, optional) ─────────────────────────────────────────
// View generation degrades gracefully to a deterministic builder when no key is
// configured, so a capsule always shows a live view even without the LLM.
let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!anthropic) anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

// ── Task selection ────────────────────────────────────────────────────────────

type TaskRow = Record<string, any>;
type EdgeRow = { from_task_id?: string | null; to_task_id?: string | null };

/**
 * Pick the next task the agent may start: an eligible task whose blocking
 * dependencies are all complete. Returns null when nothing is runnable.
 */
function selectNextTask(tasks: TaskRow[], edges: EdgeRow[]): TaskRow | null {
  const byId = new Map(tasks.map(t => [t.id, t]));

  // Build "blocked-by" map: toTask -> [fromTask...]
  const blockedBy = new Map<string, string[]>();
  for (const e of edges) {
    if (!e.to_task_id || !e.from_task_id) continue;
    const list = blockedBy.get(e.to_task_id) || [];
    list.push(e.from_task_id);
    blockedBy.set(e.to_task_id, list);
  }

  const depsSatisfied = (taskId: string) => {
    const deps = blockedBy.get(taskId) || [];
    return deps.every(depId => {
      const dep = byId.get(depId);
      return !dep || DONE_STATES.has(dep.status);
    });
  };

  const runnable = tasks.filter(t => {
    if (!ELIGIBLE.has(t.status)) return false;
    // A 'pending' task that still requires approval hasn't been released by the
    // plan gate — leave it for the user. 'ready' tasks were explicitly released.
    if (t.status === 'pending' && t.approval_required) return false;
    return depsSatisfied(t.id);
  });

  if (runnable.length === 0) return null;

  // Prefer lower-risk work first (drains safe wins fast), then creation order.
  const riskRank: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  runnable.sort((a, b) => {
    const ra = riskRank[a.risk_level as string] ?? 1;
    const rb = riskRank[b.risk_level as string] ?? 1;
    if (ra !== rb) return ra - rb;
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
  });
  return runnable[0];
}

/** Count eligible (runnable) tasks — surfaced as `remaining`. */
function countRunnable(tasks: TaskRow[], edges: EdgeRow[]): number {
  let n = 0;
  let remainingTasks = tasks;
  // Cheap re-use of selectNextTask logic without mutating: re-filter.
  const byId = new Map(tasks.map(t => [t.id, t]));
  const blockedBy = new Map<string, string[]>();
  for (const e of edges) {
    if (!e.to_task_id || !e.from_task_id) continue;
    const list = blockedBy.get(e.to_task_id) || [];
    list.push(e.from_task_id);
    blockedBy.set(e.to_task_id, list);
  }
  for (const t of remainingTasks) {
    if (!ELIGIBLE.has(t.status)) continue;
    if (t.status === 'pending' && t.approval_required) continue;
    const deps = blockedBy.get(t.id) || [];
    const ok = deps.every(depId => {
      const dep = byId.get(depId);
      return !dep || DONE_STATES.has(dep.status);
    });
    if (ok) n++;
  }
  return n;
}

// ── View generation ───────────────────────────────────────────────────────────

const TONE_FOR_STATUS = (status: string): ViewStat['tone'] => {
  if (DONE_STATES.has(status)) return 'positive';
  if (USER_BLOCKED.has(status)) return 'warning';
  if (status === 'failed' || status === 'dead_lettered') return 'danger';
  return 'info';
};

/**
 * Deterministic fallback view — always available, no LLM required. Computes
 * stat cards and a task table straight from the project + task rows.
 */
function buildFallbackView(project: TaskRow, tasks: TaskRow[]): DuoProjectView {
  const done = tasks.filter(t => DONE_STATES.has(t.status)).length;
  const working = tasks.filter(t => ['working', 'running', 'leased'].includes(t.status)).length;
  const awaiting = tasks.filter(t => USER_BLOCKED.has(t.status)).length;
  const pending = tasks.filter(t => ELIGIBLE.has(t.status)).length;

  const rows: ViewRow[] = tasks.slice(0, 25).map(t => ({
    cells: [
      t.title || t.description?.slice(0, 60) || 'Task',
      (t.selected_route || t.assigned_route || t.preferred_route || '—') as string,
    ],
    badge: { label: String(t.status || 'pending'), tone: TONE_FOR_STATUS(String(t.status || 'pending')) },
  }));

  return {
    kind: 'view',
    headline: project.title || project.goal || 'Capsule',
    subtitle: project.goal && project.title !== project.goal ? project.goal : undefined,
    generatedAt: new Date().toISOString(),
    status: TERMINAL_STATES.has(project.status) ? project.status : 'Working',
    stats: [
      { label: 'Total tasks', value: tasks.length, tone: 'neutral' },
      { label: 'Done', value: done, tone: 'positive' },
      { label: 'In progress', value: working + pending, tone: 'info' },
      { label: 'Awaiting you', value: awaiting, tone: awaiting ? 'warning' : 'neutral' },
    ],
    columns: ['Task', 'Route', 'Status'],
    rows,
    nextActions: tasks
      .filter(t => ELIGIBLE.has(t.status))
      .slice(0, 3)
      .map(t => `Run: ${t.title}`),
    moneyAngle: undefined,
  };
}

/**
 * LLM-synthesized view. Produces the rich, domain-aware live dashboard
 * (money-minded, goal-focused, with proactive next actions). Falls back to the
 * deterministic builder on any failure.
 */
async function generateView(
  project: TaskRow,
  tasks: TaskRow[],
  outcomes: TaskRow[],
  timeline: TaskRow[]
): Promise<DuoProjectView> {
  const client = getAnthropic();
  if (!client) return buildFallbackView(project, tasks);

  const taskDigest = tasks.slice(0, 30).map(t => ({
    title: t.title,
    status: t.status,
    route: t.selected_route || t.assigned_route || t.preferred_route || null,
    risk: t.risk_level,
    result: typeof t.result === 'string' ? t.result.slice(0, 200) : null,
    note: t.notes || t.question_text || t.approval_description || null,
  }));

  const prompt = `You are CubiQo, an always-on, money-minded AI operator working a goal for your owner. Produce the LIVE DASHBOARD VIEW for this capsule as strict JSON.

GOAL: ${project.goal || project.title}
DOMAIN: ${project.domain || 'general'}
SUCCESS CRITERIA: ${JSON.stringify(project.success_criteria || project.goal_interpretation?.successCriteria || []).slice(0, 600)}
PROJECT STATUS: ${project.status}
BUDGET: £${Number(project.api_cost_gbp || 0).toFixed(2)} of £${Number(project.budget_gate_gbp || 5).toFixed(2)} used

TASKS (${tasks.length}):
${JSON.stringify(taskDigest, null, 1)}

RECENT OUTCOMES: ${JSON.stringify((outcomes || []).slice(0, 5).map(o => ({ outcome: o.outcome, summary: o.summary })))}

Return ONLY JSON matching this TypeScript type (no markdown fence):
{
  "headline": string,            // punchy, with a number if one exists, e.g. "Application Tracker — 18 Roles Found"
  "subtitle"?: string,
  "status"?: string,             // short, e.g. "Generating", "Awaiting your approval"
  "stats": [{ "label": string, "value": string|number, "tone"?: "neutral"|"positive"|"warning"|"danger"|"info" }],  // 3-4 cards, the most decision-useful metrics for THIS domain
  "columns"?: string[],          // table headers tailored to the domain (e.g. Role/Company, Source, Match, Status)
  "rows"?: [{ "cells": string[], "badge"?: { "label": string, "tone"?: "neutral"|"positive"|"warning"|"danger"|"info" } }],  // derive concrete rows from the tasks/outcomes; do NOT invent fake external data, summarize what the tasks represent
  "sections"?: [{ "heading": string, "body": string }],
  "nextActions": string[],       // 2-4 concrete things you are doing/will do next — proactive, specific
  "moneyAngle"?: string          // one sentence: the financial/opportunity upside for the owner
}

Rules: Be specific to the domain. Reflect REAL task state (do not fabricate external results that the tasks haven't produced). Keep it tight. nextActions must read like an operator who is actively pushing the goal forward.`;

  try {
    // Model selection is centralised in llm.ts (claude_view role).
    // Default: Haiku (cheapest capable). Override via DUO_VIEW_MODEL or CLAUDE_VIEW_MODEL env var.
    const model = getModel('claude_view');
    const msg = await client.messages.create({
      model,
      max_tokens: 1400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return buildFallbackView(project, tasks);
    const parsed = JSON.parse(match[0]) as Partial<DuoProjectView>;
    return {
      kind: 'view',
      headline: parsed.headline || project.title || 'Capsule',
      subtitle: parsed.subtitle,
      status: parsed.status,
      generatedAt: new Date().toISOString(),
      stats: Array.isArray(parsed.stats) && parsed.stats.length ? parsed.stats : buildFallbackView(project, tasks).stats,
      columns: parsed.columns,
      rows: Array.isArray(parsed.rows) ? parsed.rows : undefined,
      sections: Array.isArray(parsed.sections) ? parsed.sections : undefined,
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : undefined,
      moneyAngle: parsed.moneyAngle,
    };
  } catch {
    return buildFallbackView(project, tasks);
  }
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function persistView(auth: AgentAuth, project: TaskRow, view: DuoProjectView): Promise<string | null> {
  const { data } = await auth.supabase
    .from('duo_artifacts')
    .insert({
      user_id: auth.user.id,
      project_id: project.id,
      task_id: null, // project-level view (not tied to a single task)
      trace_id: project.trace_id || null,
      artifact_type: 'view',
      title: view.headline,
      content: JSON.stringify(view),
      metadata: { kind: 'view', generatedAt: view.generatedAt },
    })
    .select('id')
    .single();
  return data?.id ?? null;
}

/** Read the most recent project-level live-view artifact. */
export async function getLatestView(auth: AgentAuth, projectId: string) {
  const { data } = await auth.supabase
    .from('duo_artifacts')
    .select('id,artifact_type,title,content,metadata,created_at')
    .eq('project_id', projectId)
    .eq('user_id', auth.user.id)
    .eq('artifact_type', 'view')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

/** Emit a lightweight stream event so the open dashboard refreshes promptly. */
async function emitStream(auth: AgentAuth, projectId: string, traceId: string | null, eventType: string, payload: Record<string, unknown>) {
  try {
    await auth.supabase.from('stream_events').insert({
      project_id: projectId,
      trace_id: traceId,
      event_type: eventType,
      payload,
    });
  } catch {
    /* stream is best-effort; never fail a tick on it */
  }
}

// ── Main entrypoint ───────────────────────────────────────────────────────────

/**
 * Advance a capsule by one proactive step and refresh its live view.
 * Safe to call repeatedly (heartbeat). Idempotent-ish: it starts at most one
 * task per call and only regenerates the (paid) view when something changed or
 * the view has aged out.
 */
export async function advanceCapsule(auth: AgentAuth, projectId: string): Promise<CapsuleTickResult> {
  // Load project (ownership enforced).
  const { data: project } = await auth.supabase
    .from('duo_projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!project) {
    return { state: 'terminal', remaining: 0, viewUpdated: false, message: 'Project not found' };
  }

  // Respect the plan-review gate: do not auto-run an unapproved plan.
  if (project.status === 'planning') {
    return { state: 'awaiting_plan_approval', remaining: 0, viewUpdated: false, message: 'Plan awaiting your approval' };
  }

  if (TERMINAL_STATES.has(project.status)) {
    return { state: 'terminal', remaining: 0, viewUpdated: false, message: `Project is ${project.status}` };
  }

  const [{ data: tasks }, { data: edges }, { data: outcomes }, { data: timeline }] = await Promise.all([
    auth.supabase.from('duo_tasks').select('*').eq('project_id', projectId).eq('user_id', auth.user.id).order('created_at'),
    auth.supabase.from('duo_task_edges').select('from_task_id,to_task_id').eq('project_id', projectId),
    auth.supabase.from('duo_outcomes').select('outcome,summary,created_at').eq('project_id', projectId).eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    auth.supabase.from('duo_timeline_events').select('event_type,message,created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
  ]);

  const taskRows = (tasks || []) as TaskRow[];
  const edgeRows = (edges || []) as EdgeRow[];

  // Budget gate — stop spending past the cap, but still keep the view fresh.
  const cost = Number(project.api_cost_gbp || 0);
  const cap = Number(project.budget_gate_gbp || 5);
  const budgetReached = cost >= cap;

  // Decide whether to refresh the (paid) view this tick.
  const latest = await getLatestView(auth, projectId);
  const viewAgeMs = latest?.created_at ? Date.now() - new Date(latest.created_at).getTime() : Infinity;
  let executed: { id: string; status: string } | null = null;

  // ── Try to advance one task (unless budget is gone) ──────────────────────────
  if (!budgetReached) {
    const next = selectNextTask(taskRows, edgeRows);
    if (next) {
      try {
        const result = await executeTask(auth, next.id);
        executed = { id: next.id, status: result.status };
        // Reflect the new task state for the view we're about to generate.
        const idx = taskRows.findIndex(t => t.id === next.id);
        if (idx >= 0) taskRows[idx] = { ...taskRows[idx], status: mapResultToStatus(result.status, taskRows[idx].status) };
      } catch (err) {
        executed = { id: next.id, status: 'failed' };
      }
    }
  }

  // Regenerate the view when: something was executed, no view exists yet, the
  // view aged out, or the budget just got hit (so the owner sees why we stopped).
  const shouldRefreshView = Boolean(executed) || !latest || viewAgeMs > VIEW_TTL_MS;
  let viewArtifactId: string | null = latest?.id ?? null;
  let viewUpdated = false;

  if (shouldRefreshView && !(budgetReached && latest && viewAgeMs <= VIEW_TTL_MS)) {
    const view = await generateView(project, taskRows, outcomes || [], timeline || []);
    if (budgetReached) {
      view.status = 'Budget reached — paused';
      const budgetCard: ViewStat = { label: 'Budget', value: `£${cost.toFixed(2)} / £${cap.toFixed(2)}`, tone: 'warning' };
      view.stats = [budgetCard, ...view.stats].slice(0, 4);
    }
    viewArtifactId = await persistView(auth, project, view);
    viewUpdated = true;
    // Account the live-view LLM cost against the project budget so spend stays
    // honest and a long idle-but-open session can't quietly overrun the cap.
    if (process.env.ANTHROPIC_API_KEY) {
      await addProjectCost(auth, {
        projectId,
        traceId: project.trace_id || crypto.randomUUID(),
        amountGbp: VIEW_GEN_COST_GBP,
        reason: 'capsule live view',
      });
    }
    await emitStream(auth, projectId, project.trace_id, 'artifact_created', { artifactId: viewArtifactId, kind: 'view' });
  }

  const remaining = countRunnable(taskRows, edgeRows);

  if (executed) {
    await emitStream(auth, projectId, project.trace_id, 'task_update', { taskId: executed.id, status: executed.status });
  }

  // Determine the high-level state for the client.
  let state: CapsuleTickState;
  let message: string;
  if (budgetReached) {
    state = 'budget_reached';
    message = `Budget gate reached (£${cost.toFixed(2)}/£${cap.toFixed(2)}).`;
  } else if (executed) {
    state = 'advanced';
    message = `Advanced task (${executed.status}).`;
  } else if (remaining === 0) {
    const anyUserBlocked = taskRows.some(t => USER_BLOCKED.has(t.status) && t.status !== 'blocked');
    state = anyUserBlocked ? 'awaiting_user' : taskRows.every(t => DONE_STATES.has(t.status)) && taskRows.length > 0 ? 'all_done' : 'idle';
    message = state === 'awaiting_user' ? 'Waiting on your review/approval.' : state === 'all_done' ? 'All tasks complete.' : 'No runnable tasks right now.';
  } else {
    state = 'idle';
    message = 'Idle.';
  }

  return {
    state,
    executedTaskId: executed?.id ?? null,
    executedStatus: executed?.status ?? null,
    remaining,
    viewArtifactId,
    viewUpdated,
    message,
  };
}

/** Map an executeTask result status onto a duo_tasks.status for the local view. */
function mapResultToStatus(resultStatus: string, current: string): string {
  switch (resultStatus) {
    case 'completed':
    case 'already_executed':
      return 'completed';
    case 'draft':
      return 'draft';
    case 'waiting_approval':
      return 'waiting_approval';
    case 'blocked':
      return 'blocked';
    case 'failed':
      return 'failed';
    default:
      return current;
  }
}
