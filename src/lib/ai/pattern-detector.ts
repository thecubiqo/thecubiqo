/**
 * Pattern Detector
 * Reads 90 days of signals and identifies execution patterns that the user
 * cannot see themselves. Runs BEFORE web search in the background agent.
 */

export type PatternType =
  | 'stuck_loop'
  | 'execution_gap'
  | 'recurring_theme'
  | 'stalled_goal'
  | 'burnout_signal';

export interface DetectedPattern {
  type: PatternType;
  description: string;       // human-readable, injected into briefing headline
  evidence: string[];        // signal keywords / summaries supporting the pattern
  recommendation: string;   // specific advice for breaking the pattern
  severity: 'high' | 'med' | 'low';
}

interface SignalRow {
  id: string;
  color: string;
  keyword: string;
  normalized_keyword?: string;
  created_at: string;
  updated_at?: string;
  metadata?: { reasoning?: string };
}

interface BriefingRow {
  id: string;
  domain: string;
  status: string;
  headline?: string;
  updated_at: string;
  recommended_actions?: Array<{ step: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string = new Date().toISOString()): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function groupByKeyword(signals: SignalRow[]): Map<string, SignalRow[]> {
  const map = new Map<string, SignalRow[]>();
  for (const s of signals) {
    const key = (s.normalized_keyword || s.keyword || '').toLowerCase().trim();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern detectors
// ─────────────────────────────────────────────────────────────────────────────

function detectStuckLoop(signals: SignalRow[], domain: string): DetectedPattern | null {
  const greenSignals = signals.filter(s => s.color === 'green');
  const byKeyword = groupByKeyword(greenSignals);

  for (const [keyword, group] of byKeyword) {
    if (group.length >= 4) {
      const span = daysBetween(group[0].created_at, group[group.length - 1].created_at);
      if (span >= 21) { // recurring over 3+ weeks
        return {
          type: 'stuck_loop',
          severity: group.length >= 7 ? 'high' : 'med',
          description: `You've returned to "${keyword}" ${group.length} times over ${Math.round(span)} days without resolution. This is a stuck loop — the same intent keeps surfacing without closure.`,
          evidence: group.slice(0, 3).map(s => `"${s.keyword}" on ${s.created_at.split('T')[0]}`),
          recommendation: `Stop planning this differently and start executing the smallest possible version. A stuck loop means the planning is the avoidance. Pick the single next physical action and do it in the next hour.`
        };
      }
    }
  }
  return null;
}

function detectExecutionGap(signals: SignalRow[], outcomes: any[]): DetectedPattern | null {
  const greenSignals = signals.filter(s => s.color === 'green');
  if (greenSignals.length < 5) return null;

  const oldSignals = greenSignals.filter(s => daysBetween(s.created_at) > 14);
  if (oldSignals.length < 3) return null;

  const hasOutcomes = outcomes && outcomes.length > 0;
  if (!hasOutcomes && oldSignals.length >= 5) {
    return {
      type: 'execution_gap',
      severity: 'high',
      description: `You have ${greenSignals.length} green goal signals over the past 90 days with no recorded outcomes. Goal-setting without execution tracking is a common pattern that keeps people busy without moving forward.`,
      evidence: oldSignals.slice(0, 3).map(s => `"${s.keyword}" — ${Math.round(daysBetween(s.created_at))} days old`),
      recommendation: `The gap is between intention and accountability. For each goal capsule, commit to one measurable outcome by a specific date — and report back whether it happened. The briefing will track this for you.`
    };
  }
  return null;
}

function detectRecurringTheme(signals: SignalRow[]): DetectedPattern | null {
  // Look for thematically similar keywords across different capsule sessions
  const themeGroups: Record<string, SignalRow[]> = {
    'not launching / shipping': signals.filter(s =>
      /launch|ship|release|deploy|go.live|publish/i.test(s.keyword)
    ),
    'productivity / focus': signals.filter(s =>
      /focus|productiv|distract|procrastinat|overwhelm|busy/i.test(s.keyword)
    ),
    'money / revenue': signals.filter(s =>
      /revenue|money|income|earn|profit|paid|pricing/i.test(s.keyword)
    ),
    'motivation / confidence': signals.filter(s =>
      /motivat|confiden|doubt|impost|fear|stuck|hesit/i.test(s.keyword)
    )
  };

  for (const [theme, group] of Object.entries(themeGroups)) {
    if (group.length >= 3) {
      const span = group.length > 1
        ? daysBetween(group[0].created_at, group[group.length - 1].created_at)
        : 0;
      if (span >= 14) {
        return {
          type: 'recurring_theme',
          severity: 'med',
          description: `The theme of "${theme}" has appeared across ${group.length} capsules over ${Math.round(span)} days. Recurring themes signal a deeper underlying pattern worth addressing directly.`,
          evidence: group.slice(0, 3).map(s => `"${s.keyword}"`),
          recommendation: `Recurring themes are usually symptoms of one root cause. Instead of addressing each instance separately, identify the root constraint: what single change would make all of these go away?`
        };
      }
    }
  }
  return null;
}

function detectStalledGoal(briefings: BriefingRow[]): DetectedPattern | null {
  const stalled = briefings.filter(b =>
    b.status === 'ready' && daysBetween(b.updated_at) > 14
  );

  if (stalled.length >= 2) {
    return {
      type: 'stalled_goal',
      severity: 'med',
      description: `${stalled.length} briefings from previous capsules have been sitting untouched for over 2 weeks. Unfinished briefings accumulate cognitive debt — the cost of remembering what you were going to do.`,
      evidence: stalled.slice(0, 2).map(b =>
        `"${b.domain}" briefing — last updated ${Math.round(daysBetween(b.updated_at))} days ago`
      ),
      recommendation: `Either close these out (decide: do it, delegate it, or delete it) or consolidate them into this briefing. An open loop costs mental energy every day it stays open.`
    };
  }
  return null;
}

function detectBurnoutSignal(signals: SignalRow[]): DetectedPattern | null {
  const last14Days = signals.filter(s => daysBetween(s.created_at) <= 14);
  if (last14Days.length < 5) return null;

  const yellowRed = last14Days.filter(s => s.color === 'yellow' || s.color === 'red');
  const ratio = yellowRed.length / last14Days.length;

  if (ratio >= 0.6) {
    return {
      type: 'burnout_signal',
      severity: ratio >= 0.8 ? 'high' : 'med',
      description: `${Math.round(ratio * 100)}% of your signals in the last 14 days are Yellow/Red — indicating elevated stress or low energy. This is a burnout warning signal.`,
      evidence: [`${yellowRed.length} of ${last14Days.length} recent signals are stress-coded`],
      recommendation: `Before optimizing any goal, protect the platform. Sleep, movement, and one completed small win will restore more capacity than any productivity system. This briefing will focus on the minimum viable action, not the maximum.`
    };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function detectPatterns(
  userId: string,
  domain: string,
  supabase: any
): Promise<DetectedPattern[]> {
  const patterns: DetectedPattern[] = [];

  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // Load signals
    const { data: signals } = await supabase
      .from('signals')
      .select('id, color, keyword, normalized_keyword, created_at, updated_at, metadata')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    const signalRows: SignalRow[] = signals || [];

    // Load prior briefings
    const { data: briefings } = await supabase
      .from('capsule_briefings')
      .select('id, domain, status, headline, updated_at, recommended_actions')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    const briefingRows: BriefingRow[] = briefings || [];

    // Load outcomes
    const { data: outcomes } = await supabase
      .from('user_outcomes')
      .select('id, domain, outcome_type')
      .eq('user_id', userId)
      .gte('captured_at', since);

    // Run all detectors
    const stuckLoop = detectStuckLoop(signalRows, domain);
    if (stuckLoop) patterns.push(stuckLoop);

    const execGap = detectExecutionGap(signalRows, outcomes || []);
    if (execGap) patterns.push(execGap);

    const recurringTheme = detectRecurringTheme(signalRows);
    if (recurringTheme && !stuckLoop) patterns.push(recurringTheme); // avoid overlap

    const stalledGoal = detectStalledGoal(briefingRows);
    if (stalledGoal) patterns.push(stalledGoal);

    const burnout = detectBurnoutSignal(signalRows);
    if (burnout) patterns.push(burnout);

  } catch (err) {
    // Pattern detection is non-critical — don't fail the briefing if this errors
    console.error('[pattern-detector] error:', err);
  }

  // Return max 2 highest-severity patterns to avoid overwhelming the briefing
  return patterns
    .sort((a, b) => {
      const order = { high: 0, med: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 2);
}

export function formatPatternsForBriefing(patterns: DetectedPattern[]): string {
  if (patterns.length === 0) return '';
  return patterns
    .map(p => `⚠️ PATTERN DETECTED (${p.severity.toUpperCase()}): ${p.description}\nRECOMMENDATION: ${p.recommendation}`)
    .join('\n\n');
}
