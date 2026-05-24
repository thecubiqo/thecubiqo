/**
 * Impact Layer — aggregates "what CubiQo actually did for you" metrics.
 *
 * Per CubiQo-PhaseA.md §5.5 Proactive AI / The Impact Layer:
 *  - Goals completed this week
 *  - Hours saved (estimated_minutes_saved sum / 60)
 *  - Connections made
 *  - Media generated
 *  - Appointments booked
 *  - Emails sent
 *  - RGY ratio this week vs last week
 *
 * GET /api/proactive/impact[?window=7]
 * Returns one row per metric — gracefully empty when source tables are missing
 * so the dashboard can render the canonical empty-state with zeros.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function safeCount(query: any): Promise<number> {
  try {
    const { count } = await query;
    return Number(count || 0);
  } catch {
    return 0;
  }
}

async function safeSum(supabase: any, table: string, column: string, where: Record<string, unknown>): Promise<number> {
  try {
    let q = supabase.from(table).select(column);
    for (const [k, v] of Object.entries(where)) {
      if (typeof v === 'object' && v !== null && 'gte' in (v as any)) {
        q = q.gte(k, (v as any).gte);
      } else {
        q = q.eq(k, v as any);
      }
    }
    const { data } = await q;
    return (data || []).reduce((acc: number, row: any) => acc + Number(row?.[column] || 0), 0);
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const url = new URL(request.url);
  const windowDays = Math.min(Math.max(parseInt(url.searchParams.get('window') || '7', 10), 1), 90);
  const since = isoDaysAgo(windowDays);
  const prevSince = isoDaysAgo(windowDays * 2);

  const [
    goalsCompleted,
    duoTasksDone,
    cqFriendshipsAccepted,
    mediaArtifacts,
    appointmentTasks,
    emailTasks,
    minutesSavedSum,
    signalsThisWindow,
    signalsPrevWindow
  ] = await Promise.all([
    safeCount(supabase.from('duo_projects').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).in('status', ['done', 'completed']).gte('updated_at', since)),
    safeCount(supabase.from('duo_tasks').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('status', 'done').gte('updated_at', since)),
    safeCount(supabase.from('cq_friendships').select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted')
      .gte('responded_at', since)),
    safeCount(supabase.from('duo_artifacts').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).in('artifact_type', ['image', 'video']).gte('created_at', since)),
    safeCount(supabase.from('duo_tasks').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('task_type', 'appointment_booking').eq('status', 'done').gte('updated_at', since)),
    safeCount(supabase.from('duo_tasks').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('task_type', 'email_send').eq('status', 'done').gte('updated_at', since)),
    safeSum(supabase, 'duo_tasks', 'estimated_minutes_saved', {
      user_id: user.id,
      status: 'done',
      updated_at: { gte: since }
    }),
    supabase.from('signals').select('color').eq('user_id', user.id).gte('created_at', since),
    supabase.from('signals').select('color').eq('user_id', user.id).gte('created_at', prevSince).lt('created_at', since)
  ]);

  function rgyRatio(rows: any): { green: number; yellow: number; red: number } {
    const data = rows?.data || rows;
    const counts = { green: 0, yellow: 0, red: 0 };
    for (const s of Array.isArray(data) ? data : []) {
      const c = String(s?.color || '').toLowerCase();
      if (c === 'green' || c === 'yellow' || c === 'red') counts[c]++;
    }
    const total = counts.green + counts.yellow + counts.red;
    if (total === 0) return { green: 0, yellow: 0, red: 0 };
    return {
      green: Math.round((counts.green / total) * 100),
      yellow: Math.round((counts.yellow / total) * 100),
      red: Math.round((counts.red / total) * 100)
    };
  }

  return NextResponse.json({
    windowDays,
    since,
    metrics: {
      goals_completed: goalsCompleted,
      tasks_completed: duoTasksDone,
      hours_saved: Math.round((minutesSavedSum / 60) * 10) / 10,
      connections_made: cqFriendshipsAccepted,
      media_generated: mediaArtifacts,
      appointments_booked: appointmentTasks,
      emails_sent: emailTasks
    },
    rgy_this_window: rgyRatio(signalsThisWindow),
    rgy_prev_window: rgyRatio(signalsPrevWindow)
  });
}
