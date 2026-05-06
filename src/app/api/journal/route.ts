import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const cleanEnv = (...values: Array<string | undefined>) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

const supabaseUrl = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_URL
);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

const adminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

const getBearerToken = (request: NextRequest) => {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const detectJournalTone = (text: string) => {
  const lower = text.toLowerCase();
  if (/(adult|explicit|grindr|tinder|hookup|nsfw|private dating)/.test(lower)) return 'red';
  if (/(career|build|ship|learn|health|focus|work|plan|train|wellness|grow|launch|study)/.test(lower)) return 'green';
  return 'yellow';
};

async function requireUser(request: NextRequest) {
  const supabase = adminClient();
  if (!supabase) {
    return {
      error: NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 })
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    };
  }

  return { supabase, user: data.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50);
  const { data, error, count } = await auth.supabase
    .from('journal_entries')
    .select('id,content,responses,rgy_color,mood,word_count,source,metadata,created_at,updated_at', { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    total: count || 0,
    latest: data?.[0] || null
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || '').trim();
  if (!content) {
    return NextResponse.json({ error: 'Journal content is required' }, { status: 400 });
  }

  const responses = Array.isArray(body.responses) ? body.responses : [];
  const rgyColor = ['green', 'yellow', 'red'].includes(body.rgyColor)
    ? body.rgyColor
    : detectJournalTone(content);
  const wordCount = Number.isFinite(Number(body.wordCount))
    ? Math.max(0, Math.round(Number(body.wordCount)))
    : content.split(/\s+/).filter(Boolean).length;

  const { data: entry, error } = await auth.supabase
    .from('journal_entries')
    .insert({
      user_id: auth.user.id,
      content,
      responses,
      rgy_color: rgyColor,
      mood: body.mood || null,
      word_count: wordCount,
      metadata: {
        source: 'daily_journal',
        prompt_count: responses.length
      }
    })
    .select('id,content,responses,rgy_color,mood,word_count,source,metadata,created_at,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auth.supabase.from('conversation_events').insert({
    user_id: auth.user.id,
    user_message: 'Daily Journal entry',
    assistant_response: content,
    rgy_color: rgyColor,
    rgy_intent: 'daily_journal',
    keywords: {
      green: rgyColor === 'green' ? ['journal', 'next move'] : [],
      yellow: rgyColor === 'yellow' ? ['journal', 'reflection'] : [],
      red: rgyColor === 'red' ? ['journal', 'age gated'] : []
    },
    model_used: 'journal-api',
    metadata: {
      source: 'daily_journal',
      journal_entry_id: entry.id,
      word_count: wordCount
    }
  });

  return NextResponse.json({ entry }, { status: 201 });
}
