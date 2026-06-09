/**
 * Friend requests — list + create.
 *
 * GET   /api/cq/friend-request                  → pending requests for me
 * POST  /api/cq/friend-request { addressee_cq } → send request by CQ Number
 *
 * Resolves CQ Number → user via profiles.cq_number (unique). Enforces:
 *   - Cannot friend yourself
 *   - Cannot duplicate-request (UNIQUE constraint)
 *   - Existing accepted friendship → returns it
 *
 * Source: CubiQo-Social-Layer.md §Friend Request Flow.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';

  const { data, error } = await supabase
    .from('cq_friendships')
    .select('id, requester_id, addressee_id, status, thread_id, created_at, responded_at')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error && safeTableMissing(error)) {
    return NextResponse.json({ requests: [], migrationPending: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Hydrate peer profiles
  const ids = [
    ...new Set(
      (data || [])
        .flatMap((r: any) => [r.requester_id, r.addressee_id])
        .filter((id: any) => id && id !== user.id)
    )
  ] as string[];
  let profileMap: Record<string, any> = {};
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, cq_number, username, display_name')
      .in('id', ids);
    profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
  }

  return NextResponse.json({
    requests: (data || []).map((r: any) => {
      const peerId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
      const incoming = r.addressee_id === user.id;
      return {
        ...r,
        incoming,
        peer: profileMap[peerId] || null
      };
    })
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json().catch(() => ({}));
  const addresseeCq = String(body.addressee_cq || body.cq_number || '').trim().toUpperCase();
  if (!addresseeCq) {
    return NextResponse.json({ error: 'addressee_cq required' }, { status: 400 });
  }

  // Resolve CQ Number → user id
  const { data: addresseeProfile, error: lookupErr } = await supabase
    .from('profiles')
    .select('id, cq_number, username, display_name')
    .eq('cq_number', addresseeCq)
    .maybeSingle();

  if (lookupErr) return NextResponse.json({ error: lookupErr.message }, { status: 500 });
  if (!addresseeProfile) {
    return NextResponse.json({ error: 'No user found with that CQ Number' }, { status: 404 });
  }
  if (addresseeProfile.id === user.id) {
    return NextResponse.json({ error: "You can't send a friend request to yourself" }, { status: 400 });
  }

  // Check existing relationship (either direction)
  const { data: existing } = await supabase
    .from('cq_friendships')
    .select('id, status, requester_id, addressee_id, thread_id')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeProfile.id}),and(requester_id.eq.${addresseeProfile.id},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ existing, peer: addresseeProfile });
  }

  const { data: inserted, error } = await supabase
    .from('cq_friendships')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeProfile.id,
      status: 'pending'
    })
    .select('id, requester_id, addressee_id, status, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: inserted, peer: addresseeProfile }, { status: 201 });
}
