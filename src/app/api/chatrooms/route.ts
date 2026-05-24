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
    unread_count: 0, // TODO: derive from cq_chatroom_membership read pointers
    last_activity_at: null,
    created_at: r.created_at
  }));

  return NextResponse.json({ rooms: mapped });
}
