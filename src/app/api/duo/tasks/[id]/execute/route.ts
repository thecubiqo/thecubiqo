import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { executeTask } from '@/next/lib/agent/worker';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const result = await executeTask(auth, id);
  const status = result.status === 'failed' ? 500 : result.status === 'blocked' ? 402 : 200;
  return NextResponse.json(result, { status });
}
