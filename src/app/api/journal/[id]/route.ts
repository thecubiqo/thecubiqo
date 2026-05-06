import { NextRequest, NextResponse } from 'next/server';
import { safeTableMissing } from '../../_lib/supabase-admin';
import { journalSelect, parseJournalPayload, requireJournalUser } from '../shared';

type Params = {
  params: Promise<unknown>;
};

const readJournalId = async (context: Params) => {
  const params = await context.params;
  return typeof params === 'object' && params && 'id' in params ? String(params.id) : '';
};

export async function PUT(request: NextRequest, context: Params) {
  const auth = await requireJournalUser(request);
  if (auth.error) return auth.error;

  const id = await readJournalId(context);
  if (!id) {
    return NextResponse.json({ error: 'Journal entry id is required' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { content, title, responses, tags, rgyColor, mood, wordCount } = parseJournalPayload(body);
  if (!content) {
    return NextResponse.json({ error: 'Journal content is required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('journal_entries')
    .update({
      title,
      content,
      responses,
      rgy_color: rgyColor,
      mood,
      tags,
      word_count: wordCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', auth.user.id)
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

  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest, context: Params) {
  const auth = await requireJournalUser(request);
  if (auth.error) return auth.error;

  const id = await readJournalId(context);
  if (!id) {
    return NextResponse.json({ error: 'Journal entry id is required' }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    if (safeTableMissing(error)) {
      return NextResponse.json({
        migrationPending: true,
        error: 'journal_entries is not available in Supabase yet'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
