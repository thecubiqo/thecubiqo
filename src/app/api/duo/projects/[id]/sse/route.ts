import { NextRequest } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return new Response('data: {"error":"Unauthorized"}\n\n', { status: 401, headers: { 'Content-Type': 'text/event-stream' } });
  }

  const { id } = await params;
  const encoder = new TextEncoder();
  let lastSeen = request.headers.get('last-event-id') || request.nextUrl.searchParams.get('since') || new Date(Date.now() - 60_000).toISOString();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      send({ type: 'connected', projectId: id });

      const interval = setInterval(async () => {
        const { data } = await auth.supabase
          .from('stream_events')
          .select('id,event_type,payload,created_at')
          .eq('project_id', id)
          .gt('created_at', lastSeen)
          .order('created_at', { ascending: true })
          .limit(25);

        for (const event of data || []) {
          lastSeen = event.created_at;
          send({ type: event.event_type, ...event.payload, id: event.id, createdAt: event.created_at });
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 50_000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
