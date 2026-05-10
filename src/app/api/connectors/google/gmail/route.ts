import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

async function getGoogleToken(supabase: any, userId: string) {
  const { data } = await supabase
    .from('google_oauth_tokens')
    .select('access_token,refresh_token,expires_at,scopes')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  return data;
}

async function refreshIfNeeded(supabase: any, userId: string, token: any): Promise<string | null> {
  if (!token) return null;
  const expiresAt = new Date(token.expires_at).getTime();
  if (Date.now() < expiresAt - 60000) return token.access_token;

  // Refresh
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!token.refresh_token || !clientId || !clientSecret) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  if (!res.ok) return null;
  const json = await res.json();
  const newExpiry = new Date(Date.now() + (json.expires_in || 3600) * 1000).toISOString();

  await supabase
    .from('google_oauth_tokens')
    .update({ access_token: json.access_token, expires_at: newExpiry })
    .eq('user_id', userId);

  return json.access_token;
}

// GET /api/connectors/google/gmail?action=list&maxResults=10
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const rawToken = await getGoogleToken(auth.supabase, auth.user.id);
  const accessToken = await refreshIfNeeded(auth.supabase, auth.user.id, rawToken);
  if (!accessToken) {
    return NextResponse.json({ error: 'Google account not connected', action: 'connect_google' }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'list';
  const maxResults = Math.min(parseInt(url.searchParams.get('maxResults') || '10', 10), 50);
  const messageId = url.searchParams.get('id');

  if (action === 'get' && messageId) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return NextResponse.json({ error: `Gmail API ${res.status}` }, { status: 502 });
    const data = await res.json();
    return NextResponse.json({ message: data });
  }

  // List inbox messages
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) return NextResponse.json({ error: `Gmail API ${listRes.status}` }, { status: 502 });

  const listData = await listRes.json();
  const messages = listData.messages || [];

  // Fetch snippets in parallel (up to 10)
  const withSnippets = await Promise.all(
    messages.slice(0, 10).map(async (m: { id: string }) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!r.ok) return m;
      const detail = await r.json();
      const headers: { name: string; value: string }[] = detail.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      return { id: m.id, subject, from, date, snippet: detail.snippet || '' };
    })
  );

  return NextResponse.json({ messages: withSnippets, total: listData.resultSizeEstimate || 0 });
}
