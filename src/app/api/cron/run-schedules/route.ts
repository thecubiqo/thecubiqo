import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, cleanEnv } from '../../_lib/supabase-admin';
import { getModel, getTailoringParams } from '@/next/lib/config/llm';
import { isAuthorizedCron } from '../../_lib/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

function nextRunAt(cadence: string, timezone: string) {
  const now = new Date();
  if (cadence === 'weekly') {
    now.setDate(now.getDate() + 7);
  } else {
    now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}

async function gatherReportData(admin: any, userId: string, scope: string[]) {
  const sections: Record<string, any> = {};
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  if (scope.includes('journal')) {
    const { data } = await admin
      .from('journal_entries')
      .select('id,content,created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);
    sections.journal = data || [];
  }

  if (scope.includes('signals')) {
    const { data } = await admin
      .from('signals')
      .select('id,color,keyword,intent,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    sections.signals = data || [];
  }

  if (scope.includes('tasks')) {
    const { data } = await admin
      .from('user_tasks')
      .select('id,title,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    sections.tasks = data || [];
  }

  if (scope.includes('jobs')) {
    const { data } = await admin
      .from('job_applications')
      .select('id,company,role,status,applied_at')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false })
      .limit(10);
    sections.jobs = data || [];
  }

  return sections;
}

async function generateReportContent(data: Record<string, any>, cadence: string): Promise<string> {
  const openaiKey = cleanEnv(process.env.OPENAI_API_KEY);
  if (!openaiKey) {
    return buildLocalReport(data, cadence);
  }

  const prompt = `You are CubiQo, a personal AI assistant. Generate a concise ${cadence} report from the following data. Write in plain language, first person, under 300 words. Include what happened, key signals, open tasks, and one concrete recommendation.

Data:
${JSON.stringify(data, null, 2)}`;

  try {
    const params = getTailoringParams();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: getModel('tailoring'),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(params.maxTokens, 500),
        temperature: Math.max(params.temperature, 0.4)
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || buildLocalReport(data, cadence);
  } catch {
    return buildLocalReport(data, cadence);
  }
}

function buildLocalReport(data: Record<string, any>, cadence: string): string {
  const lines: string[] = [`CubiQo ${cadence} report — ${new Date().toDateString()}`];
  if (data.journal?.length) lines.push(`\nJournal: ${data.journal.length} entr${data.journal.length === 1 ? 'y' : 'ies'} logged.`);
  if (data.signals?.length) {
    const greens = data.signals.filter((s: any) => s.color === 'green').length;
    const yellows = data.signals.filter((s: any) => s.color === 'yellow').length;
    const reds = data.signals.filter((s: any) => s.color === 'red').length;
    lines.push(`\nSignals: ${greens} green, ${yellows} yellow, ${reds} red.`);
  }
  if (data.tasks?.length) {
    const open = data.tasks.filter((t: any) => t.status !== 'completed').length;
    lines.push(`\nTasks: ${open} open of ${data.tasks.length} total.`);
  }
  if (data.jobs?.length) {
    lines.push(`\nJob pipeline: ${data.jobs.length} application(s) tracked.`);
  }
  return lines.join('') || 'No activity recorded in this period.';
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data: schedules, error } = await admin
    .from('report_schedules')
    .select('id,user_id,name,cadence,timezone,next_run_at,summary_scope')
    .eq('status', 'active')
    .lte('next_run_at', now)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{ scheduleId: string; status: string; reportId?: string; error?: string }> = [];

  for (const schedule of schedules || []) {
    try {
      const scope = Array.isArray(schedule.summary_scope) ? schedule.summary_scope : ['journal', 'signals', 'tasks'];
      const data = await gatherReportData(admin, schedule.user_id, scope);
      const content = await generateReportContent(data, schedule.cadence);
      const title = `${schedule.name} — ${new Date().toDateString()}`;

      const periodStart = new Date(Date.now() - (schedule.cadence === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString();

      const { data: report, error: insertErr } = await admin
        .from('daily_reports')
        .insert({
          user_id: schedule.user_id,
          schedule_id: schedule.id,
          title,
          content,
          status: 'sent_in_app',
          period_start: periodStart,
          period_end: now,
          metadata: { cadence: schedule.cadence, scope, cron_triggered: true }
        })
        .select('id')
        .single();

      if (insertErr) throw new Error(insertErr.message);

      await admin
        .from('report_schedules')
        .update({ next_run_at: nextRunAt(schedule.cadence, schedule.timezone) })
        .eq('id', schedule.id);

      results.push({ scheduleId: schedule.id, status: 'completed', reportId: report.id });
    } catch (err: any) {
      results.push({ scheduleId: schedule.id, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
