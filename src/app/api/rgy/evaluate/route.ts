import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateRGYStatus } from '@/next/lib/rgy/rgy-engine';

export const runtime = 'nodejs';

const bodySchema = z.object({
  userId: z.string().uuid()
});

function hasInternalSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const cronSecret = request.headers.get('x-cron-secret');
  const cubiqoSecret = request.headers.get('x-cubiqo-internal');
  return cronSecret === expected || cubiqoSecret === expected;
}

export async function POST(request: NextRequest) {
  if (!hasInternalSecret(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid RGY evaluation payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateRGYStatus(parsed.data.userId);
  return NextResponse.json({ ok: true, result });
}
