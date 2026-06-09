/**
 * POST /api/profile/verify
 * Handles phone + email verification post-signup.
 *
 * Actions:
 *   { action: 'send_phone_otp', phone: '+447...' }   — sends OTP via Supabase
 *   { action: 'verify_phone_otp', phone, token }     — verifies OTP → marks verified
 *   { action: 'resend_email' }                       — resends email verification
 *   { action: 'check' }                              — returns current verification status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/next/lib/email/send';

export const runtime = 'nodejs';

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('send_phone_otp'), phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Must be E.164 format (+447...)') }),
  z.object({ action: z.literal('verify_phone_otp'), phone: z.string(), token: z.string().min(4).max(8) }),
  z.object({ action: z.literal('resend_email') }),
  z.object({ action: z.literal('check') }),
]);

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // Client-side Supabase for auth operations (needs anon key + user session)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authHeader = request.headers.get('authorization') || '';
  const userJwt = authHeader.replace(/^Bearer\s+/i, '');

  // Create a client acting as the user
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
    auth: { persistSession: false },
  });

  switch (body.action) {
    // ── Send phone OTP ───────────────────────────────────────────────────────
    case 'send_phone_otp': {
      // Store phone number on profile first
      await auth.supabase
        .from('profiles')
        .update({ phone_number: body.phone, updated_at: new Date().toISOString() })
        .eq('id', auth.user.id);

      // Supabase phone OTP (requires Twilio configured in Supabase dashboard)
      const { error } = await userClient.auth.signInWithOtp({ phone: body.phone });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: 'OTP sent to ' + body.phone });
    }

    // ── Verify phone OTP ──────────────────────────────────────────────────────
    case 'verify_phone_otp': {
      const { error } = await userClient.auth.verifyOtp({
        phone: body.phone,
        token: body.token,
        type: 'sms',
      });
      if (error) {
        return NextResponse.json({ error: error.message, code: 'OTP_INVALID' }, { status: 400 });
      }
      await auth.supabase
        .from('profiles')
        .update({
          phone_number: body.phone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', auth.user.id);
      return NextResponse.json({ ok: true, phoneVerified: true });
    }

    // ── Resend email verification ──────────────────────────────────────────────
    case 'resend_email': {
      // Check resend count guard (max 3)
      const { data: profile } = await auth.supabase
        .from('profiles')
        .select('email_resend_count, email_verified')
        .eq('id', auth.user.id)
        .maybeSingle();

      if (profile?.email_verified) {
        return NextResponse.json({ ok: true, message: 'Email already verified' });
      }
      if ((profile?.email_resend_count ?? 0) >= 5) {
        return NextResponse.json({ error: 'Too many resend attempts. Contact support.' }, { status: 429 });
      }

      const { data: userData } = await auth.supabase.auth.admin.getUserById(auth.user.id);
      const userEmail = userData?.user?.email;

      if (!userEmail) {
        return NextResponse.json({ error: 'No email on account' }, { status: 400 });
      }

      // Supabase resend confirmation email
      const { error } = await userClient.auth.resend({ type: 'signup', email: userEmail });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await auth.supabase
        .from('profiles')
        .update({ email_resend_count: (profile?.email_resend_count ?? 0) + 1 })
        .eq('id', auth.user.id);

      return NextResponse.json({ ok: true, message: `Verification email sent to ${userEmail}` });
    }

    // ── Check status ───────────────────────────────────────────────────────────
    case 'check': {
      const { data: profile } = await auth.supabase
        .from('profiles')
        .select('phone_number, phone_verified, phone_verified_at, email_verified, email_verified_at')
        .eq('id', auth.user.id)
        .maybeSingle();

      const { data: userData } = await auth.supabase.auth.admin.getUserById(auth.user.id);
      const emailConfirmedAt = userData?.user?.email_confirmed_at ?? null;

      // Sync email_verified from Supabase auth if not yet in profile
      if (emailConfirmedAt && !profile?.email_verified) {
        await auth.supabase
          .from('profiles')
          .update({ email_verified: true, email_verified_at: emailConfirmedAt })
          .eq('id', auth.user.id);
      }

      return NextResponse.json({
        phone: {
          number: profile?.phone_number ?? null,
          verified: profile?.phone_verified ?? false,
          verifiedAt: profile?.phone_verified_at ?? null,
        },
        email: {
          address: userData?.user?.email ?? null,
          verified: !!(emailConfirmedAt || profile?.email_verified),
          verifiedAt: emailConfirmedAt ?? profile?.email_verified_at ?? null,
        },
      });
    }

    default:
      // Exhaustiveness guard — the zod union should prevent reaching here.
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
