/**
 * GET  /api/agent/calendar         — list upcoming events (next 7 days)
 * POST /api/agent/calendar         — create a calendar event
 * DELETE /api/agent/calendar?id=X  — delete an event
 *
 * Uses Composio's Google Calendar toolkit.
 * Requires the user to have Google Calendar connected via /connectors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

// ── Composio client (lazy, only if COMPOSIO_API_KEY is set) ─────────────────
function getComposio() {
  const key = process.env.COMPOSIO_API_KEY;
  if (!key) return null;
  // Dynamic require to avoid build errors when not installed
  try {
    const { OpenAIToolSet } = require('@composio/core');
    return new OpenAIToolSet({ apiKey: key });
  } catch {
    return null;
  }
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

  const composio = getComposio();
  if (!composio) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
    // Check connector status
    const { data: connector } = await auth.supabase
      .from('user_connectors')
      .select('status, access_token')
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

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 86_400_000).toISOString();

    // Execute via Composio
    const result = await composio.executeAction(
      'GOOGLECALENDAR_LIST_EVENTS',
      {
        calendarId,
        timeMin,
        timeMax,
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      },
      auth.user.id
    );

    const events = result?.data?.items ?? result?.items ?? [];
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

  const composio = getComposio();
  if (!composio) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
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

    const result = await composio.executeAction(
      'GOOGLECALENDAR_CREATE_EVENT',
      eventBody,
      auth.user.id
    );

    const event = result?.data ?? result;

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

  const composio = getComposio();
  if (!composio) {
    return NextResponse.json({ error: 'Composio not configured' }, { status: 503 });
  }

  try {
    await composio.executeAction(
      'GOOGLECALENDAR_DELETE_EVENT',
      { calendarId, eventId },
      auth.user.id
    );
    return NextResponse.json({ ok: true, deleted: eventId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Calendar delete failed' },
      { status: 500 }
    );
  }
}
