/**
 * LLM Project Planner — persona-loaded plan generation for Duo projects.
 *
 * Ported (by hand) from the goodfeatureslegacy planner: one generateObject
 * call produces the goal interpretation AND the task graph, grounded in the
 * user's persona (profile, AI read, confirmed RGY signals, weighted memory).
 *
 * This is the PRIMARY planning path. entry-gate falls back to the
 * deterministic goal-interpreter + task-graph-builder when no LLM is
 * configured or the call fails — same plan shape either way, so the
 * plan-review gate and worker pipeline are unaffected.
 *
 * Safety invariants (mirrored from the deterministic planner):
 *   • First task is always safe (research/draft — never an external write).
 *   • External-impact tasks carry approvalRequired: true.
 *   • Routes are constrained to the ROUTE_ORDER set.
 */

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { DuoGoalInterpretation, DuoTaskPlan } from '@/next/types/duo';
import type { AgentAuth } from './common';
import { getModel } from '../config/llm';

const ROUTES = ['api', 'mcp', 'extension', 'stagehand_browserbase', 'visible_browser', 'headless', 'computer_use', 'manual'] as const;
const RISKS = ['low', 'medium', 'high', 'critical'] as const;

const PlanSchema = z.object({
  domain: z.string(),
  successCriteria: z.array(z.string()).min(1).max(6),
  knownContext: z.array(z.string()).max(6),
  missingInfo: z.array(z.string()).max(4),
  riskLevel: z.enum(RISKS),
  routeHints: z.array(z.enum(ROUTES)).min(1).max(4),
  tasks: z.array(z.object({
    title: z.string().min(3).max(120),
    description: z.string().max(600),
    dependsOnTitles: z.array(z.string()).max(4),
    preferredRoute: z.enum(ROUTES),
    connectorPlatform: z.string().optional(),
    riskLevel: z.enum(RISKS),
    approvalRequired: z.boolean(),
    canParallelize: z.boolean(),
  })).min(3).max(7),
});

async function loadPersona(auth: AgentAuth) {
  const db = auth.supabase;
  const userId = auth.user.id;
  const [profile, aiProfile, signals, memories] = await Promise.all([
    db.from('profiles').select('city,country,primary_goal,goal_domain,daily_context,display_name').eq('id', userId).maybeSingle(),
    db.from('user_ai_profile').select('personality_read,primary_drive,communication_style,current_phase,what_motivates,what_blocks,open_loops').eq('user_id', userId).maybeSingle(),
    db.from('signals').select('color,keyword').eq('user_id', userId).eq('intent_status', 'confirmed').limit(12),
    db.from('memory_events').select('summary,weight').eq('user_id', userId).is('archived_at', null).order('weight', { ascending: false }).limit(6),
  ]);
  return {
    profile: profile.data, aiProfile: aiProfile.data,
    signals: signals.data || [], memories: memories.data || [],
  };
}

function personaToString(p: Awaited<ReturnType<typeof loadPersona>>) {
  const parts: string[] = [];
  if (p.profile?.display_name) parts.push(`Name: ${p.profile.display_name}`);
  if (p.profile?.city || p.profile?.country) parts.push(`Location: ${[p.profile?.city, p.profile?.country].filter(Boolean).join(', ')}`);
  if (p.profile?.primary_goal) parts.push(`Primary goal: ${p.profile.primary_goal}`);
  if (p.profile?.daily_context) parts.push(`Context: ${p.profile.daily_context}`);
  if (p.aiProfile?.personality_read) parts.push(`Personality: ${p.aiProfile.personality_read}`);
  if (p.aiProfile?.primary_drive) parts.push(`Drive: ${p.aiProfile.primary_drive}`);
  if (p.aiProfile?.what_motivates) parts.push(`Motivated by: ${p.aiProfile.what_motivates}`);
  if (p.aiProfile?.what_blocks) parts.push(`Blocked by: ${p.aiProfile.what_blocks}`);
  if (p.signals.length) parts.push(`Signals: ${p.signals.map((s: any) => `${s.color}/${s.keyword}`).join(', ')}`);
  if (p.memories.length) parts.push(`Memories: ${p.memories.map((m: any) => m.summary).join(' | ')}`);
  return parts.join('\n') || 'New user — no persona data yet.';
}

/**
 * Generate a persona-grounded plan. Returns null when no LLM is configured or
 * the call fails — callers fall back to the deterministic planner.
 */
export async function planProjectLLM(
  auth: AgentAuth,
  input: { goal: string; domain?: string | null }
): Promise<{ interpretation: DuoGoalInterpretation; taskPlans: DuoTaskPlan[] } | null> {
  if (!(process.env.ANTHROPIC_API_KEY || '').trim()) return null;

  try {
    const persona = await loadPersona(auth);
    const { object: plan } = await generateObject({
      model: anthropic(getModel('claude_agent')),
      schema: PlanSchema,
      system: [
        "You are CubiQo's DuoMode project planner. You create universal project plans that work for any goal.",
        '',
        'USER PERSONA:',
        personaToString(persona),
        '',
        'Rules:',
        '- Build a 3-7 task plan. The FIRST task must always be safe (research, analysis, draft — never an irreversible or external-write action) and depend on nothing.',
        '- Any task that sends, submits, publishes, pays, deploys, or deletes externally MUST have approvalRequired: true and riskLevel high or critical.',
        `- preferredRoute must be one of: ${ROUTES.join(', ')}. Use "api" with a connectorPlatform (gmail, linkedin, googlecalendar, github, shopify, notion, slack...) when a connected service fits; "manual" when only the user can act.`,
        '- dependsOnTitles must reference exact titles of earlier tasks in this plan.',
        '- Risk assessment must reflect actual consequences, not theatre.',
        '- knownContext: facts from the persona relevant to this goal. missingInfo: critical unknowns blocking a good plan (empty if none).',
      ].join('\n'),
      prompt: `Create a project plan for this goal: "${input.goal}"${input.domain ? ` (domain hint: ${input.domain})` : ''}`,
    });

    // Defensive normalization: unique titles, valid dependency references —
    // and the safety invariants ENFORCED in code, not just prompted:
    //   • task 0 is always side-effect-free (no connector → executor cannot
    //     reach an external write for it)
    //   • every connector-bearing task is clamped to riskLevel ≥ high and
    //     approvalRequired = true, exactly like the deterministic builder
    const seen = new Set<string>();
    const tasks = plan.tasks.filter(t => {
      const key = t.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const titles = new Set(tasks.map(t => t.title));
    const HIGH_OR_ABOVE = new Set(['high', 'critical']);
    const taskPlans: DuoTaskPlan[] = tasks.map((t, i) => {
      const connectorPlatform = i === 0 ? undefined : (t.connectorPlatform || undefined);
      const external = Boolean(connectorPlatform);
      return {
        title: t.title,
        description: t.description,
        dependsOnTitles: i === 0 ? [] : t.dependsOnTitles.filter(d => titles.has(d) && d !== t.title),
        preferredRoute: t.preferredRoute,
        connectorPlatform,
        riskLevel: external && !HIGH_OR_ABOVE.has(t.riskLevel) ? 'high' : t.riskLevel,
        approvalRequired: external ? true : t.approvalRequired,
        canParallelize: t.canParallelize,
      };
    });

    const interpretation: DuoGoalInterpretation = {
      goal: input.goal,
      domain: plan.domain,
      successCriteria: plan.successCriteria,
      knownContext: plan.knownContext,
      missingInfo: plan.missingInfo,
      riskLevel: plan.riskLevel,
      routeHints: plan.routeHints,
    };

    return { interpretation, taskPlans };
  } catch {
    // Planning must never block project creation — deterministic fallback.
    return null;
  }
}
