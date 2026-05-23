import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

let cache: Array<{ pattern: string; category?: string }> | null = null;
let cacheTs = 0;
const TTL_MS = 5 * 60 * 1000;

export async function getSafetyPatterns() {
  if (cache && Date.now() - cacheTs < TTL_MS) return cache;
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from('safety_patterns')
    .select('pattern,category')
    .eq('active', true);
  cache = (data || []) as Array<{ pattern: string; category?: string }>;
  cacheTs = Date.now();
  return cache;
}

export function clearSafetyPatternCache() {
  cache = null;
  cacheTs = 0;
}
