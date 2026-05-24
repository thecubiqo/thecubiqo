/**
 * Friend request resolution — accept / decline / block.
 *
 * PATCH /api/cq/friend-request/[id]  { status: 'accepted' | 'declined' | 'blocked' }
 *
 * On 'accepted': creates the canonical DM thread for the pair
 * (cq_threads + cq_thread_members rows) and stores thread_id on the
 * friendship row so the next thread list call picks it up.
 *
 * Only the addressee can accept/decline; either party can block.
 *
 * Source: CubiQo-Social-Layer.md §Friend Request Flow.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const ALLOWED = new Set(['accepted', 'declined', 'blocked']);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '').toLowerCase();
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: `status must be one of ${[...ALLOWED].join(', ')}` }, { status: 400 });
  }

  const { data: req, error: readErr } = await supabase
    .from('cq_friendships')
    .select('id, requester_id, addressee_id, status, thread_id')
    .eq('id', id)
    .maybeSingle();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!req) return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });

  // Permission check
  if (status === 'accepted' || status === 'declined') {
    if (req.addressee_id !== user.id) {
      return NextResponse.json({ error: 'Only the addressee can accept or decline' }, { status: 403 });
    }
  } else if (status === 'blocked') {
    if (req.addressee_id !== user.id && req.requester_id !== user.id) {
      return NextResponse.json({ error: 'Only friendship parties can block' }, { status: 403 });
    }
  }

  let threadId: string | null = req.thread_id || null;

  // On accept: lazily create the DM thread + members
  if (status === 'accepted' && !threadId) {
    const { data: thread, error: threadErr } = await supabase
      .from('cq_threads')
      .insert({})
      .select('id')
      .single();
    if (threadErr) return NextResponse.json({ error: threadErr.message }, { status: 500 });
    threadId = thread.id;

    const { error: memberErr } = await supabase
      .from('cq_thread_members')
      .insert([
        { thread_id: threadId, user_id: req.requester_id },
        { thread_id: threadId, user_id: req.addressee_id }
      ]);
    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('cq_friendships')
    .update({
      status,
      thread_id: threadId,
      responded_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, requester_id, addressee_id, status, thread_id, responded_at')
    .single();

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  return NextResponse.json({ request: updated, thread_id: threadId });
}
