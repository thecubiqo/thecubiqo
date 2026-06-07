import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// GET /api/duo/stream/[id] — SSE stream of project state changes (polling fallback every 5s)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = params.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial state
      const fetchState = async () => {
        const [
          { data: tasks },
          { data: questions },
          { data: blockers },
          { data: approvals },
          { data: artifacts },
          { data: timeline },
        ] = await Promise.all([
          supabase.from('duo_tasks').select('id,title,status,sort_order,tool_used').eq('project_id', projectId).eq('user_id', user.id).order('sort_order'),
          supabase.from('duo_questions').select('*').eq('project_id', projectId).eq('status', 'pending'),
          supabase.from('duo_blockers').select('*').eq('project_id', projectId).eq('status', 'open'),
          supabase.from('duo_approvals').select('*').eq('project_id', projectId).eq('status', 'pending'),
          supabase.from('duo_artifacts').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(5),
          supabase.from('duo_timeline_events').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
        ]);

        return { tasks, questions, blockers, approvals, artifacts, timeline };
      };

      send('state', await fetchState());

      // Poll every 5s
      const interval = setInterval(async () => {
        try {
          send('state', await fetchState());
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 5000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
