import { getSupabaseAdmin, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import type { RGYRules, RGYState, RGYStatus } from '@/next/types/rgy';

const DEFAULT_RULES: RGYRules = {
  inactivityDaysYellow: 3,
  inactivityDaysRed: 10,
  engagementBoostPerSession: 8,
  greenMinScore: 70,
  yellowMinScore: 35
};

type RuleRow = {
  key: string;
  value: number;
};

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function loadRules(supabase: any): Promise<RGYRules> {
  const { data, error } = await supabase
    .from('rgy_rules')
    .select('key,value')
    .eq('active', true);

  if (error && !safeTableMissing(error)) {
    return DEFAULT_RULES;
  }

  const rows = Array.isArray(data) ? (data as RuleRow[]) : [];
  const byKey = new Map(rows.map(row => [row.key, row.value]));

  return {
    inactivityDaysYellow: asNumber(byKey.get('inactivity_days_yellow'), DEFAULT_RULES.inactivityDaysYellow),
    inactivityDaysRed: asNumber(byKey.get('inactivity_days_red'), DEFAULT_RULES.inactivityDaysRed),
    engagementBoostPerSession: asNumber(
      byKey.get('engagement_boost_per_session'),
      DEFAULT_RULES.engagementBoostPerSession
    ),
    greenMinScore: asNumber(byKey.get('green_min_score'), DEFAULT_RULES.greenMinScore),
    yellowMinScore: asNumber(byKey.get('yellow_min_score'), DEFAULT_RULES.yellowMinScore)
  };
}

function statusFromScore(score: number, rules: RGYRules): RGYStatus {
  if (score >= rules.greenMinScore) return 'green';
  if (score >= rules.yellowMinScore) return 'yellow';
  return 'red';
}

function reasonForScore(score: number, status: RGYStatus, daysAway: number, sessionCount: number) {
  if (status === 'green') return `Active - ${sessionCount} sessions in the last 7 days`;
  if (status === 'yellow') return `Idle - last active ${Math.floor(daysAway)}d ago`;
  return `Dormant - ${Math.floor(daysAway)}d since last session`;
}

export async function computeRGYScore(userId: string): Promise<Omit<RGYState, 'changedAt'>> {
  const supabase = getSupabaseAdmin();
  const evaluatedAt = new Date().toISOString();
  if (!supabase) {
    return {
      userId,
      status: 'yellow',
      score: 50,
      reason: 'RGY evaluator unavailable',
      evaluatedAt
    };
  }

  const rules = await loadRules(supabase);
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: lastSession } = await supabase
    .from('conversation_sessions')
    .select('created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSeen = lastSession?.updated_at || lastSession?.created_at;
  const daysAway = lastSeen ? (now - new Date(lastSeen).getTime()) / 86400000 : 999;

  const { count: sessionCountRaw } = await supabase
    .from('conversation_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekAgo);

  const { count: memoryCountRaw } = await supabase
    .from('memory_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('archived_at', null)
    .gte('created_at', weekAgo);

  const sessionCount = sessionCountRaw ?? 0;
  const memoryCount = memoryCountRaw ?? 0;
  let score = 100;

  if (daysAway >= rules.inactivityDaysRed) score -= 70;
  else if (daysAway >= rules.inactivityDaysYellow) score -= 40;
  else if (daysAway >= 1) score -= 15;

  score += Math.min(sessionCount * rules.engagementBoostPerSession, 30);
  score += Math.min(memoryCount * 2, 10);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const status = statusFromScore(score, rules);

  return {
    userId,
    status,
    score,
    reason: reasonForScore(score, status, daysAway, sessionCount),
    evaluatedAt
  };
}

export async function updateRGYStatus(userId: string): Promise<RGYState | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const computed = await computeRGYScore(userId);
  const now = new Date().toISOString();

  const { data: current } = await supabase
    .from('rgy_status')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  const changed = current?.status !== computed.status;
  const changedAt = changed ? now : undefined;

  const { data: updated, error } = await supabase
    .from('rgy_status')
    .upsert(
      {
        user_id: userId,
        status: computed.status,
        score: computed.score,
        reason: computed.reason,
        evaluated_at: now,
        ...(changedAt ? { changed_at: changedAt } : {}),
        updated_at: now
      },
      { onConflict: 'user_id' }
    )
    .select('status,score,reason,changed_at,evaluated_at')
    .maybeSingle();

  if (error || !updated) return null;

  if (current && changed) {
    await supabase.from('rgy_transitions').insert({
      user_id: userId,
      from_status: current.status,
      to_status: computed.status,
      reason: computed.reason,
      trigger_type: 'cron_eval',
      triggered_at: now,
      metadata: { score: computed.score }
    });
  }

  return {
    userId,
    status: updated.status,
    score: Number(updated.score),
    reason: updated.reason,
    changedAt: updated.changed_at,
    evaluatedAt: updated.evaluated_at
  };
}
