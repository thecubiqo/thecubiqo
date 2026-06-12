/**
 * Proactivity engine — the deliberate engineering on top of the agnostic
 * agent loop. The agent core stays goal/domain-agnostic; this module adds:
 *
 *   • ongoing research: idle ACTIVE capsules keep researching between visits
 *     (cadence-gated, budget-gated) and the findings land on the dashboard
 *   • ideation: when a capsule finishes its plan, propose follow-up tasks on
 *     the dashboard — approval-gated, never auto-run
 *   • writeback: research findings and project outcomes land in memory_events
 *     so the agent learns across sessions
 *   • completion: finished projects close through writeOutcome (memory,
 *     duo_outcomes, playbook stats) instead of staying open forever
 *
 * Everything derives from the project's own goal and history — no domain
 * branching anywhere in this file.
 */

import { generateObject, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { AgentAuth } from './common';
import { writeTimeline } from './common';
import { checkBudgetGate, addProjectCost } from './budget-gate';
import { writeOutcome } from './outcome-writer';
import { getModel } from '../config/llm';
import { webSearch, searchConfigured } from '@/next/app/api/_lib/web-search';

const RESEARCH_CADENCE_MS = 6 * 60 * 60 * 1000;   // one research pass per 6h per capsule
const IDEATION_DECISION_MS = 72 * 60 * 60 * 1000; // proposals wait up to 72h for the user
const RESEARCH_COST_GBP = 0.03;
const IDEATION_COST_GBP = 0.02;

const DONE_STATES = new Set(['done', 'completed', 'succeeded', 'skipped']);

function hasAnthropicKey() {
  return Boolean((process.env.ANTHROPIC_API_KEY || '').trim());
}

function isUnactionedProposal(task: any) {
  return Boolean(task?.metadata?.ideation) && task.status === 'pending';
}

// ── Ideation: dashboard proposes what's next ──────────────────────────────────

const IdeasSchema = z.object({
  ideas: z.array(z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(400),
    rationale: z.string().max(200),
  })).max(2),
});

/**
 * Propose up to 2 follow-up tasks grounded in the project's goal and what was
 * actually accomplished. Proposals are approval-required pending tasks tagged
 * metadata.ideation — they appear on the dashboard and never auto-run.
 */
async function ideateFollowUps(auth: AgentAuth, project: any, tasks: any[]): Promise<number> {
  if (!hasAnthropicKey()) return 0;
  const budget = await checkBudgetGate(auth, {
    projectId: project.id, traceId: project.trace_id, projectedCostGbp: IDEATION_COST_GBP,
  });
  if (!budget.allowed) return 0;

  const accomplished = tasks
    .filter((t: any) => DONE_STATES.has(t.status))
    .map((t: any) => `- ${t.title}${t.result ? `: ${String(t.result).slice(0, 140)}` : ''}`)
    .join('\n');

  try {
    const model = getModel('claude_view');
    const result = await generateObject({
      model: anthropic(model),
      schema: IdeasSchema,
      system: [
        'You are CubiQo\'s ideation engine. A capsule (project) just completed its task plan.',
        'Propose at most 2 concrete, high-value follow-up tasks that extend the outcome.',
        'Ideas must follow from the goal and the completed work — no generic filler.',
        'Return zero ideas if nothing genuinely valuable remains.',
      ].join('\n'),
      prompt: [
        `Goal: ${project.goal || project.title}`,
        accomplished ? `Completed work:\n${accomplished}` : 'No task details recorded.',
      ].join('\n\n'),
    });

    const ideas = result.object.ideas;
    if (!ideas.length) return 0;

    for (const idea of ideas) {
      await auth.supabase.from('duo_tasks').insert({
        user_id: auth.user.id,
        project_id: project.id,
        trace_id: project.trace_id,
        title: idea.title,
        description: `${idea.description}\n\nWhy: ${idea.rationale}`,
        status: 'pending',
        risk_level: 'medium',
        approval_required: true, // ideas NEVER auto-run — the user releases them
        can_parallelize: false,
        idempotency_key: `${project.id}:idea:${idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
        metadata: { ideation: true, proposedAt: new Date().toISOString() },
      });
    }

    await auth.supabase.from('duo_artifacts').insert({
      user_id: auth.user.id,
      project_id: project.id,
      trace_id: project.trace_id,
      artifact_type: 'ideas',
      title: 'Proposed next steps',
      content: ideas.map(i => `## ${i.title}\n${i.description}\n_Why:_ ${i.rationale}`).join('\n\n'),
      metadata: { ideation: true, count: ideas.length },
    });

    await addProjectCost(auth, {
      projectId: project.id, traceId: project.trace_id,
      amountGbp: IDEATION_COST_GBP, reason: 'capsule ideation',
    });
    await writeTimeline(auth, {
      projectId: project.id, traceId: project.trace_id,
      eventType: 'ideation_proposed',
      message: `Proposed ${ideas.length} follow-up idea${ideas.length > 1 ? 's' : ''} for your review`,
      payload: { titles: ideas.map(i => i.title) },
    });
    return ideas.length;
  } catch {
    return 0; // ideation must never block completion
  }
}

// ── Completion: close finished projects + write memory ───────────────────────

export interface CompletionResult {
  completed: boolean;
  ideated?: boolean;
  message?: string;
}

/**
 * Called after a task completes (worker cascade) and from the capsule
 * heartbeat. When every real task is finished: first run ONE ideation pass
 * (dashboard proposes follow-ups), then — once proposals are decided or the
 * decision window lapses — close the project via writeOutcome so memory
 * learns and the heartbeat/cron stop spending on it.
 */
export async function maybeCompleteProject(auth: AgentAuth, projectId: string): Promise<CompletionResult> {
  const { data: project } = await auth.supabase
    .from('duo_projects').select('*')
    .eq('id', projectId).eq('user_id', auth.user.id).maybeSingle();
  if (!project) return { completed: false };
  if (['planning', 'done', 'failed', 'shot', 'cancelled', 'archived'].includes(String(project.status))) {
    return { completed: false };
  }

  const { data: tasks } = await auth.supabase
    .from('duo_tasks').select('*')
    .eq('project_id', projectId).eq('user_id', auth.user.id);
  const taskRows: any[] = tasks || [];
  if (!taskRows.length) return { completed: false };

  // "Real" tasks = everything except unactioned ideation proposals.
  const blocking = taskRows.filter(t => !DONE_STATES.has(t.status) && t.status !== 'failed' && !isUnactionedProposal(t));
  if (blocking.length > 0) return { completed: false };

  const meta = project.metadata || {};
  const proposals = taskRows.filter(isUnactionedProposal);

  // Phase 1: all work done, ideation not yet offered → propose follow-ups.
  if (!meta.ideationAt) {
    // Claim the ideation slot BEFORE spending, using a conditional update that
    // only succeeds when ideationAt is still unset — so concurrent heartbeat +
    // cron ticks can't both ideate (and double-spend) on the same project.
    const { data: claimed } = await auth.supabase
      .from('duo_projects')
      .update({ metadata: { ...meta, ideationAt: new Date().toISOString() }, updated_at: new Date().toISOString() })
      .eq('id', projectId).eq('user_id', auth.user.id)
      .is('metadata->>ideationAt', null)
      .select('id');
    if (!claimed || claimed.length === 0) {
      // Another tick already claimed ideation this round — defer to it.
      return { completed: false, message: 'Ideation in progress.' };
    }
    const proposed = await ideateFollowUps(auth, project, taskRows);
    if (proposed > 0) {
      return { completed: false, ideated: true, message: 'All tasks complete — follow-up ideas proposed for your review.' };
    }
    // Nothing worth proposing → fall through to close now.
  } else if (proposals.length > 0 && Date.now() - new Date(meta.ideationAt).getTime() < IDEATION_DECISION_MS) {
    // Phase 2: proposals on the dashboard, user still inside the decision window.
    return { completed: false, message: 'Follow-up ideas awaiting your decision.' };
  }

  // Phase 3: claim the close so concurrent ticks can't double-write the
  // outcome/memory. Only one tick wins the closingAt flip.
  const { data: closeClaim } = await auth.supabase
    .from('duo_projects')
    .update({ metadata: { ...meta, closingAt: new Date().toISOString() }, updated_at: new Date().toISOString() })
    .eq('id', projectId).eq('user_id', auth.user.id)
    .is('metadata->>closingAt', null)
    .select('id');
  if (!closeClaim || closeClaim.length === 0) {
    return { completed: false, message: 'Project close already in progress.' };
  }

  // Skip any ignored proposals so they stop counting as open work.
  for (const p of proposals) {
    await auth.supabase.from('duo_tasks')
      .update({ status: 'skipped', updated_at: new Date().toISOString() })
      .eq('id', p.id).eq('user_id', auth.user.id);
  }

  const failures = taskRows.filter(t => t.status === 'failed');
  const completedTasks = taskRows.filter(t => DONE_STATES.has(t.status));
  const outcome = failures.length > 0 ? 'partial' : 'success';
  const summary = [
    `Completed ${completedTasks.length}/${taskRows.length - proposals.length} tasks for "${project.goal || project.title}".`,
    failures.length ? `${failures.length} task(s) failed.` : '',
    completedTasks.slice(0, 3).map(t => t.title).join('; '),
  ].filter(Boolean).join(' ');

  const result = await writeOutcome(auth, {
    projectId,
    outcome,
    summary,
    evidence: { tasksCompleted: completedTasks.length, tasksFailed: failures.length, proposalsSkipped: proposals.length },
  });
  return { completed: result.status === 'completed', message: `Project closed as ${outcome}.` };
}

// ── Ongoing research: idle capsules keep working ──────────────────────────────

/**
 * One cadence-gated research pass for an ACTIVE capsule with nothing runnable
 * (e.g. waiting on user review). Fresh findings land as a dashboard artifact
 * and in memory_events. Returns true when a pass actually ran.
 */
export async function idleResearchTick(auth: AgentAuth, project: any): Promise<boolean> {
  if (!hasAnthropicKey()) return false;
  const meta = project.metadata || {};
  const last = meta.lastResearchAt ? new Date(meta.lastResearchAt).getTime() : 0;
  if (Date.now() - last < RESEARCH_CADENCE_MS) return false;

  const budget = await checkBudgetGate(auth, {
    projectId: project.id, traceId: project.trace_id, projectedCostGbp: RESEARCH_COST_GBP,
  });
  if (!budget.allowed) return false;

  // Stamp the cadence FIRST so concurrent ticks (heartbeat + cron) cannot
  // double-spend on the same window.
  await auth.supabase.from('duo_projects').update({
    metadata: { ...meta, lastResearchAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }).eq('id', project.id).eq('user_id', auth.user.id);

  const query = String(project.goal || project.title || '').slice(0, 250);
  let sources = '';
  let sourceCount = 0;
  if (searchConfigured()) {
    try {
      const found = await webSearch(query, 4);
      sourceCount = found.results?.length || 0;
      sources = (found.results || [])
        .map((r: any, i: number) => `[${i + 1}] ${r.title} — ${r.url}\n${r.snippet || r.content || ''}`)
        .join('\n\n');
    } catch { /* degrade to model knowledge, flagged below */ }
  }

  try {
    const model = getModel('claude_view');
    const result = await generateText({
      model: anthropic(model),
      system: 'You are CubiQo\'s ongoing-research agent. Produce a SHORT update (5-10 sentences): what is new or actionable for this goal since the last check. Decision-ready, no filler.',
      prompt: [
        `Goal: ${query}`,
        sources ? `Fresh web sources:\n${sources}` : 'No live web sources available — state that findings come from model knowledge.',
      ].join('\n\n'),
      maxOutputTokens: 600,
    });

    await auth.supabase.from('duo_artifacts').insert({
      user_id: auth.user.id,
      project_id: project.id,
      trace_id: project.trace_id,
      artifact_type: 'research',
      title: `Ongoing research — ${new Date().toISOString().slice(0, 10)}`,
      content: result.text,
      metadata: { ongoing: true, webSources: sourceCount },
    });

    // Writeback: the agent remembers what it learned.
    await auth.supabase.from('memory_events').insert({
      user_id: auth.user.id,
      event_type: 'session_summary',
      summary: `Research update for "${query.slice(0, 80)}": ${result.text.slice(0, 220)}`,
      keywords: query.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).slice(0, 10),
      weight: 1,
      source: 'duo',
      metadata: { projectId: project.id, kind: 'ongoing_research' },
    });

    await addProjectCost(auth, {
      projectId: project.id, traceId: project.trace_id,
      amountGbp: RESEARCH_COST_GBP, reason: 'capsule ongoing research',
    });
    await writeTimeline(auth, {
      projectId: project.id, traceId: project.trace_id,
      eventType: 'research_update',
      message: `Ongoing research updated (${sourceCount} web source${sourceCount === 1 ? '' : 's'})`,
    });
    return true;
  } catch {
    return false; // research must never break the heartbeat
  }
}
