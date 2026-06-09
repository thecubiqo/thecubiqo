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

const countRows = async (
  supabase: NonNullable<ReturnType<typeof adminClient>>,
  table: string,
  userId: string
) => {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    return {
      count: null,
      error: error.message,
      missing: error.code === 'PGRST205' || /Could not find the table/i.test(error.message)
    };
  }

  return { count: count || 0, error: null, missing: false };
};

export async function GET(request: NextRequest) {
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const [conversations, keywords, signals, journals] = await Promise.all([
    countRows(supabase, 'conversation_events', data.user.id),
    countRows(supabase, 'user_activity_keywords', data.user.id),
    countRows(supabase, 'signals', data.user.id),
    countRows(supabase, 'journal_entries', data.user.id)
  ]);

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email || null
    },
    stats: {
      conversations: conversations.count || 0,
      keywords: keywords.count || 0,
      signals: signals.count || 0,
      journals: journals.count,
      journalMigrationPending: journals.missing,
      signalMigrationPending: signals.missing,
      warnings: [conversations, keywords, signals, journals]
        .filter(item => item.error)
        .map(item => item.error)
    },
    features: {
      auth: 'live',
      dailyJournal: journals.missing ? 'code_ready_db_pending' : 'live',
      dashboard: 'live',
      rgySignals: signals.missing ? 'code_ready_db_pending' : 'live',
      conversation: 'live'
    }
  });
}
