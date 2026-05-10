import { NextRequest } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 55; // Vercel max for streaming

// SSE endpoint — streams action approval state changes for the /actions dashboard.
// Client connects with EventSource('/api/actions/events') and receives server-sent events.
// Polls Supabase every 3 seconds for new/updated approvals.

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) {
    return new Response('data: {"error":"Unauthorized"}\n\n', {
      status: 401,
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get('since') || new Date(Date.now() - 60000).toISOString();

  let lastSeen = since;
  let closed = false;
  request.signal?.addEventListener('abort', () => { closed = true; });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { closed = true; }
      }

      // Initial ping
      send('connected', { userId: auth.user.id, timestamp: new Date().toISOString() });

      while (!closed) {
        try {
          const { data: approvals, error } = await auth.supabase
            .from('action_approvals')
            .select('id,action_type,tool_name,status,title,summary,risk_level,payload,decided_at,created_at,updated_at')
            .eq('user_id', auth.user.id)
            .gt('updated_at', lastSeen)
            .order('updated_at', { ascending: true })
            .limit(10);

          if (!error && approvals && approvals.length > 0) {
            lastSeen = approvals[approvals.length - 1].updated_at;
            for (const approval of approvals) {
              send('approval', approval);
            }
          }

          // Also check for new browser sessions
          const { data: sessions } = await auth.supabase
            .from('browser_sessions')
            .select('id,status,live_view_url,created_at,updated_at')
            .eq('user_id', auth.user.id)
            .gt('updated_at', new Date(Date.now() - 5000).toISOString())
            .limit(5);

          if (sessions && sessions.length > 0) {
            for (const session of sessions) {
              send('browser_session', session);
            }
          }

          send('heartbeat', { timestamp: new Date().toISOString() });
        } catch {
          send('error', { message: 'poll failed' });
        }

        // Wait 3 seconds between polls
        await new Promise<void>(resolve => {
          const t = setTimeout(resolve, 3000);
          request.signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); });
        });
      }

      try { controller.close(); } catch { /* already closed */ }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
