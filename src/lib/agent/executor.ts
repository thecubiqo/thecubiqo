/**
 * Duo Task Executor — the real work engine behind worker.ts.
 *
 * worker.ts owns the pipeline (gates, approvals, budget, dependencies);
 * this module owns the WORK: producing genuine draft artifacts and carrying
 * out the approved action through the selected route.
 *
 * Routes:
 *   api (+ connector_platform)  → Composio tool-use loop (real external calls)
 *   research-shaped tasks       → web search (Tavily chain) + LLM synthesis
 *   everything else             → LLM-produced deliverable artifact
 *   manual                      → honest handoff checklist (no fake completion)
 *
 * Cost tiering ("use models as per need"): Haiku-class for low/medium-risk
 * drafting and synthesis, Sonnet-class for high-risk drafts and any tool-use
 * execution. Real token usage is converted to GBP and reported to the budget
 * gate. Degrades to deterministic templates when ANTHROPIC_API_KEY is absent,
 * so the pipeline never hard-fails on configuration.
 */

import { generateText, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { AgentAuth } from './common';
import { getModel, getAgentParams } from '../config/llm';
import { getUserTools, COMPOSIO_APPS, type ComposioApp } from '../composio';
import { webSearch, searchConfigured } from '@/next/app/api/_lib/web-search';

// GBP per 1M tokens (input, output) — rough but real enough for budget gating.
const COST_GBP: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5': { in: 0.8, out: 4 },
  'claude-sonnet-4-5': { in: 2.4, out: 12 },
};
const DEFAULT_COST = { in: 2.4, out: 12 };

const RESEARCH_RE = /\b(research|find|search|compare|scout|analy[sz]e|market|trends?|news|investigate|sources?|review options)\b/i;

export interface ExecutionOutcome {
  summary: string;
  artifactContent: string | null;
  artifactType: 'deliverable' | 'research' | 'handoff';
  costGbp: number;
  toolSteps: number;
  evidence: Record<string, unknown>;
}

function hasAnthropicKey() {
  return Boolean((process.env.ANTHROPIC_API_KEY || '').trim());
}

function usageCostGbp(model: string, usage?: { inputTokens?: number; outputTokens?: number }) {
  const rate = COST_GBP[model] || DEFAULT_COST;
  const inTok = usage?.inputTokens ?? 0;
  const outTok = usage?.outputTokens ?? 0;
  const cost = (inTok * rate.in + outTok * rate.out) / 1_000_000;
  // Never report zero for a real call — floor at a tenth of a penny.
  return Math.max(cost, 0.001);
}

function pickDraftModel(task: any): string {
  const highStakes = ['high', 'critical'].includes(task.risk_level || '') || Boolean(task.connector_platform);
  return getModel(highStakes ? 'claude_agent' : 'claude_view');
}

async function projectContext(auth: AgentAuth, projectId: string): Promise<string> {
  const { data } = await auth.supabase
    .from('duo_projects').select('*').eq('id', projectId).maybeSingle();
  if (!data) return '';
  const bits = [data.title, data.goal, data.description].filter(Boolean);
  return bits.length ? `Project context: ${bits.join(' — ')}` : '';
}

// ── Draft production ──────────────────────────────────────────────────────────

/**
 * Produce the real work-product draft the user reviews before anything writes.
 * Falls back to the deterministic template when no LLM is configured.
 */
export async function draftWorkProduct(
  auth: AgentAuth,
  task: any,
  route: string,
  templateFallback: string
): Promise<{ content: string; costGbp: number; model: string | null }> {
  if (!hasAnthropicKey()) return { content: templateFallback, costGbp: 0, model: null };

  const model = pickDraftModel(task);
  const context = await projectContext(auth, task.project_id);
  try {
    const result = await generateText({
      model: anthropic(model),
      system: [
        'You are CubiQo\'s execution agent producing a DRAFT work product for user review.',
        'Produce the actual deliverable content (the real email text, post copy, plan, document, or analysis) — not a description of what you would do.',
        'The user will review this draft before anything executes. Be concrete and complete.',
        'End with a short "Before confirming, verify" checklist of 2-3 task-specific checks.',
      ].join('\n'),
      prompt: [
        context,
        `Task: ${task.title}`,
        task.description ? `Details: ${task.description}` : '',
        `Selected route: ${route}`,
        task.connector_platform ? `Target platform: ${task.connector_platform}` : '',
      ].filter(Boolean).join('\n'),
      maxOutputTokens: 1200,
    });
    return { content: result.text, costGbp: usageCostGbp(model, result.usage), model };
  } catch {
    // LLM failure must never block the pipeline — the template keeps the
    // draft→approve flow intact and the next attempt can retry the LLM.
    return { content: templateFallback, costGbp: 0, model: null };
  }
}

// ── Execution ─────────────────────────────────────────────────────────────────

function toComposioApp(platform?: string | null): ComposioApp | null {
  if (!platform) return null;
  const slug = String(platform).toLowerCase();
  const values = Object.values(COMPOSIO_APPS) as string[];
  return values.includes(slug) ? (slug as ComposioApp) : null;
}

async function latestDraft(auth: AgentAuth, taskId: string): Promise<string | null> {
  const { data } = await auth.supabase
    .from('duo_artifacts')
    .select('content')
    .eq('task_id', taskId)
    .eq('artifact_type', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.content ?? null;
}

async function hasApprovedDraftReview(auth: AgentAuth, taskId: string): Promise<boolean> {
  const { data } = await auth.supabase
    .from('duo_approvals')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', auth.user.id)
    .eq('approval_type', 'draft_review')
    .eq('status', 'approved')
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function executeViaComposio(auth: AgentAuth, task: any, app: ComposioApp): Promise<ExecutionOutcome> {
  // Hard backstop, independent of the worker's gates: external tools NEVER
  // fire without an approved draft review on record. The worker forces draft
  // review for every api+connector task, so this is unreachable in the normal
  // flow — it exists so no future gate regression can reach a real write.
  if (!(await hasApprovedDraftReview(auth, task.id))) {
    throw new Error('External execution blocked: no approved draft review for this task');
  }

  const model = getModel('claude_agent');
  const params = getAgentParams();
  const tools = await getUserTools(auth.user.id, [app]);
  if (!tools || Object.keys(tools).length === 0) {
    throw new Error(`No ${app} tools available — connector not active`);
  }
  const context = await projectContext(auth, task.project_id);
  // The user approved a specific draft — execute THAT content, not a fresh take.
  const draft = await latestDraft(auth, task.id);
  const result = await generateText({
    model: anthropic(model),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools as any,
    stopWhen: stepCountIs(params.maxSteps),
    system: [
      'You are CubiQo\'s execution agent. The user has APPROVED this task — carry it out now using the provided tools.',
      'Execute ONLY what the approved task describes. Do not take additional actions beyond its scope.',
      draft ? 'An approved draft is provided: execute ITS content faithfully — do not change its substance, recipients, or scope.' : '',
      'After acting, state plainly what was done, including any IDs/URLs returned by the tools.',
    ].filter(Boolean).join('\n'),
    prompt: [
      context,
      `Approved task: ${task.title}`,
      task.description ? `Details: ${task.description}` : '',
      draft ? `Approved draft (execute this content):\n${draft}` : '',
    ].filter(Boolean).join('\n'),
    maxOutputTokens: params.maxTokens,
  });
  const toolSteps = (result.steps || []).reduce((n, s) => n + (s.toolCalls?.length || 0), 0);
  return {
    summary: result.text || `Executed via ${app}`,
    artifactContent: result.text || null,
    artifactType: 'deliverable',
    costGbp: usageCostGbp(model, result.usage),
    toolSteps,
    evidence: {
      route: 'api', platform: app, toolSteps,
      toolNames: [...new Set((result.steps || []).flatMap(s => (s.toolCalls || []).map(c => c.toolName)))],
    },
  };
}

async function executeResearch(auth: AgentAuth, task: any): Promise<ExecutionOutcome> {
  const model = getModel(['high', 'critical'].includes(task.risk_level || '') ? 'claude_agent' : 'claude_view');
  const query = `${task.title} ${task.description || ''}`.slice(0, 300);
  let sources = '';
  let sourceCount = 0;
  if (searchConfigured()) {
    try {
      const found = await webSearch(query, 5);
      sourceCount = found.results?.length || 0;
      sources = (found.results || [])
        .map((r: any, i: number) => `[${i + 1}] ${r.title} — ${r.url}\n${r.snippet || r.content || ''}`)
        .join('\n\n');
    } catch { /* search degraded — synthesize from model knowledge, noted below */ }
  }
  const context = await projectContext(auth, task.project_id);
  const result = await generateText({
    model: anthropic(model),
    system: 'You are CubiQo\'s research agent. Produce the completed research deliverable: findings, comparisons, and cited sources where provided. Plain, decision-ready writing.',
    prompt: [
      context,
      `Research task: ${task.title}`,
      task.description ? `Details: ${task.description}` : '',
      sources ? `Web sources:\n${sources}` : 'No live web sources available — state clearly that findings come from model knowledge and may need verification.',
    ].filter(Boolean).join('\n\n'),
    maxOutputTokens: 1600,
  });
  return {
    summary: result.text.slice(0, 280),
    artifactContent: result.text,
    artifactType: 'research',
    costGbp: usageCostGbp(model, result.usage),
    toolSteps: 0,
    evidence: { route: 'research', webSources: sourceCount },
  };
}

async function executeDeliverable(auth: AgentAuth, task: any, route: string): Promise<ExecutionOutcome> {
  const model = pickDraftModel(task);
  const context = await projectContext(auth, task.project_id);
  // Build on the approved draft when one exists — the user approved THAT content.
  const { data: draft } = await auth.supabase
    .from('duo_artifacts')
    .select('content')
    .eq('task_id', task.id)
    .eq('artifact_type', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const result = await generateText({
    model: anthropic(model),
    system: 'You are CubiQo\'s execution agent. Produce the FINAL deliverable for this approved task. If an approved draft is provided, finalize it faithfully — do not change its substance.',
    prompt: [
      context,
      `Approved task: ${task.title}`,
      task.description ? `Details: ${task.description}` : '',
      draft?.content ? `Approved draft:\n${draft.content}` : '',
    ].filter(Boolean).join('\n\n'),
    maxOutputTokens: 1600,
  });
  return {
    summary: result.text.slice(0, 280),
    artifactContent: result.text,
    artifactType: 'deliverable',
    costGbp: usageCostGbp(model, result.usage),
    toolSteps: 0,
    evidence: { route, finalizedFromDraft: Boolean(draft?.content) },
  };
}

function manualHandoff(task: any): ExecutionOutcome {
  const checklist = [
    `## Manual handoff: ${task.title}`,
    '',
    'CubiQo prepared this task but it requires you to perform the final step yourself.',
    '',
    task.description || 'No description provided.',
    '',
    '- [ ] Perform the action above in the target system',
    '- [ ] Mark the task complete in your capsule once done',
  ].join('\n');
  return {
    summary: 'Manual handoff — checklist delivered for user to complete',
    artifactContent: checklist,
    artifactType: 'handoff',
    costGbp: 0,
    toolSteps: 0,
    evidence: { route: 'manual', handoff: true },
  };
}

/**
 * Carry out the approved task through the selected route. Throws on real
 * execution failure — the caller marks the task failed and the queue's
 * retry/dead-letter plumbing takes over.
 */
export async function performExecution(
  auth: AgentAuth,
  task: any,
  route: string
): Promise<ExecutionOutcome> {
  if (route === 'manual') return manualHandoff(task);

  if (!hasAnthropicKey()) {
    // No LLM configured: only the manual route can honestly complete.
    return manualHandoff(task);
  }

  const app = toComposioApp(task.connector_platform);
  if (route === 'api' && app) {
    return executeViaComposio(auth, task, app);
  }

  const taskText = `${task.title} ${task.description || ''}`;
  if (RESEARCH_RE.test(taskText)) {
    return executeResearch(auth, task);
  }

  return executeDeliverable(auth, task, route);
}
