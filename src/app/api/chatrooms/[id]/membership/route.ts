/**
 * Chatroom membership — join + leave.
 *
 * POST   /api/chatrooms/[id]/membership   → join the room
 * DELETE /api/chatrooms/[id]/membership   → leave the room
 *
 * Red-tier rooms are age-gated on join. Idempotent — joining an already-joined
 * room returns the existing membership row.
 *
 * Source: CubiQo-RGY-Chatrooms-FuncReq.md §Identity in Chatrooms +
 *         CubiQo-Social-Layer.md §RGY Chatrooms.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

async function checkRoom(supabase: any, roomId: string, userId: string) {
  const { data: room } = await supabase
    .from('cq_chatrooms')
    .select('id, rgy_color, name')
    .eq('id', roomId)
    .maybeSingle();
  if (!room) return { error: 'Room not found', status: 404 };
  if (room.rgy_color === 'red') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('red_tier_age_confirmed')
      .eq('id', userId)
      .maybeSingle();
    if (!profile?.red_tier_age_confirmed) {
      return { error: 'Red-tier room requires age confirmation', status: 403 };
    }
  }
  return { room };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: roomId } = await params;

  const access = await checkRoom(supabase, roomId, user.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data: inserted, error } = await supabase
    .from('cq_chatroom_members')
    .upsert(
      { chatroom_id: roomId, user_id: user.id },
      { onConflict: 'chatroom_id,user_id' }
    )
    .select('chatroom_id, user_id, joined_at')
    .single();

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ joined: false, migrationPending: true });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bump denormalised member_count (best-effort, non-blocking)
  supabase.rpc('increment_chatroom_member_count', { room_id: roomId }).catch(() => {});

  return NextResponse.json({ joined: true, membership: inserted });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: roomId } = await params;

  const { error } = await supabase
    .from('cq_chatroom_members')
    .delete()
    .eq('chatroom_id', roomId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  supabase.rpc('decrement_chatroom_member_count', { room_id: roomId }).catch(() => {});

  return NextResponse.json({ left: true });
}
