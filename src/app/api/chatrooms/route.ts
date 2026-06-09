/**
 * Public RGY chatrooms list — used by RightPanel + /chatrooms directory page.
 *
 * Canonical schema: cq_chatrooms with rgy_color + intent + seed of 9 rooms
 * (migration 20260516004000_social_layer.sql §4).
 *
 * Red-tier rooms are filtered out unless profiles.red_tier_age_confirmed.
 *
 * Source: CubiQo-PhaseA.md §5.3 RGY Chatrooms + UI Architecture §Right Drawer.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { data: profile } = await supabase
    .from('profiles')
    .select('red_tier_age_confirmed')
    .eq('id', user.id)
    .maybeSingle();

  const includeRed = Boolean(profile?.red_tier_age_confirmed);

  let query = supabase
    .from('cq_chatrooms')
    .select('id, name, slug, rgy_color, intent, topic_tag, description, member_count, created_at')
    .order('rgy_color', { ascending: true })
    .order('intent', { ascending: true });

  if (!includeRed) {
    query = query.neq('rgy_color', 'red');
  }

  const { data: rooms, error } = await query;

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ rooms: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const roomIds = (rooms || []).map((r: any) => r.id);

  // Load this user's read pointers + recent chatroom activity for unread counts
  const unreadCounts: Record<string, number> = {};
  const lastActivity: Record<string, string | null> = {};

  if (roomIds.length > 0) {
    // Get user's last_read_at per room (may be null if never read)
    const { data: memberships } = await supabase
      .from('cq_chatroom_members')
      .select('chatroom_id, last_read_at')
      .eq('user_id', user.id)
      .in('chatroom_id', roomIds);

    const lastReadMap: Record<string, string | null> = {};
    for (const m of memberships || []) {
      lastReadMap[m.chatroom_id] = m.last_read_at ?? null;
    }

    // Get recent messages per room to count unread + last activity
    const { data: recentMsgs } = await supabase
      .from('cq_chatroom_messages')
      .select('chatroom_id, sender_id, created_at')
      .in('chatroom_id', roomIds)
      .order('created_at', { ascending: false });

    for (const m of recentMsgs || []) {
      // Track last activity
      if (!lastActivity[m.chatroom_id]) {
        lastActivity[m.chatroom_id] = m.created_at;
      }
      // Count unread: messages not sent by us, after our last_read_at
      if (m.sender_id !== user.id) {
        const lastRead = lastReadMap[m.chatroom_id];
        const isUnread = !lastRead || new Date(m.created_at) > new Date(lastRead);
        if (isUnread) {
          unreadCounts[m.chatroom_id] = (unreadCounts[m.chatroom_id] ?? 0) + 1;
        }
      }
    }
  }

  // Map canonical column names to the shape the UI expects (color + tier + last_message_preview)
  const mapped = (rooms || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    color: r.rgy_color,
    tier: r.rgy_color,
    intent: r.intent,
    topic_tag: r.topic_tag,
    description: r.description,
    member_count: r.member_count ?? 0,
    unread_count: unreadCounts[r.id] ?? 0,
    last_activity_at: lastActivity[r.id] ?? null,
    created_at: r.created_at
  }));

  return NextResponse.json({ rooms: mapped });
}
