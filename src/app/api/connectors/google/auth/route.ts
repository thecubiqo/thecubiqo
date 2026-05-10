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

  const url = new URL(request.url);
  const scope = url.searchParams.get('scope') || 'gmail,calendar';
  const requestedScopes = scope.includes('calendar')
    ? SCOPES
    : SCOPES.filter(s => !s.includes('calendar'));

  const state = Buffer.from(JSON.stringify({ userId: auth.user.id, ts: Date.now() })).toString('base64url');
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cubiqo.ai'}/api/connectors/google/callback`;

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
