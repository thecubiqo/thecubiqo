import { NextRequest, NextResponse } from 'next/server';
import { getBearerToken, getSupabaseAdmin, safeTableMissing } from '../../_lib/supabase-admin';
import { getModel } from '@/next/lib/config/llm';

export const runtime = 'nodejs';
export const maxDuration = 30;

const FALLBACK_GREETING = "What's on your mind?";

function dayPart(date: Date, timeZone = 'UTC') {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    hour12: false,
    timeZone
  }).format(date));

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function daysAway(lastSeen?: string | null) {
  if (!lastSeen) return null;
  const parsed = new Date(lastSeen).getTime();
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, (Date.now() - parsed) / 86_400_000);
}

function toneForDays(value: number | null) {
  if (value === null) return 'new signed-in user';
  if (value < 0.02) return 'continuing, no memory opener';
  if (value < 1) return 'same day return';
  if (value < 7) return 'few days away';
  return 'been a while';
}

function compact(value: unknown, max = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function generateGreeting(context: string) {
  const key = (process.env.OPENAI_API_KEY || '').trim();
  if (!key) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: getModel('utility'),
        temperature: 0.7,
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content:
              "You are CubiQo. Generate ONE greeting sentence. Be specific, end in an implied question, use no 'Hey!' opener, max 20 words. If briefing ready, lead with that."
          },
          { role: 'user', content: context }
        ]
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return compact(data.choices?.[0]?.message?.content, 180) || null;
  } catch {
    return null;
  }
}

function deterministicGreeting(input: {
  profile: any;
  memories: any[];
  signals: any[];
  briefing: any;
  daypart: string;
  daysAway: number | null;
}) {
  if (input.briefing?.headline) {
    return `${compact(input.briefing.headline, 90)} — want to pick it up?`;
  }

  const recentSignal = input.signals?.[0]?.keyword;
  if (recentSignal && input.daysAway !== null && input.daysAway >= 1) {
    const count = Math.max(1, Math.floor(input.daysAway));
    return `${count} day${count === 1 ? '' : 's'} since ${recentSignal}. What moved?`;
  }

  const memory = input.memories?.[0]?.summary;
  if (memory && input.daysAway !== null && input.daysAway >= 0.02) {
    return `${compact(memory, 92)} — still on your mind?`;
  }

  if (input.profile?.primary_goal) {
    return `${compact(input.profile.primary_goal, 80)} — where should we start this ${input.daypart}?`;
  }

  return FALLBACK_GREETING;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Greeting failed', fallback: FALLBACK_GREETING }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [profileResult, memoryResult, signalResult, briefingResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,display_name,last_seen_at,timezone,city,country,primary_goal,voice_preference,daily_context,visit_count,language_preference')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('memory_events')
        .select('id,event_type,summary,keywords,weight,created_at')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('weight', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('signals')
        .select('id,keyword,color,created_at')
        .eq('user_id', user.id)
        .eq('color', 'green')
        .neq('display_state', 'deleted')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('capsule_briefings')
        .select('id,signal_id,domain,status,headline,created_at')
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const profile = profileResult.data || {};
    const memories = safeTableMissing(memoryResult.error) ? [] : memoryResult.data || [];
    const signals = safeTableMissing(signalResult.error) ? [] : signalResult.data || [];
    const briefing = safeTableMissing(briefingResult.error) ? null : briefingResult.data || null;
    const zone = profile.timezone || 'UTC';
    const away = daysAway(profile.last_seen_at);
    const part = dayPart(new Date(), zone);

    const context = [
      `User: ${compact(profile.display_name || user.email || 'signed-in user', 80)}`,
      `Local daypart: ${part}`,
      `Return tone: ${toneForDays(away)}`,
      `Primary goal: ${compact(profile.primary_goal, 140) || 'unknown'}`,
      `Daily context: ${compact(profile.daily_context, 220) || 'none'}`,
      `Recent memory: ${memories.map((m: any) => compact(m.summary, 100)).join(' | ') || 'none'}`,
      `Recent green signals: ${signals.map((s: any) => compact(s.keyword, 60)).join(', ') || 'none'}`,
      `Briefing ready: ${briefing?.headline ? compact(briefing.headline, 140) : 'none'}`
    ].join('\n');

    const generated = await generateGreeting(context);
    const text = generated || deterministicGreeting({ profile, memories, signals, briefing, daypart: part, daysAway: away });

    supabase
      .from('profiles')
      .update({
        last_seen_at: new Date().toISOString(),
        visit_count: Number(profile.visit_count || 0) + 1
      })
      .eq('id', user.id)
      .then(({ error }: { error: any }) => {
        if (error) console.warn('[agent/greet] profile touch failed:', error.message);
      });

    return NextResponse.json({
      text,
      audioUrl: null,
      briefingReady: Boolean(briefing),
      domain: briefing?.domain || null,
      voiceReady: false,
      voiceReason: 'text_first_audio_requires_user_interaction'
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Greeting failed',
        fallback: FALLBACK_GREETING,
        detail: error instanceof Error ? error.message : 'unknown'
      },
      { status: 500 }
    );
  }
}
