/**
 * CQ-to-CQ message thread list — used by the /messenger page.
 *
 * Canonical schema: cq_threads + cq_thread_members + cq_messages
 * (migration 20260516004000_social_layer.sql §1–3).
 *
 * Returns each thread the signed-in user belongs to, with the peer's CQ
 * Number + username pulled from the cq_thread_members join + profiles,
 * plus the most recent message preview and unread count.
 *
 * Source: CubiQo-Social-Layer.md §CQ-to-CQ Messaging.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  // 1. Find all threads the user is a member of
  const { data: memberships, error: memErr } = await supabase
    .from('cq_thread_members')
    .select('thread_id, joined_at')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(100);

  if (memErr && safeTableMissing(memErr)) {
    return NextResponse.json({ threads: [], migrationPending: true });
  }
  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  const threadIds = (memberships || []).map((m: any) => m.thread_id).filter(Boolean);
  if (threadIds.length === 0) {
    return NextResponse.json({ threads: [] });
  }

  // 2. For each thread, find peer member (the one who isn't us)
  const { data: peers, error: peerErr } = await supabase
    .from('cq_thread_members')
    .select('thread_id, user_id')
    .in('thread_id', threadIds)
    .neq('user_id', user.id);

  if (peerErr) {
    return NextResponse.json({ error: peerErr.message }, { status: 500 });
  }

  const peerUserIds = [...new Set((peers || []).map((p: any) => p.user_id).filter(Boolean))];
  const threadToPeer = new Map<string, string>();
  for (const p of peers || []) {
    if (p.thread_id && p.user_id) threadToPeer.set(p.thread_id, p.user_id);
  }

  // 3. Profile lookup for peer CQ Number + username
  const peerProfiles: Record<string, { cq_number?: string; username?: string; display_name?: string }> = {};
  if (peerUserIds.length > 0) {
    const { data: profilesRows } = await supabase
      .from('profiles')
      .select('id, cq_number, username, display_name')
      .in('id', peerUserIds);
    for (const row of profilesRows || []) {
      peerProfiles[row.id] = {
        cq_number: row.cq_number,
        username: row.username,
        display_name: row.display_name
      };
    }
  }

  // 4. Latest message + unread count per thread
  const messagePreviews: Record<string, { preview: string; updated_at: string }> = {};
  const unreadCounts: Record<string, number> = {};
  try {
    const { data: msgs } = await supabase
      .from('cq_messages')
      .select('thread_id, content, created_at, sender_id, read_at')
      .in('thread_id', threadIds)
      .order('created_at', { ascending: false });
    for (const m of msgs || []) {
      if (m.thread_id && !messagePreviews[m.thread_id]) {
        messagePreviews[m.thread_id] = {
          preview: (m.content || '').slice(0, 120),
          updated_at: m.created_at
        };
      }
      // Count unread: messages not sent by us that haven't been read yet
      if (m.thread_id && m.sender_id !== user.id && !m.read_at) {
        unreadCounts[m.thread_id] = (unreadCounts[m.thread_id] ?? 0) + 1;
      }
    }
  } catch {
    /* message read optional */
  }

  // 5. Compose
  const threads = (threadIds as string[]).map((threadId: string) => {
    const peerId = threadToPeer.get(threadId);
    const peer = peerId ? peerProfiles[peerId] : undefined;
    const preview = messagePreviews[threadId];
    return {
      id: threadId,
      peer_user_id: peerId,
      cq_number: peer?.cq_number || null,
      display_name: peer?.display_name || peer?.username || null,
      username: peer?.username || null,
      last_message_preview: preview?.preview || null,
      updated_at: preview?.updated_at || null,
      unread_count: unreadCounts[threadId] ?? 0
    };
  }).sort((a, b) => {
    // Most recent activity first
    const at = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bt = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return bt - at;
  });

  return NextResponse.json({ threads });
}
