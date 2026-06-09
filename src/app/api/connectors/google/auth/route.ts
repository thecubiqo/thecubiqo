import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, cleanEnv } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile'
];

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const clientId = cleanEnv(process.env.GOOGLE_CLIENT_ID);
  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 501 });
  }
  const rawBaseUrl = cleanEnv(process.env.NEXT_PUBLIC_BASE_URL) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  const baseUrl = rawBaseUrl?.startsWith('http') ? rawBaseUrl : rawBaseUrl ? `https://${rawBaseUrl}` : undefined;
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL must be set before starting Google OAuth' }, { status: 500 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') || 'gmail,calendar';
  const requestedScopes = scope.includes('calendar')
    ? SCOPES
    : SCOPES.filter(s => !s.includes('calendar'));

  // CSRF protection: persist a single-use random nonce server-side bound to this
  // user, and send ONLY the nonce in `state`. The callback derives the user from
  // this stored row — never from attacker-supplied state — preventing the
  // account-binding / login-CSRF attack the old base64-userId state allowed.
  const nonce = randomUUID();
  const { error: stateErr } = await auth.supabase.from('oauth_states').insert({
    state: nonce,
    user_id: auth.user.id,
    platform: 'google',
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (stateErr) {
    return NextResponse.json({ error: 'Could not initialise OAuth state', detail: stateErr.message }, { status: 500 });
  }
  const state = nonce;
  const redirectUri = `${baseUrl}/api/connectors/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', requestedScopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: authUrl.toString(), state });
}
