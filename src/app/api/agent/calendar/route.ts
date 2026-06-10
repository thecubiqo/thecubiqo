/**
 * GET  /api/agent/calendar         — list upcoming events (next 7 days)
 * POST /api/agent/calendar         — create a calendar event
 * DELETE /api/agent/calendar?id=X  — delete an event
 *
 * Uses Composio's Google Calendar toolkit via the v0.6 SDK
 * (composio.tools.execute — the old OpenAIToolSet API no longer exists).
 * Requires the user to have Google Calendar connected via /connectors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';
import { executeTool } from '@/next/lib/composio';

export const runtime = 'nodejs';
export const maxDuration = 30;

function composioConfigured() {
  return Boolean((process.env.COMPOSIO_API_KEY || '').trim());
}

async function requireActiveConnector(auth: { supabase: any; user: { id: string } }) {
  const { data: connector } = await auth.supabase
    .from('user_connectors')
    .select('status')
    .eq('user_id', auth.user.id)
    .eq('platform', 'googlecalendar')
    .maybeSingle();
  if (!connector || connector.status !== 'active') {
    return NextResponse.json({
      error: 'Google Calendar not connected',
      code: 'CONNECTOR_MISSING',
      connectUrl: '/connectors',
    }, { status: 402 });
  }
  return null;
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string(), // ISO 8601
  endTime: z.string(),   // ISO 8601
  timezone: z.string().optional().default('UTC'),
  location: z.string().max(300).optional(),
  attendees: z.array(z.string().email()).max(20).optional(),
  calendarId: z.string().optional().default('primary'),
});

// ── GET: list events ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const params = new URL(request.url).searchParams;
  const days = Math.min(parseInt(params.get('days') || '7', 10), 30);
  const calendarId = params.get('calendarId') || 'primary';

  if (!composioConfigured()) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
    const connectorError = await requireActiveConnector(auth);
    if (connectorError) return connectorError;

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 86_400_000).toISOString();

    const result = await executeTool('GOOGLECALENDAR_LIST_EVENTS', auth.user.id, {
      calendarId,
      timeMin,
      timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    if (!result.successful) {
      return NextResponse.json({ error: result.error || 'Calendar list failed' }, { status: 502 });
    }

    const data: any = result.data;
    const events = data?.items ?? data?.data?.items ?? [];
    return NextResponse.json({ events, count: events.length, timeMin, timeMax });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Calendar list failed' },
      { status: 500 }
    );
  }
}

// ── POST: create event ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, startTime, endTime, timezone, location, attendees, calendarId } = parsed.data;

  if (!composioConfigured()) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
    const connectorError = await requireActiveConnector(auth);
    if (connectorError) return connectorError;

    const eventBody: Record<string, unknown> = {
      calendarId,
      summary: title,
      description: description ?? null,
      start: { dateTime: startTime, timeZone: timezone },
      end: { dateTime: endTime, timeZone: timezone },
    };
    if (location) eventBody.location = location;
    if (attendees?.length) {
      eventBody.attendees = attendees.map(email => ({ email }));
    }

    const result = await executeTool('GOOGLECALENDAR_CREATE_EVENT', auth.user.id, eventBody);
    if (!result.successful) {
      return NextResponse.json({ error: result.error || 'Calendar create failed' }, { status: 502 });
    }

    const event: any = result.data;

    // Write to memory so agent knows about this commitment
    await auth.supabase.from('memory_events').insert({
      user_id: auth.user.id,
      event_type: 'commitment',
      summary: `Calendar event created: "${title}" on ${new Date(startTime).toLocaleDateString()}`,
      keywords: [title, 'calendar', 'event'],
      weight: 2,
      metadata: { eventId: event?.id ?? null, startTime, endTime },
    }).catch(() => null);

    return NextResponse.json({ ok: true, event });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Calendar create failed' },
      { status: 500 }
    );
  }
}

// ── DELETE: remove event ──────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const params = new URL(request.url).searchParams;
  const eventId = params.get('id');
  const calendarId = params.get('calendarId') || 'primary';

  if (!eventId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  if (!composioConfigured()) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
    const connectorError = await requireActiveConnector(auth);
    if (connectorError) return connectorError;

    const result = await executeTool('GOOGLECALENDAR_DELETE_EVENT', auth.user.id, { calendarId, eventId });
    if (!result.successful) {
      return NextResponse.json({ error: result.error || 'Calendar delete failed' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, deleted: eventId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Calendar delete failed' },
      { status: 500 }
    );
  }
}
