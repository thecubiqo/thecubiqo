/**
 * RGY context cards — emitted when CubiQo detects a meaningful shift in
 * the user's RGY state. Surfaced as floating cards over the hero by
 * <CubiQoOverlays /> per UI Architecture §Card System.
 *
 * Trigger conditions (in priority order):
 *   1. 🔴 RED for 3 consecutive days  → "You've been in the RED zone for
 *      3 days. Want to talk about what's going on?"
 *   2. Dominance flip in last 24h (e.g. ≥60% one colour yesterday, ≥60%
 *      another colour today) → "Your day shifted from {prev} to {curr}.
 *      What happened?"
 *   3. New high-confidence signal generated while user was off-thread
 *      (no chat activity in last 4h, but signal landed) → "I noticed a
 *      new {color} signal: {keyword}."
 *
 * Each card has a stable id so dismissal sticks across polls — the id is
 * derived from the trigger + the day, not random, so re-fires only happen
 * if the underlying condition is still true the next day.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

type SignalRow = {
  id: string;
  color?: string | null;
  keyword?: string | null;
  confidence?: number | null;
  created_at: string;
};

type ContextCard = {
  id: string;
  color: 'green' | 'yellow' | 'red';
  headline: string;
  body?: string;
  cta_href?: string;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dominantColor(signals: SignalRow[]): 'green' | 'yellow' | 'red' | null {
  if (signals.length === 0) return null;
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const s of signals) {
    const c = String(s.color || '').toLowerCase();
    if (c === 'green' || c === 'yellow' || c === 'red') counts[c]++;
  }
  const total = counts.green + counts.yellow + counts.red;
  if (total === 0) return null;
  const top = (['red', 'yellow', 'green'] as const).find(c => counts[c] / total >= 0.6);
  return top || null;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  const { data: signals, error } = await supabase
    .from('signals')
    .select('id, color, keyword, confidence, created_at')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(200);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ cards: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cards: ContextCard[] = [];
  const list: SignalRow[] = signals || [];

  // ── Trigger 1: 3 consecutive RED days ────────────────────────────────────
  const byDay = new Map<string, SignalRow[]>();
  for (const s of list) {
    const k = dayKey(new Date(s.created_at));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(s);
  }
  const last3Days = [0, 1, 2].map(off => dayKey(new Date(now.getTime() - off * 86_400_000)));
  const dominantPerDay = last3Days.map(d => dominantColor(byDay.get(d) || []));
  if (dominantPerDay.every(c => c === 'red')) {
    cards.push({
      id: `red-streak-${last3Days[0]}`,
      color: 'red',
      headline: "CubiQo noticed something",
      body: "You've been in the RED zone for 3 days. Want to talk about what's going on?",
      cta_href: '/app'
    });
  }

  // ── Trigger 2: 24h dominance flip ─────────────────────────────────────────
  if (cards.length === 0) {
    const today = dominantColor(byDay.get(last3Days[0]) || []);
    const yesterday = dominantColor(byDay.get(last3Days[1]) || []);
    if (today && yesterday && today !== yesterday) {
      cards.push({
        id: `flip-${last3Days[0]}-${yesterday}-${today}`,
        color: today,
        headline: `Your day shifted from ${yesterday.toUpperCase()} to ${today.toUpperCase()}`,
        body: 'CubiQo noticed the change. Want to talk about it?',
        cta_href: '/app'
      });
    }
  }

  // ── Trigger 3: new high-confidence signal off-thread ─────────────────────
  if (cards.length === 0 && list.length > 0) {
    const latest = list[0];
    const conf = Number(latest.confidence || 0);
    const fourHoursAgo = new Date(now.getTime() - 4 * 3_600_000).toISOString();
    // Skip if user was active in chat recently — check memory_events
    const { data: recentChats } = await supabase
      .from('memory_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', 'chat_message')
      .gte('created_at', fourHoursAgo)
      .limit(1);
    const offThread = (recentChats?.length || 0) === 0;
    if (offThread && conf >= 0.75 && latest.keyword) {
      const color = (['green', 'yellow', 'red'] as const).includes(latest.color as any)
        ? (latest.color as 'green' | 'yellow' | 'red')
        : 'yellow';
      cards.push({
        id: `signal-${latest.id}`,
        color,
        headline: `New ${color.toUpperCase()} signal: ${latest.keyword}`,
        body: 'Tap to pick it up with CubiQo.',
        cta_href: '/app'
      });
    }
  }

  return NextResponse.json({ cards });
}
