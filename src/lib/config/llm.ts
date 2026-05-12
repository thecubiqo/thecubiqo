export type LlmRole = 'agent' | 'chat' | 'utility' | 'stagehand' | 'scoring' | 'tailoring' | 'rgy';

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
    agent: env('OPENAI_MODEL', 'AGENT_MODEL') || 'gpt-4.1-mini',
    chat: env('CHAT_MODEL', 'OPENAI_MODEL', 'AI_GATEWAY_MODEL') || 'openai/gpt-5.4',
    utility: env('UTILITY_MODEL') || 'gpt-4o-mini',
    stagehand: env('STAGEHAND_MODEL_NAME', 'STAGEHAND_MODEL', 'OPENAI_MODEL') || 'openai/gpt-4.1-mini',
    scoring: env('JOB_SCORING_MODEL', 'UTILITY_MODEL') || 'gpt-4o-mini',
    tailoring: env('TAILORING_MODEL', 'OPENAI_MODEL') || 'gpt-4o-mini',
    rgy: env('RGY_MODEL', 'OPENAI_MODEL', 'AI_MODEL') || 'gpt-5.4'
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
