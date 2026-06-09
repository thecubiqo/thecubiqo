/**
 * LlmRole — the full set of named model slots in CubiQo.
 *
 * Cost tiers (cheapest → strongest):
 *   Anthropic  : claude_view / claude_scout / claude_classify (Haiku-class, high-volume)
 *                claude_agent (Sonnet-class, complex reasoning)
 *   OpenAI     : utility / scoring / tailoring / stagehand (gpt-4o-mini-class)
 *                agent / chat (gpt-4.1 / gpt-5-class, long-context + tool use)
 *
 * Override any slot via the corresponding env var (see getModel() below).
 * "Not a manual fallback system" — the agent picks the right tier automatically
 * based on the task role. No hardcoded model strings outside this file.
 */
export type LlmRole =
  // ── OpenAI / OpenRouter ──────────────────────────────────────────────────────
  | 'agent'       // Long-running tool-use tasks (expensive, capable)
  | 'chat'        // Real-time user chat
  | 'utility'     // Short summarise / reformat passes (cheap)
  | 'stagehand'   // Browser automation (Stagehand-optimised)
  | 'scoring'     // Numeric scoring (cold, tiny output)
  | 'tailoring'   // CV / cover-letter rewriting
  | 'rgy'         // RGY layer classification
  // ── Anthropic / Claude ──────────────────────────────────────────────────────
  | 'claude_view'     // Capsule live-view generation   — Haiku (fast, cheap)
  | 'claude_scout'    // Opportunity synthesis           — Haiku (fast, cheap)
  | 'claude_classify' // General classification tasks   — Haiku (high-volume, cheap)
  | 'claude_agent';   // Complex agentic reasoning tasks — Sonnet (capable)

function env(...keys: string[]) {
  for (const key of keys) {
    const value = (process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function num(key: string, fallback: number) {
  const value = Number.parseInt(process.env[key] || '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function float(key: string, fallback: number) {
  const value = Number.parseFloat(process.env[key] || '');
  return Number.isFinite(value) ? value : fallback;
}

export function getModel(role: LlmRole): string {
  const models: Record<LlmRole, string> = {
    // ── OpenAI / OpenRouter ────────────────────────────────────────────────────
    // Env overrides let you hot-swap a cheaper or newer model without a deploy.
    // NOTE: these are BARE OpenAI model ids — every consumer wraps them in
    // createOpenAI(...) or sends them in a direct OpenAI REST body. Do NOT use
    // gateway-prefixed slugs ("openai/…") here or those consumers 404.
    agent:     env('OPENAI_MODEL', 'AGENT_MODEL')                       || 'gpt-4.1-mini',
    chat:      env('CHAT_MODEL', 'OPENAI_MODEL')                        || 'gpt-4.1',
    utility:   env('UTILITY_MODEL')                                      || 'gpt-4o-mini',
    stagehand: env('STAGEHAND_MODEL_NAME', 'STAGEHAND_MODEL', 'OPENAI_MODEL') || 'gpt-4.1-mini',
    scoring:   env('JOB_SCORING_MODEL', 'UTILITY_MODEL')                || 'gpt-4o-mini',
    tailoring: env('TAILORING_MODEL', 'OPENAI_MODEL')                   || 'gpt-4o-mini',
    rgy:       env('RGY_MODEL', 'OPENAI_MODEL', 'AI_MODEL')             || 'gpt-4.1',

    // ── Anthropic / Claude ─────────────────────────────────────────────────────
    // Default to Haiku for high-frequency, low-cost inference. Override per-env
    // (e.g. CLAUDE_VIEW_MODEL=claude-sonnet-4-5 for richer dashboards in prod).
    claude_view:     env('DUO_VIEW_MODEL', 'CLAUDE_VIEW_MODEL')              || 'claude-3-5-haiku-20241022',
    claude_scout:    env('OPPORTUNITY_SCOUT_MODEL', 'CLAUDE_SCOUT_MODEL')    || 'claude-3-5-haiku-20241022',
    claude_classify: env('CLAUDE_CLASSIFY_MODEL', 'RGY_CLASSIFY_MODEL')     || 'claude-3-5-haiku-20241022',
    claude_agent:    env('CLAUDE_AGENT_MODEL', 'ANTHROPIC_MODEL')            || 'claude-sonnet-4-5',
  };
  return models[role];
}

export function getOpenRouterModel() {
  return env('OPENROUTER_MODEL') || 'anthropic/claude-3.5-sonnet';
}

export function getAgentParams() {
  return {
    temperature: float('AGENT_TEMPERATURE', 0.7),
    maxSteps: num('AGENT_MAX_STEPS', 4),
    maxTokens: num('AGENT_MAX_TOKENS', 4096)
  };
}

export function getChatParams() {
  return {
    maxSteps: num('CHAT_MAX_STEPS', 3)
  };
}

export function getUtilityParams() {
  return {
    temperature: float('UTILITY_TEMPERATURE', 0.7),
    maxTokens: num('UTILITY_MAX_TOKENS', 200)
  };
}

export function getContextParams() {
  return {
    temperature: float('CONTEXT_TEMPERATURE', 0.1),
    maxTokens: num('CONTEXT_MAX_TOKENS', 600)
  };
}

export function getScoringParams() {
  return {
    temperature: float('SCORING_TEMPERATURE', 0),
    maxTokens: num('SCORING_MAX_TOKENS', 10)
  };
}

export function getTailoringParams() {
  return {
    temperature: float('TAILORING_TEMPERATURE', 0.3),
    maxTokens: num('TAILORING_MAX_TOKENS', 800)
  };
}
