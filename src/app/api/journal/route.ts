import { NextRequest, NextResponse } from 'next/server';
import { safeTableMissing } from '../_lib/supabase-admin';
import { journalSelect, parseJournalPayload, requireJournalUser } from './shared';

export async function GET(request: NextRequest) {
  const auth = await requireJournalUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50);
  const { data, error, count } = await auth.supabase
    .from('journal_entries')
    .select(journalSelect, { count: 'exact' })
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (safeTableMissing(error)) {
      return NextResponse.json({
        entries: [],
        total: 0,
        latest: null,
        migrationPending: true,
        error: 'journal_entries is not available in Supabase yet'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    total: count || 0,
    latest: data?.[0] || null
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireJournalUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const { content, title, responses, tags, rgyColor, mood, wordCount } = parseJournalPayload(body);
  if (!content) {
    return NextResponse.json({ error: 'Journal content is required' }, { status: 400 });
  }

  const { data: entry, error } = await auth.supabase
    .from('journal_entries')
    .insert({
      user_id: auth.user.id,
      title,
      content,
      responses,
      rgy_color: rgyColor,
      mood,
      tags,
      word_count: wordCount,
      metadata: {
        source: 'daily_journal',
        prompt_count: responses.length
      }
    })
    .select(journalSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) {
      return NextResponse.json({
        migrationPending: true,
        error: 'journal_entries is not available in Supabase yet'
      });
    }
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
