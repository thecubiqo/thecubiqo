/**
 * Prompt Loader — S4-F
 * DB-driven system prompts with 10-min in-process cache and hardcoded fallback.
 * Edit a prompt in the system_prompts table → live within 10 minutes. No deploy.
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const promptCache = new Map<string, { content: string; loadedAt: number }>();

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded fallbacks — exact current prompt text as emergency backup
// These are returned if the DB is unavailable.
// Keep in sync when making prompt changes (or the fallback will be outdated).
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_PROMPTS: Record<string, string> = {
  base: `You are CubiQo — a proactive AI system that helps users achieve their goals through research, planning, and intelligent execution. You are direct, specific, and action-oriented. You never give generic advice when specific advice is possible. You think in terms of outcomes, not activities.`,

  career_addendum: `CAREER MODE: You are an expert career strategist. Adapt completely to the user's specific role, industry, and career level. Whether they are a nurse, engineer, lawyer, designer, teacher, or any other profession — your strategy is tailored to their context. Focus on ATS optimization, targeted applications, interview preparation, and negotiation strategy.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Load prompt from DB (with cache)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPrompt(name: string, supabase: any): Promise<string> {
  const cached = promptCache.get(name);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.content;
  }

  try {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('name', name)
      .eq('active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.content || data.content.startsWith('__REPLACE_WITH')) {
      // DB missing, table not created yet, or placeholder not replaced — use fallback
      const fallback = FALLBACK_PROMPTS[name] || '';
      promptCache.set(name, { content: fallback, loadedAt: Date.now() });
      return fallback;
    }

    promptCache.set(name, { content: data.content, loadedAt: Date.now() });
    return data.content;
  } catch {
    const fallback = FALLBACK_PROMPTS[name] || '';
    promptCache.set(name, { content: fallback, loadedAt: Date.now() });
    return fallback;
  }
}

/** Bust cache for a specific prompt or all prompts */
export function bustPromptCache(name?: string) {
  if (name) {
    promptCache.delete(name);
  } else {
    promptCache.clear();
  }
}
