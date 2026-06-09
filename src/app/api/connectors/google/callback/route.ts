import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, cleanEnv } from '../../../_lib/supabase-admin';
import { encGoogleToken } from '../_token';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateB64 = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const rawBaseUrl = cleanEnv(process.env.NEXT_PUBLIC_BASE_URL) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const baseUrl = rawBaseUrl?.startsWith('http') ? rawBaseUrl : rawBaseUrl ? `https://${rawBaseUrl}` : undefined;
  if (!baseUrl) {
    return NextResponse.redirect(new URL('/settings/connectors?error=base_url_missing', request.url));
  }

  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !stateB64) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=missing_params`);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=db_unavailable`);
  }

  // CSRF / account-binding protection: `state` is a single-use nonce we stored
  // in oauth_states during /google/auth. Look it up, verify it exists and is
  // unexpired, derive the user from the STORED row (never from the inbound
  // payload), then delete it so it can't be replayed.
  const nonce = stateB64;
  const { data: stateRow } = await admin
    .from('oauth_states')
    .select('user_id, expires_at')
    .eq('state', nonce)
    .eq('platform', 'google')
    .maybeSingle();

  if (!stateRow) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=invalid_state`);
  }
  // One-time use: remove regardless of outcome below.
  await admin.from('oauth_states').delete().eq('state', nonce).eq('platform', 'google');
  if (stateRow.expires_at && new Date(stateRow.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=state_expired`);
  }
  const state = { userId: stateRow.user_id as string };

  const clientId = cleanEnv(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = `${baseUrl}/api/connectors/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=google_not_configured`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Google token exchange failed:', errText);
    return NextResponse.redirect(`${baseUrl}/settings/connectors?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in, scope, id_token } = tokens;

  // Fetch Google user info
  let googleEmail = '';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (userRes.ok) {
      const userInfo = await userRes.json();
      googleEmail = userInfo.email || '';
    }
  } catch { /* non-fatal */ }

  const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

  // Encrypt high-privilege Gmail/Calendar tokens at rest (AES-256-GCM) — never
  // store them in plaintext. Read paths decrypt via decGoogleToken().
  await admin
    .from('google_oauth_tokens')
    .upsert(
      {
        user_id: state.userId,
        google_email: googleEmail,
        access_token: encGoogleToken(access_token),
        refresh_token: encGoogleToken(refresh_token),
        expires_at: expiresAt,
        scopes: scope ? scope.split(' ') : [],
        active: true
      },
      { onConflict: 'user_id' }
    );

  return NextResponse.redirect(`${baseUrl}/settings/connectors?google=connected&email=${encodeURIComponent(googleEmail)}`);
}
