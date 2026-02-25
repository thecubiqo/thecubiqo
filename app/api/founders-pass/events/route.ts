// API: Events / Analytics
import { NextRequest, NextResponse } from 'next/server';
import { emitEvent, listEvents } from '@/lib/founders-pass/service';
import type { EventType } from '@/lib/founders-pass/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const events = await listEvents({
      siteId: searchParams.get('siteId') ?? undefined,
      eventType: searchParams.get('eventType') ?? undefined,
      limit: parseInt(searchParams.get('limit') ?? '100', 10),
    });
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await emitEvent({
      siteId: body.site_id,
      userId: body.user_id,
      eventType: body.event_type as EventType,
      eventData: body.event_data ?? {},
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
