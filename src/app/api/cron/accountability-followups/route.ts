/**
 * Accountability Follow-ups Cron — Phase F4
 * Runs every hour. Sends follow-up push notifications for overdue briefing actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cleanEnv } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

function adminClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

const ESCALATION_THRESHOLD = 2; // push escalation after 2 follow-ups with no response

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = adminClient();
  const now = new Date().toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (!baseUrl) return NextResponse.json({ sent: 0, message: 'BASE_URL not configured' });

  // Find due accountability tasks
  const { data: dueTasks } = await supabase
    .from('scheduled_tasks')
    .select('id, user_id, payload')
    .eq('task_type', 'accountability_followup')
    .lt('run_at', now)
    .is('completed_at', null)
    .limit(20);

  if (!dueTasks?.length) {
    return NextResponse.json({ sent: 0, message: 'No due follow-ups' });
  }

  let sent = 0;

  for (const task of dueTasks) {
    const { briefing_id, action_step, action_effort, reminder_count = 0 } = task.payload || {};

    // Check if action was completed since task was scheduled
    const { data: completion } = await supabase
      .from('briefing_action_completions')
      .select('id')
      .eq('briefing_id', briefing_id)
      .maybeSingle();

    if (completion) {
      // Action done — mark task complete, no push needed
      await supabase
        .from('scheduled_tasks')
        .update({ completed_at: now })
        .eq('id', task.id);
      continue;
    }

    // Determine message based on reminder count
    let title: string;
    let message: string;

    if (reminder_count >= ESCALATION_THRESHOLD) {
      title = 'You seem stuck — open Duo Mode';
      message = `Your action "${String(action_step || '').slice(0, 80)}" has been waiting. Let's figure out what's blocking you.`;
    } else {
      const effortLabel: Record<string, string> = {
        '10min': 'a 10-minute',
        '1hr': 'a 1-hour',
        '1day': 'a day\'s',
        '1week': 'a week\'s'
      };
      title = `Quick check-in on your goal`;
      message = `You had ${effortLabel[action_effort] || 'an'} action: "${String(action_step || '').slice(0, 80)}". Did you do it?`;
    }

    try {
      await fetch(`${baseUrl}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cubiqo-internal': process.env.CRON_SECRET || '',
          'x-user-id': task.user_id
        },
        body: JSON.stringify({
          userId: task.user_id,
          title,
          message,
          url: `/?briefing=${briefing_id}&duo=1`
        })
      });
      sent++;

      // Schedule next follow-up if under escalation threshold
      const nextReminderCount = reminder_count + 1;
      const nextDelayMs = nextReminderCount >= ESCALATION_THRESHOLD
        ? 48 * 60 * 60 * 1000  // 48h for escalation
        : 24 * 60 * 60 * 1000; // 24h for regular

      await supabase.from('scheduled_tasks').update({
        completed_at: now,
        payload: { ...task.payload, reminder_count: nextReminderCount }
      }).eq('id', task.id);

      // Schedule next follow-up (unless escalated twice already)
      if (nextReminderCount <= ESCALATION_THRESHOLD + 1) {
        await supabase.from('scheduled_tasks').insert({
          user_id: task.user_id,
          task_type: 'accountability_followup',
          run_at: new Date(Date.now() + nextDelayMs).toISOString(),
          payload: { ...task.payload, reminder_count: nextReminderCount }
        });
      }
    } catch (err) {
      console.error('[accountability-followups] push error for task', task.id, err);
    }
  }

  return NextResponse.json({ sent, total_due: dueTasks.length });
}
