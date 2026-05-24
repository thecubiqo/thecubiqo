/**
 * Returns the signed-in user's CQ identity — CQ Number + username.
 *
 * Canonical schema: profiles.cq_number, profiles.username, profiles.username_set
 * (migration 20260516001000_profile_extensions.sql §2).
 *
 * The CQ Number is short alphanumeric (e.g. CQ-4X9K-2JM7), lazily allocated
 * on first call if the column is null. Username defaults to a placeholder
 * the user can confirm/change.
 *
 * Source: CubiQo-Social-Layer.md §Two-Layer Identity Model + Phase A doc §5.2.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

function makeCqNumber(): string {
  // Omit ambiguous chars (I,O,0,1)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (n: number) =>
    Array.from({ length: n }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
  return `CQ-${pick(4)}-${pick(4)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  const { supabase, user } = auth;

  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('cq_number, username, username_set, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (readErr && safeTableMissing(readErr)) {
    return NextResponse.json({ cq_number: null, migrationPending: true });
  }
  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  if (existing?.cq_number) {
    return NextResponse.json({
      cq_number: existing.cq_number,
      username: existing.username,
      username_set: Boolean(existing.username_set),
      display_name: existing.display_name
    });
  }

  // Lazy-allocate CQ number on first call. Retry on collision (unique constraint).
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = makeCqNumber();
    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update({ cq_number: candidate })
      .eq('id', user.id)
      .is('cq_number', null)
      .select('cq_number, username, username_set, display_name')
      .maybeSingle();

    if (!updateErr && updated?.cq_number) {
      return NextResponse.json({
        cq_number: updated.cq_number,
        username: updated.username,
        username_set: Boolean(updated.username_set),
        display_name: updated.display_name
      });
    }
    // 23505 = unique violation — try a new candidate
    if (updateErr?.code !== '23505') {
      return NextResponse.json(
        { error: updateErr?.message || 'Could not allocate CQ Number' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: 'Could not allocate unique CQ Number — please retry' },
    { status: 503 }
  );
}
