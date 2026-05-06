import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const COLOR_ZONES = new Set(['red', 'green', 'teal', 'blue', 'yellow']);

const normalizeColorZone = (value: unknown) => {
  const zone = String(value || 'yellow').toLowerCase();
  return COLOR_ZONES.has(zone) ? zone : 'yellow';
};

const normalizeKeyword = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 80);

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('user_keywords')
    .select('id,keyword,color_zone,intent,source,metadata,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (safeTableMissing(error)) {
    return NextResponse.json({
      keywords: [],
      migrationPending: true,
      error: 'user_keywords is not available in Supabase yet'
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    keywords: data || [],
    migrationPending: false
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const keyword = normalizeKeyword(body.keyword);
  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  const colorZone = normalizeColorZone(body.colorZone || body.color_zone);
  const payload = {
    user_id: auth.user.id,
    keyword,
    color_zone: colorZone,
    intent: body.intent ? String(body.intent).trim().slice(0, 120) : null,
    source: body.source ? String(body.source).trim().slice(0, 40) : 'manual',
    metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}
  };

  const { data, error } = await auth.supabase
    .from('user_keywords')
    .upsert(payload, { onConflict: 'user_id,keyword,color_zone' })
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

  return NextResponse.json({ keyword: data, migrationPending: false }, { status: 201 });
}
