import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const bodySchema = z.object({
  targetUserId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'targetUserId required', issues: parsed.error.flatten() }, { status: 400 });
  const { targetUserId } = parsed.data;
  if (targetUserId === auth.user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  const { data: existing } = await auth.supabase
    .from('social_connections')
    .select('status')
    .eq('follower_id', auth.user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existing?.status === 'blocked') return NextResponse.json({ error: 'Connection blocked' }, { status: 403 });

  const { error } = await auth.supabase
    .from('social_connections')
    .upsert({
      follower_id: auth.user.id,
      following_id: targetUserId,
      status: 'active',
      updated_at: new Date().toISOString()
    }, { onConflict: 'follower_id,following_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supabase.from('social_activity_feed').insert({
    user_id: targetUserId,
    actor_id: auth.user.id,
    event_type: 'followed_you',
    entity_id: null,
    entity_type: null,
    metadata: {}
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'targetUserId required', issues: parsed.error.flatten() }, { status: 400 });

  const { error } = await auth.supabase
    .from('social_connections')
    .delete()
    .eq('follower_id', auth.user.id)
    .eq('following_id', parsed.data.targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
