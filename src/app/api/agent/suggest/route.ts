import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, cleanEnv } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 15;

const FALLBACKS: Record<string, string[]> = {
  career:   ['Show me jobs matching my profile', 'Review my resume for ATS gaps', 'Prep me for a BA interview', 'What salary should I ask for?'],
  builder:  ['Break this into sprint tasks', "What's the biggest blocker?", 'Draft a technical spec', 'Estimate time to ship'],
  social:   ['Draft a LinkedIn post for this', 'Plan my content for this week', 'What hashtags should I use?', 'Write a hook for this topic'],
  wellness: ['Help me reflect on today', 'Build a habit around this', 'Write a journal prompt for me', "What's one small step I can take?"],
  trade:    ['Analyse pricing for this product', 'Who is my target customer?', 'Identify market gaps here', "What's my next growth lever?"],
  general:  ['Tell me more about this', 'What should I do first?', "Summarise what we've covered", 'What am I missing?'],
};

export async function POST(request: NextRequest) {
  const authResult = await requireApiUser(request);
  if (authResult instanceof NextResponse) return authResult;

  let body: {
    capsule: { color?: string; keyword?: string; confirmed_intents?: string[]; suggested_intents?: string[] };
    lastMessage?: string;
    persona?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { capsule, lastMessage = '', persona = 'general' } = body;
  const { color = '', keyword = '', confirmed_intents = [], suggested_intents = [] } = capsule || {};
  const intents = [...confirmed_intents, ...suggested_intents].join(', ');

  const openaiKey = cleanEnv(process.env.OPENAI_API_KEY);

  if (openaiKey) {
    try {
      const prompt = `You are a session navigator for a ${persona} context. The user's active capsule is: keyword='${keyword}', color='${color}', intents=[${intents}]. Their last message or current focus: '${lastMessage}'. Generate exactly 4 short, specific, actionable suggestions the user might want to ask or do next. Each suggestion should be a complete short sentence (max 9 words). Return ONLY a JSON array of strings: ["suggestion1","suggestion2","suggestion3","suggestion4"]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({ suggestions: parsed.slice(0, 5) });
          }
        }
      }
    } catch {
      // fall through to local fallback
    }
  }

  const fallback = FALLBACKS[persona] || FALLBACKS.general;
  return NextResponse.json({ suggestions: fallback });
}
