/**
 * Safety Pattern Cache — S4-E
 * In-process cache (5-min TTL) for Supabase-backed safety patterns.
 * Falls back to hardcoded FALLBACK_PATTERNS if DB is unreachable.
 * Adding/removing a pattern takes effect within 5 minutes — no deploy needed.
 */

export interface SafetyPattern {
  id: string;
  pattern_type: 'crisis' | 'hard_block' | 'age_gate';
  pattern: string;
  flags: string;
  active: boolean;
  priority: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded fallback — emergency backup if DB is unreachable
// ─────────────────────────────────────────────────────────────────────────────

export const FALLBACK_PATTERNS: SafetyPattern[] = [
  { id: 'f1', pattern_type: 'crisis',     pattern: '\\bsuicide\\b',       flags: 'i', active: true, priority: 10 },
  { id: 'f2', pattern_type: 'crisis',     pattern: '\\bself.harm\\b',     flags: 'i', active: true, priority: 10 },
  { id: 'f3', pattern_type: 'crisis',     pattern: '\\bkill myself\\b',   flags: 'i', active: true, priority: 10 },
  { id: 'f4', pattern_type: 'crisis',     pattern: '\\bend my life\\b',   flags: 'i', active: true, priority: 10 },
  { id: 'f5', pattern_type: 'crisis',     pattern: '\\bwant to die\\b',   flags: 'i', active: true, priority: 9  },
  { id: 'f6', pattern_type: 'hard_block', pattern: '\\bchild.porn\\b',    flags: 'i', active: true, priority: 10 },
  { id: 'f7', pattern_type: 'hard_block', pattern: '\\bcsam\\b',          flags: 'i', active: true, priority: 10 },
  { id: 'f8', pattern_type: 'age_gate',   pattern: '\\bgrindr\\b',        flags: 'i', active: true, priority: 5  },
  { id: 'f9', pattern_type: 'age_gate',   pattern: '\\btinder\\b',        flags: 'i', active: true, priority: 5  },
  { id: 'fa', pattern_type: 'age_gate',   pattern: '\\bnsfw\\b',          flags: 'i', active: true, priority: 5  },
  { id: 'fb', pattern_type: 'age_gate',   pattern: '\\bexplicit\\b',      flags: 'i', active: true, priority: 4  },
  { id: 'fc', pattern_type: 'age_gate',   pattern: '\\bhookup\\b',        flags: 'i', active: true, priority: 4  },
];

// ─────────────────────────────────────────────────────────────────────────────
// In-process cache
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache: { patterns: SafetyPattern[]; loadedAt: number } | null = null;

export async function getSafetyPatterns(supabase: any): Promise<SafetyPattern[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.patterns;
  }

  try {
    const { data, error } = await supabase
      .from('safety_patterns')
      .select('id, pattern_type, pattern, flags, active, priority')
      .eq('active', true)
      .order('priority', { ascending: false });

    if (error || !data?.length) {
      console.warn('[safety-pattern-cache] DB unavailable, using fallback patterns:', error?.message);
      return FALLBACK_PATTERNS;
    }

    cache = { patterns: data as SafetyPattern[], loadedAt: Date.now() };
    return cache.patterns;
  } catch (err) {
    console.warn('[safety-pattern-cache] exception, using fallback patterns:', err);
    return FALLBACK_PATTERNS;
  }
}

/** Bust the cache (useful in tests or after a known pattern update) */
export function bustSafetyPatternCache() {
  cache = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern matchers
// ─────────────────────────────────────────────────────────────────────────────

export function matchesPatternType(
  input: string,
  patterns: SafetyPattern[],
  type: SafetyPattern['pattern_type']
): boolean {
  return patterns
    .filter(p => p.pattern_type === type)
    .some(p => {
      try {
        return new RegExp(p.pattern, p.flags).test(input);
      } catch {
        return false;
      }
    });
}

export function isCrisisInput(input: string, patterns: SafetyPattern[]): boolean {
  return matchesPatternType(input, patterns, 'crisis');
}

export function isHardBlockedInput(input: string, patterns: SafetyPattern[]): boolean {
  return matchesPatternType(input, patterns, 'hard_block');
}

export function isAgeGatedInput(input: string, patterns: SafetyPattern[]): boolean {
  return matchesPatternType(input, patterns, 'age_gate');
}
