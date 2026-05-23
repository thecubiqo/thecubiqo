import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-cubiqo-extension-token');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return new Response('Config error', { status: 500 });

  const { data: session } = await supabase
    .from('extension_sessions')
    .select('user_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!session) return new Response('Invalid token', { status: 401 });

  const now = new Date().toISOString();
  await supabase.from('extension_sessions').update({ last_seen_at: now }).eq('token', token);
  await supabase
    .from('user_connectors')
    .update({ last_health_check_at: now, health_status: 'healthy', updated_at: now })
    .eq('user_id', session.user_id)
    .eq('platform', 'cubiqo_extension');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const { data: instructions } = await supabase
        .from('extension_instructions')
        .select('id,platform,actions')
        .eq('user_id', session.user_id)
        .eq('status', 'queued')
        .gt('expires_at', now)
        .order('created_at', { ascending: true })
        .limit(5);

      const ids = (instructions || []).map((instruction: { id: string }) => instruction.id);
      if (ids.length) {
        await supabase.from('extension_instructions').update({ status: 'running' }).in('id', ids);
      }

      for (const instruction of instructions || []) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(instruction)}\n\n`));
      }

      controller.enqueue(encoder.encode(': heartbeat\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
