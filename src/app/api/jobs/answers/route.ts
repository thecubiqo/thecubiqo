import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('application_answers')
    .select('id,question,answer,platform_hint,display_order,updated_at')
    .eq('user_id', auth.user.id)
    .order('display_order', { ascending: true });

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('jobs', 'application_answers');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed defaults if empty
  if (!data?.length) {
    await auth.supabase.rpc('insert_default_application_answers', { p_user_id: auth.user.id }).catch(() => null);
    const { data: seeded } = await auth.supabase
      .from('application_answers')
      .select('id,question,answer,platform_hint,display_order,updated_at')
      .eq('user_id', auth.user.id)
      .order('display_order', { ascending: true });
    return NextResponse.json({ answers: seeded || [] });
  }

  return NextResponse.json({ answers: data });
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const answers: { id?: string; question: string; answer: string; platform_hint?: string; display_order?: number }[] =
    Array.isArray(body.answers) ? body.answers : [];

  if (!answers.length) return NextResponse.json({ error: 'answers array required' }, { status: 400 });

  const results = await Promise.all(
    answers.map(async (a, idx) => {
      const row = {
        user_id: auth.user.id,
        question: String(a.question || '').slice(0, 300),
        answer: String(a.answer || '').slice(0, 1000),
        platform_hint: a.platform_hint ? String(a.platform_hint).slice(0, 40) : 'all',
        display_order: a.display_order ?? idx,
        updated_at: new Date().toISOString()
      };

      if (a.id) {
        const { data, error } = await auth.supabase
          .from('application_answers')
          .update(row)
          .eq('id', a.id)
          .eq('user_id', auth.user.id)
          .select('id,question,answer,platform_hint,display_order')
          .single();
        return error ? null : data;
      } else {
        const { data, error } = await auth.supabase
          .from('application_answers')
          .insert(row)
          .select('id,question,answer,platform_hint,display_order')
          .single();
        return error ? null : data;
      }
    })
  );

  return NextResponse.json({ saved: results.filter(Boolean).length, answers: results.filter(Boolean) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await auth.supabase
    .from('application_answers')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true, id });
}
