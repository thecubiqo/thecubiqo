/**
 * POST /api/comms/test-whatsapp
 * Sends a test WhatsApp message to the authenticated user's verified phone number.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (whatsapp:+1...)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { sendWhatsApp } from '@/next/lib/comms/sms';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  // Load verified phone from profile
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('phone_number, phone_verified, display_name')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!profile?.phone_number) {
    return NextResponse.json({ error: 'No phone number on your profile. Add one in Settings first.' }, { status: 400 });
  }
  if (!profile?.phone_verified) {
    return NextResponse.json({ error: 'Phone number not verified. Verify it in Settings first.' }, { status: 400 });
  }

  const name = profile.display_name ?? 'there';
  const result = await sendWhatsApp(
    profile.phone_number,
    `👋 Hey ${name}! This is CubiQo checking in via WhatsApp. Everything's working. Good to go ✅`
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ sent: true, sid: result.sid, to: profile.phone_number });
}
