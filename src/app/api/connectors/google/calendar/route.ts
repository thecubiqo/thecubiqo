import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

async function getValidToken(supabase: any, userId: string): Promise<string | null> {
  const { data: token } = await supabase
    .from('google_oauth_tokens')
    .select('access_token,refresh_token,expires_at')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (!token) return null;

  const expiresAt = new Date(token.expires_at).getTime();
  if (Date.now() < expiresAt - 60000) return token.access_token;

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
  await supabase.from('google_oauth_tokens').update({ access_token: json.access_token, expires_at: newExpiry }).eq('user_id', userId);
  return json.access_token;
}

// GET /api/connectors/google/calendar?action=list&days=7
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const accessToken = await getValidToken(auth.supabase, auth.user.id);
  if (!accessToken) {
    return NextResponse.json({ error: 'Google account not connected', action: 'connect_google' }, { status: 403 });
  }

  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 30);
  const now = new Date().toISOString();
  const end = new Date(Date.now() + days * 86400 * 1000).toISOString();

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!calRes.ok) return NextResponse.json({ error: `Calendar API ${calRes.status}` }, { status: 502 });
  const calData = await calRes.json();

  const events = (calData.items || []).map((e: any) => ({
    id: e.id,
    summary: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || null,
    description: (e.description || '').slice(0, 200),
    attendees: (e.attendees || []).slice(0, 5).map((a: any) => ({ email: a.email, status: a.responseStatus })),
    htmlLink: e.htmlLink
  }));

  return NextResponse.json({ events, calendarId: 'primary', range: { from: now, to: end } });
}

// POST /api/connectors/google/calendar — create an event
export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const accessToken = await getValidToken(auth.supabase, auth.user.id);
  if (!accessToken) {
    return NextResponse.json({ error: 'Google account not connected', action: 'connect_google' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { summary, description, start, end, attendees } = body;

  if (!summary || !start || !end) {
    return NextResponse.json({ error: 'summary, start, end are required' }, { status: 400 });
  }

  const event: Record<string, any> = {
    summary: String(summary).slice(0, 200),
    description: description ? String(description).slice(0, 2000) : undefined,
    start: { dateTime: start, timeZone: 'UTC' },
    end: { dateTime: end, timeZone: 'UTC' }
  };

  if (Array.isArray(attendees) && attendees.length) {
    event.attendees = attendees.slice(0, 10).map((a: any) => ({ email: String(a.email || a) }));
  }

  const createRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    return NextResponse.json({ error: `Calendar create failed ${createRes.status}: ${errText.slice(0, 200)}` }, { status: 502 });
  }

  const created = await createRes.json();
  return NextResponse.json({ created: true, event: { id: created.id, htmlLink: created.htmlLink, summary: created.summary } });
}
