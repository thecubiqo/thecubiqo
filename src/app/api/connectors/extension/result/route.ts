import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const ResultSchema = z.object({
  instructionId: z.string().uuid(),
  status: z.enum(['completed', 'failed', 'partial']).default('completed'),
  extractedData: z.record(z.unknown()).default({}),
  error: z.string().max(2000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-cubiqo-extension-token');
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const parsed = ResultSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid extension result payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return new NextResponse('Config error', { status: 500 });

  const { data: session } = await supabase
    .from('extension_sessions')
    .select('user_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (!session) return new NextResponse('Invalid token', { status: 401 });

  const { data: instruction } = await supabase
    .from('extension_instructions')
    .select('id,user_id')
    .eq('id', parsed.data.instructionId)
    .maybeSingle();

  if (!instruction || instruction.user_id !== session.user_id) return new NextResponse('Not found', { status: 404 });

  const now = new Date().toISOString();
  await supabase
    .from('extension_instructions')
    .update({
      status: parsed.data.status === 'failed' ? 'failed' : 'completed',
      result: parsed.data.extractedData,
      error: parsed.data.error || null,
    })
    .eq('id', parsed.data.instructionId);

  await supabase
    .from('user_connectors')
    .update({ last_health_check_at: now, health_status: 'healthy', updated_at: now })
    .eq('user_id', session.user_id)
    .eq('platform', 'cubiqo_extension');

  return NextResponse.json({ received: true });
}
