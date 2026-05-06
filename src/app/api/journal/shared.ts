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

export const journalSelect = 'id,title,content,responses,rgy_color,mood,tags,word_count,source,metadata,created_at,updated_at';

export const parseJournalPayload = (body: Record<string, unknown>) => {
  const content = String(body.content || '').trim();
  const title = String(body.title || '').trim().slice(0, 120) || 'Daily Journal';
  const responses = Array.isArray(body.responses) ? body.responses : [];
  const tags = Array.isArray(body.tags)
    ? body.tags
        .map(tag => String(tag).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const rgyColor = ['green', 'yellow', 'red'].includes(String(body.rgyColor))
    ? String(body.rgyColor)
    : detectJournalTone(content);
  const wordCount = Number.isFinite(Number(body.wordCount))
    ? Math.max(0, Math.round(Number(body.wordCount)))
    : content.split(/\s+/).filter(Boolean).length;

  return {
    content,
    title,
    responses,
    tags,
    rgyColor,
    mood: body.mood ? String(body.mood).trim().slice(0, 80) : null,
    wordCount
  };
};

export async function requireJournalUser(request: NextRequest) {
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
