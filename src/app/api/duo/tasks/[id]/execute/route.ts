import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { executeTask } from '@/next/lib/agent/worker';

export const runtime = 'nodejs';
export const maxDuration = 55;

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  const { id } = parsed.data;
  const result = await executeTask(auth, id);
  const status = result.status === 'failed' ? 500 : result.status === 'blocked' ? 402 : 200;
  return NextResponse.json(result, { status });
}
