import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { getChatroomRGYAggregate, snapshotChatroomRGY } from '@/next/lib/rgy/chatroom-rgy';

export const runtime = 'nodejs';

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid chatroom id' }, { status: 400 });

  const aggregate = await getChatroomRGYAggregate(parsed.data.id);
  return NextResponse.json({ aggregate });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid chatroom id' }, { status: 400 });

  const aggregate = await snapshotChatroomRGY(parsed.data.id);
  return NextResponse.json({ aggregate });
}
