/**
 * GET /api/cron/opportunity-scout
 *
 * Daily proactive discovery. For each recently-active user, CubiQo researches
 * the web against their goals/interests and surfaces opportunities — drafting a
 * capsule for the strongest (which waits at the Plan Review gate) and nudging
 * the rest. The founder additionally gets CubiQo-growth + fundraising scouting.
 *
 * Bounded: processes a capped number of users per run, one draft capsule per
 * user per day, and every discovered capsule is gated by plan-review + budget.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { scoutForUser } from '@/next/lib/agent/opportunity-scout';
import type { AgentAuth } from '@/next/lib/agent/common';

export const runtime = 'nodejs';
export const maxDuration = 300;

const FOUNDER_EMAIL = 'aditya@cubiqo.ai';
const MAX_USERS = 25;
const ACTIVITY_WINDOW_DAYS = 14;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });

  // Recently-active users (have an AI profile touched within the window).
  const cutoff = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: profiles, error } = await admin
    .from('user_ai_profile')
    .select('user_id, last_updated')
    .gte('last_updated', cutoff)
    .order('last_updated', { ascending: false })
    .limit(MAX_USERS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = new Set<string>((profiles || []).map((p: any) => p.user_id).filter(Boolean));

  // Always include the founder, even if quiet recently.
  let founderId: string | null = null;
  try {
    const { data: founderRows } = await admin
      .from('admin_roles')
      .select('user_id')
      .eq('role', 'owner')
      .is('revoked_at', null)
      .limit(1);
    founderId = founderRows?.[0]?.user_id ?? null;
  } catch { /* admin_roles optional */ }
  if (founderId) userIds.add(founderId);

  const results: Array<{ userId: string; result?: unknown; error?: string }> = [];
  for (const userId of userIds) {
    try {
      // Founder detection: matches the owner role above, or the founder email.
      let isFounder = userId === founderId;
      if (!isFounder) {
        const { data: u } = await admin.auth.admin.getUserById(userId);
        isFounder = (u?.user?.email || '').toLowerCase() === FOUNDER_EMAIL;
      }
      const auth = { supabase: admin, user: { id: userId } } as AgentAuth;
      const result = await scoutForUser(auth, { isFounder });
      results.push({ userId, result });
    } catch (err) {
      results.push({ userId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const capsules = results.reduce((n, r: any) => n + (r.result?.capsulesCreated?.length || 0), 0);
  const nudges = results.reduce((n, r: any) => n + (r.result?.nudges || 0), 0);
  return NextResponse.json({ users: userIds.size, capsules, nudges, results });
}
