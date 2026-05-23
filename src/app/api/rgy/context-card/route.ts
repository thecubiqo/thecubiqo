/**
 * RGY context cards — significant RGY shifts / off-thread new signals
 * surfaced as floating context overlays per UI Architecture §Card System.
 *
 * Stub: returns an empty list until the RGY watcher pipeline is wired.
 * Existing endpoint shape lets <CubiQoOverlays> poll without 404s.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;
  return NextResponse.json({ cards: [] });
}
