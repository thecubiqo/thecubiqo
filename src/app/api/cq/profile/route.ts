/**
 * Returns the signed-in user's CQ profile — at minimum their CQ Number.
 *
 * Source: CubiQo-PhaseA.md §5.2 Social Layer / Two-Layer Identity Model.
 * The CQ Number is a permanent, short alphanumeric (e.g. CQ-4X9K-2JM7)
 * generated on first request if missing.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

function makeCqNumber(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous I,O,0,1
  const pick = (n: number) =>
    Array.from({ length: n }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
  return `CQ-${pick(4)}-${pick(4)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  // Try to read existing
  const { data: existing, error: readErr } = await supabase
    .from('cq_profiles')
    .select('cq_number, username, display_name, friends_count, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (readErr && safeTableMissing(readErr)) {
    return NextResponse.json({
      cq_number: null,
      migrationPending: true,
      message: 'cq_profiles table not yet migrated.'
    });
  }
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  if (existing?.cq_number) {
    return NextResponse.json(existing);
  }

  // First-time: generate + insert. Retry on collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = makeCqNumber();
    const { data: inserted, error: insertErr } = await supabase
      .from('cq_profiles')
      .insert({ user_id: user.id, cq_number: candidate })
      .select('cq_number, username, display_name, friends_count, created_at')
      .single();
    if (!insertErr && inserted) return NextResponse.json(inserted);
    if (insertErr && safeTableMissing(insertErr)) {
      return NextResponse.json({ cq_number: null, migrationPending: true });
    }
    // 23505 = unique violation — try again with a new candidate
    if (insertErr?.code !== '23505') {
      return NextResponse.json({ error: insertErr?.message || 'Could not assign CQ Number' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Could not allocate unique CQ Number, please retry' }, { status: 503 });
}
