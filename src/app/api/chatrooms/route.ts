/**
 * Chatrooms list endpoint — used by RightPanel + /chatrooms directory page.
 *
 * Returns the RGY chatrooms the user can see (public rooms, tier-filtered
 * by age-gate for red), with last-message preview + unread count. If the
 * `chatrooms` table is not yet migrated, returns an empty list with a
 * `migrationPending` flag so the UI can render the canonical empty state
 * instead of breaking.
 *
 * Source: CubiQo-UI-Architecture.md APP SHELL §Right Drawer + SCREEN 11
 *         CubiQo-PhaseA.md §5.3 RGY Chatrooms
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  // Filter REDS unless red_tier_age_confirmed
  const { data: profile } = await supabase
    .from('profiles')
    .select('red_tier_age_confirmed')
    .eq('id', user.id)
    .maybeSingle();

  const includeRed = Boolean(profile?.red_tier_age_confirmed);

  let query = supabase
    .from('chatrooms')
    .select('id, name, color, tier, description, member_count, last_message_preview, last_activity_at')
    .order('last_activity_at', { ascending: false })
    .limit(50);

  if (!includeRed) {
    query = query.neq('color', 'red');
  }

  const { data: rooms, error } = await query;

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ rooms: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort unread counts (don't fail the list if the join table is missing)
  let unreadMap: Record<string, number> = {};
  try {
    const { data: unread } = await supabase
      .from('chatroom_membership')
      .select('chatroom_id, unread_count')
      .eq('user_id', user.id);
    if (Array.isArray(unread)) {
      unreadMap = Object.fromEntries(unread.map((r: any) => [r.chatroom_id, r.unread_count ?? 0]));
    }
  } catch {
    /* membership table optional */
  }

  return NextResponse.json({
    rooms: (rooms || []).map((r: any) => ({
      ...r,
      unread_count: unreadMap[r.id] ?? 0
    }))
  });
}
