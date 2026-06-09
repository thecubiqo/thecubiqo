/**
 * RGY red-tier age gate — HARD RULE.
 *
 * Red signals must NEVER be written unless the owning account is
 * authenticated AND the user has confirmed they are an adult
 * (profiles.red_tier_age_confirmed === true).
 *
 * This is the application-layer guard. A matching DB trigger
 * (enforce_red_signal_age_gate, migration 20260609000002) is the backstop
 * that rejects any red-signal write that slips past this check.
 *
 * Fails CLOSED: any lookup error or missing profile → red is NOT allowed.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

/** True only if the user has explicitly confirmed adult age. */
export async function isAdultConfirmed(supabase: SupabaseLike, userId: string | null | undefined): Promise<boolean> {
  if (!supabase || !userId) return false;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('red_tier_age_confirmed')
      .eq('id', userId)
      .maybeSingle();
    if (error) return false; // fail closed
    return data?.red_tier_age_confirmed === true;
  } catch {
    return false; // fail closed
  }
}

/**
 * Whether a signal of the given color may be persisted for this user.
 * Non-red colors are always allowed; red requires age confirmation.
 */
export async function canWriteSignalColor(
  supabase: SupabaseLike,
  userId: string | null | undefined,
  color: string
): Promise<boolean> {
  if (color !== 'red') return true;
  return isAdultConfirmed(supabase, userId);
}
