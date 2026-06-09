/**
 * RGY chatroom messages — list + send.
 *
 * GET   /api/chatrooms/[id]/messages   → recent messages (paginated)
 * POST  /api/chatrooms/[id]/messages   → send a new message
 *
 * Auth: any signed-in user can read public rooms; red-tier rooms gated by
 * profiles.red_tier_age_confirmed. Send writes are RLS-guarded to sender_id.
 * Username is snapshot at send time (chatroom_messages.username_at_send) so
 * history stays accurate if the user later renames.
 *
 * Source: CubiQo-Social-Layer.md §5 Chatroom Messages.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_MESSAGE_LENGTH = 2000;

async function assertReadable(supabase: any, roomId: string, userId: string) {
  const { data: room } = await supabase
    .from('cq_chatrooms')
    .select('id, rgy_color')
    .eq('id', roomId)
    .maybeSingle();
  if (!room) return { ok: false, status: 404, error: 'Room not found' };
  if (room.rgy_color === 'red') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('red_tier_age_confirmed')
      .eq('id', userId)
      .maybeSingle();
    if (!profile?.red_tier_age_confirmed) {
      return { ok: false, status: 403, error: 'Red-tier room requires age confirmation' };
    }
  }
  return { ok: true };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: roomId } = await params;

  const access = await assertReadable(supabase, roomId, user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  const before = url.searchParams.get('before');

  let q = supabase
    .from('cq_chatroom_messages')
    .select('id, chatroom_id, sender_id, username_at_send, content, reply_to_id, created_at')
    .eq('chatroom_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) q = q.lt('created_at', before);

  const { data, error } = await q;
  if (error && safeTableMissing(error)) {
    return NextResponse.json({ messages: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (data || []).reverse() });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;
  const { id: roomId } = await params;

  const access = await assertReadable(supabase, roomId, user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json().catch(() => ({}));
  const content = String(body.content || '').slice(0, MAX_MESSAGE_LENGTH).trim();
  const replyToId = body.reply_to_id ? String(body.reply_to_id) : null;
  if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', user.id)
    .maybeSingle();

  const usernameAtSend =
    profile?.username || profile?.display_name || `cubiqonaut-${user.id.slice(0, 6)}`;

  const { data: inserted, error } = await supabase
    .from('cq_chatroom_messages')
    .insert({
      chatroom_id: roomId,
      sender_id: user.id,
      username_at_send: usernameAtSend,
      content,
      reply_to_id: replyToId
    })
    .select('id, chatroom_id, sender_id, username_at_send, content, reply_to_id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: inserted }, { status: 201 });
}
