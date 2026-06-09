/**
 * CQ DM thread messages — list + send.
 *
 * GET   /api/cq/threads/[id]/messages  → ordered list of messages in the thread
 * POST  /api/cq/threads/[id]/messages  → send a new message
 *
 * Auth + RLS:
 *   The caller must be a member of the thread (enforced via cq_thread_members).
 *   cq_messages RLS already gates SELECT/INSERT to thread members, but we
 *   also check membership here to return clean 403s with a useful message.
 *
 * Source: CubiQo-Social-Layer.md §3 Direct Messages.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const MAX_MESSAGE_LENGTH = 4000;
const ALLOWED_TYPES = new Set(['text', 'file', 'audio', 'video']);

async function assertMember(supabase: any, threadId: string, userId: string) {
  const { data } = await supabase
    .from('cq_thread_members')
    .select('user_id')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { id: threadId } = await params;
  if (!threadId) return NextResponse.json({ error: 'thread id required' }, { status: 400 });

  if (!(await assertMember(supabase, threadId, user.id))) {
    return NextResponse.json({ error: 'Not a thread member' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('cq_messages')
    .select('id, thread_id, sender_id, message_type, content, storage_path, reply_to_id, read_at, delivered_at, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ messages: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { id: threadId } = await params;
  if (!threadId) return NextResponse.json({ error: 'thread id required' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const messageType = (body.message_type || body.type || 'text').toString().toLowerCase();
  if (!ALLOWED_TYPES.has(messageType)) {
    return NextResponse.json({ error: `message_type must be one of ${[...ALLOWED_TYPES].join(', ')}` }, { status: 400 });
  }
  const content = String(body.content || '').slice(0, MAX_MESSAGE_LENGTH).trim();
  const storagePath = body.storage_path ? String(body.storage_path).slice(0, 500) : null;
  const replyToId = body.reply_to_id ? String(body.reply_to_id) : null;

  if (messageType === 'text' && !content) {
    return NextResponse.json({ error: 'content required for text messages' }, { status: 400 });
  }
  if (messageType !== 'text' && !storagePath) {
    return NextResponse.json({ error: 'storage_path required for non-text messages' }, { status: 400 });
  }

  if (!(await assertMember(supabase, threadId, user.id))) {
    return NextResponse.json({ error: 'Not a thread member' }, { status: 403 });
  }

  const { data: inserted, error } = await supabase
    .from('cq_messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      message_type: messageType,
      content: content || null,
      storage_path: storagePath,
      reply_to_id: replyToId
    })
    .select('id, thread_id, sender_id, message_type, content, storage_path, reply_to_id, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bump the thread's updated_at so the threads list re-orders correctly
  await supabase.from('cq_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

  return NextResponse.json({ message: inserted }, { status: 201 });
}
