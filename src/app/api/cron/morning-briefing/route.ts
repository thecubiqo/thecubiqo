/**
 * GET /api/cron/morning-briefing
 *
 * Runs every hour. Finds all users whose wake_hour (in their local timezone)
 * matches the current hour, and haven't yet received today's briefing.
 * Generates a personalized morning briefing via Claude, then sends via their
 * preferred channel (SMS via Twilio, email via Resend, or both).
 *
 * Vercel cron schedule: "5 * * * *"  (5 mins past each hour, after run-schedules)
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { getModel } from '@/next/lib/config/llm';
import { sendEmail } from '@/next/lib/email/send';
import { sendSms } from '@/next/lib/comms/sms';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — may need to send many users

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the current hour (0-23) in the given IANA timezone */
function currentHourIn(tz: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const h = parts.find(p => p.type === 'hour');
    return h ? parseInt(h.value, 10) : -1;
  } catch {
    return -1; // unknown timezone — skip
  }
}

/** Returns current date string in the given timezone: YYYY-MM-DD */
function todayIn(tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Friendly hour like "7 AM" */
function friendlyHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

// ── Context fetcher ───────────────────────────────────────────────────────────

async function fetchUserContext(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  cfg: { tasks: boolean; goals: boolean; blockers: boolean; calendar: boolean; custom_note: string },
  today: string
): Promise<string> {
  if (!supabase) return '';
  const parts: string[] = [];

  // Tasks due today / overdue (`today` is the user's local date, not server UTC).
  if (cfg.tasks) {
    const { data: tasks } = await supabase
      .from('duo_tasks')
      .select('title, status, priority, due_date')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .or(`due_date.lte.${today},due_date.is.null`)
      .limit(10);
    if (tasks?.length) {
      parts.push('OPEN TASKS:\n' + tasks.map((t: any) =>
        `• [${t.priority ?? 'normal'}] ${t.title}${t.due_date ? ` (due ${t.due_date})` : ''}`
      ).join('\n'));
    }
  }

  // Goals / objectives
  if (cfg.goals) {
    const { data: memory } = await supabase
      .from('memory_events')
      .select('content')
      .eq('user_id', userId)
      .eq('event_type', 'goal')
      .eq('is_active', true)
      .order('weight', { ascending: false })
      .limit(5);
    if (memory?.length) {
      parts.push('ACTIVE GOALS:\n' + memory.map((m: any) => `• ${m.content}`).join('\n'));
    }
  }

  // Blockers / constraints from memory
  if (cfg.blockers) {
    const { data: blockers } = await supabase
      .from('memory_events')
      .select('content')
      .eq('user_id', userId)
      .in('event_type', ['blocker', 'constraint', 'commitment'])
      .eq('is_active', true)
      .order('weight', { ascending: false })
      .limit(4);
    if (blockers?.length) {
      parts.push('COMMITMENTS / BLOCKERS:\n' + blockers.map((b: any) => `• ${b.content}`).join('\n'));
    }
  }

  // Right-now context (highest weight session summaries)
  const { data: rightNow } = await supabase
    .from('memory_events')
    .select('content')
    .eq('user_id', userId)
    .eq('event_type', 'session_summary')
    .eq('is_active', true)
    .gte('weight', 3)
    .order('created_at', { ascending: false })
    .limit(2);
  if (rightNow?.length) {
    parts.push('CURRENT FOCUS:\n' + rightNow.map((r: any) => `• ${r.content}`).join('\n'));
  }

  // User profile snapshot
  const { data: profile } = await supabase
    .from('user_ai_profile')
    .select('occupation, communication_style, goal_domain, current_phase, what_blocks, open_loops')
    .eq('user_id', userId)
    .maybeSingle();
  if (profile) {
    const snap = [
      profile.occupation && `Role: ${profile.occupation}`,
      profile.goal_domain && `Goal area: ${profile.goal_domain}`,
      profile.current_phase && `Phase: ${profile.current_phase}`,
      profile.communication_style && `Style: ${profile.communication_style}`,
      profile.what_blocks && `Known blockers: ${profile.what_blocks}`,
      profile.open_loops && `Open loops: ${profile.open_loops}`,
    ].filter(Boolean).join('\n');
    if (snap) parts.push(`PROFILE:\n${snap}`);
  }

  if (cfg.custom_note) {
    parts.push(`OWNER NOTE: ${cfg.custom_note}`);
  }

  return parts.join('\n\n');
}

// ── Briefing generator ────────────────────────────────────────────────────────

async function generateBriefing(
  userName: string,
  wakeHour: number,
  context: string,
  channel: string
): Promise<{ short: string; long: string }> {
  const isShortChannel = channel === 'sms';
  const greeting = `Good ${wakeHour < 12 ? 'morning' : wakeHour < 17 ? 'afternoon' : 'evening'}, ${userName}!`;

  const prompt = `You are CubiQo, a proactive AI companion. Generate a personalized morning briefing.

CONTEXT ABOUT THIS PERSON:
${context || '(No stored context yet — keep it warm and open-ended.)'}

TASK:
1. SHORT (≤160 chars, for SMS): A crisp, warm, actionable line. Include the most important task or goal if present.
2. LONG (≤400 words, for email): Friendly structured briefing — greeting, today's focus, key tasks, encouragement. Markdown ok.

Start the SHORT version with: "${greeting} "
Start the LONG version with a # heading.

Reply in JSON: { "short": "...", "long": "..." }`;

  try {
    const msg = await anthropic.messages.create({
      model: getModel('claude_view'), // Haiku by default — daily briefings are high-volume, keep cheap
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { short: parsed.short ?? greeting, long: parsed.long ?? greeting };
    }
  } catch (e) {
    console.error('[morning-briefing] Claude error:', e);
  }

  // Fallback
  return {
    short: `${greeting} Ready for another productive day.`,
    long: `# ${greeting}\n\nCubiQo is here when you need me. Check your tasks and let's get going.`,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  // Load all active comms settings
  const { data: allSettings, error: settingsError } = await supabase
    .from('user_comms_settings')
    .select('user_id, wake_hour, timezone, channel, briefing_config, last_briefing_date')
    .eq('active', true);

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  if (!allSettings?.length) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'No active comms settings' });
  }

  const results: { userId: string; status: string; channel?: string; error?: string }[] = [];

  for (const settings of allSettings) {
    const localHour = currentHourIn(settings.timezone);
    const todayStr = todayIn(settings.timezone);

    // Already sent today?
    if (settings.last_briefing_date === todayStr) {
      results.push({ userId: settings.user_id, status: 'already_sent' });
      continue;
    }

    // Not their wake hour?
    if (localHour !== settings.wake_hour) {
      results.push({ userId: settings.user_id, status: 'not_wake_hour' });
      continue;
    }

    // Fetch user profile for name + phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, full_name, phone_number, phone_verified')
      .eq('id', settings.user_id)
      .maybeSingle();

    const { data: authData } = await supabase.auth.admin.getUserById(settings.user_id);
    const email = authData?.user?.email;
    const firstName = (profile?.display_name ?? profile?.full_name ?? 'there').split(' ')[0];

    // Fetch context
    const cfg = {
      tasks: settings.briefing_config?.tasks ?? true,
      goals: settings.briefing_config?.goals ?? true,
      blockers: settings.briefing_config?.blockers ?? true,
      calendar: settings.briefing_config?.calendar ?? true,
      custom_note: settings.briefing_config?.custom_note ?? '',
    };
    const context = await fetchUserContext(supabase, settings.user_id, cfg, todayStr);

    // Generate briefing
    const { short, long } = await generateBriefing(firstName, settings.wake_hour, context, settings.channel);

    let sent = false;
    const errors: string[] = [];

    // Send SMS
    if ((settings.channel === 'sms' || settings.channel === 'both') && profile?.phone_verified && profile?.phone_number) {
      const smsResult = await sendSms(profile.phone_number, short);
      if (smsResult.ok) {
        sent = true;
      } else {
        errors.push(`SMS: ${smsResult.error}`);
      }
    }

    // Send email
    if ((settings.channel === 'email' || settings.channel === 'both') && email) {
      const emailResult = await sendEmail({
        from: 'CubiQo <hi@cubiqo.ai>',
        to: email,
        subject: `☀️ Your ${friendlyHour(settings.wake_hour)} briefing from CubiQo`,
        html: long.replace(/\n/g, '<br>'),
        text: long,
      });
      if (emailResult.ok) {
        sent = true;
      } else {
        errors.push(`Email: ${(emailResult as { ok: false; error: string }).error}`);
      }
    }

    // Mark as sent
    if (sent) {
      await supabase
        .from('user_comms_settings')
        .update({ last_briefing_date: todayStr, updated_at: new Date().toISOString() })
        .eq('user_id', settings.user_id);
    }

    results.push({
      userId: settings.user_id,
      status: sent ? 'sent' : 'failed',
      channel: settings.channel,
      ...(errors.length && { error: errors.join('; ') }),
    });
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'already_sent' || r.status === 'not_wake_hour').length;

  return NextResponse.json({ sent, failed, skipped, total: allSettings.length, results });
}
