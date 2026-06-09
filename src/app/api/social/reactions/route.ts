import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const reactionSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.string().min(1).max(80),
  reaction: z.string().min(1).max(24)
});

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase server configuration is missing' }, { status: 500 });

  const entityId = request.nextUrl.searchParams.get('entityId');
  const entityType = request.nextUrl.searchParams.get('entityType');
  if (!entityId || !entityType) return NextResponse.json({ error: 'entityId and entityType required' }, { status: 400 });

  const { data, error } = await supabase
    .from('social_reactions')
    .select('reaction,user_id,created_at')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const counts: Record<string, number> = {};
  for (const reaction of data || []) counts[reaction.reaction] = (counts[reaction.reaction] || 0) + 1;
  return NextResponse.json({ counts, total: data?.length || 0 });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = reactionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid reaction payload', issues: parsed.error.flatten() }, { status: 400 });

  const { entityId, entityType, reaction } = parsed.data;
  const { data: existing } = await auth.supabase
    .from('social_reactions')
    .select('id')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .eq('user_id', auth.user.id)
    .eq('reaction', reaction)
    .maybeSingle();

  if (existing) {
    await auth.supabase.from('social_reactions').delete().eq('id', existing.id);
    return NextResponse.json({ ok: true, toggled: 'off' });
  }

  const { error } = await auth.supabase.from('social_reactions').insert({
    entity_id: entityId,
    entity_type: entityType,
    user_id: auth.user.id,
    reaction
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, toggled: 'on' });
}
