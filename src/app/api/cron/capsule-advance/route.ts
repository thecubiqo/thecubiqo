/**
 * GET /api/cron/capsule-advance
 *
 * Backstop for the proactive capsule engine. While a capsule's dashboard is
 * open the client heartbeats /tick directly; this cron keeps RECENTLY-ACTIVE
 * capsules moving for a while after the tab closes, so CubiQo genuinely keeps
 * working the goal in the background.
 *
 * Guard rails (deliberate, to avoid surprise spend):
 *   • Only 'active' projects updated within RECENCY_WINDOW are advanced — long
 *     dormant capsules are left alone until the owner reopens them.
 *   • Each project advances at most ONE step per run.
 *   • The per-project budget gate (inside advanceCapsule) is the hard cap.
 *
 * Auth: Vercel cron sends `Authorization: Bearer <CRON_SECRET>`. We also accept
 * the internal `x-cubiqo-internal` header for manual/admin triggering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { advanceCapsule } from '@/next/lib/agent/capsule-engine';
import type { AgentAuth } from '@/next/lib/agent/common';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RECENCY_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours — keep capsules iterating in the background
const MAX_PROJECTS = 20;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });

  const cutoff = new Date(Date.now() - RECENCY_WINDOW_MS).toISOString();
  // 'active' → advance a task + refresh the view (iterate to better data).
  // 'planning' → refresh the metrics dashboard only (no task execution), so a
  // just-given capsule gets its rich dashboard even with the tab closed.
  const { data: projects, error } = await admin
    .from('duo_projects')
    .select('id,user_id,status,updated_at')
    .in('status', ['active', 'planning'])
    .gte('updated_at', cutoff)
    .order('updated_at', { ascending: false })
    .limit(MAX_PROJECTS);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!projects?.length) return NextResponse.json({ advanced: 0, projects: 0 });

  const results: Array<{ projectId: string; state: string; executed: string | null }> = [];
  for (const project of projects) {
    try {
      // Build a user-scoped auth context backed by the admin client. Every
      // engine query still filters by this user_id, so cross-tenant access is
      // impossible even though the admin client bypasses RLS.
      const auth = { supabase: admin, user: { id: project.user_id } } as AgentAuth;
      const result = await advanceCapsule(auth, project.id);
      results.push({ projectId: project.id, state: result.state, executed: result.executedTaskId ?? null });
    } catch (err) {
      results.push({ projectId: project.id, state: 'error', executed: null });
    }
  }

  const advanced = results.filter(r => r.state === 'advanced').length;
  return NextResponse.json({ projects: projects.length, advanced, results });
}
