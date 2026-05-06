import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

const readId = async (context: { params: Promise<{ id: string }> | { id: string } }) => {
  const params = await context.params;
  return params.id;
};

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const id = await readId(context);
  const body = await request.json().catch(() => ({}));
  const update = {
    intent: body.intent ? String(body.intent).trim().slice(0, 120) : null,
    source: body.source ? String(body.source).trim().slice(0, 40) : 'manual'
  };

  const { data, error } = await auth.supabase
    .from('user_keywords')
    .update(update)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('id,keyword,color_zone,intent,source,metadata,created_at')
    .single();

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      error: 'user_keywords is not available in Supabase yet'
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keyword: data, migrationPending: false });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const id = await readId(context);
  const { error } = await auth.supabase
    .from('user_keywords')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      error: 'user_keywords is not available in Supabase yet'
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, migrationPending: false });
}
