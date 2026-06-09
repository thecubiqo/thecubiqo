/**
 * POST /api/duo/projects/[id]/tick
 *
 * One proactive step for an open capsule: start the next eligible task (through
 * the safe draft/approval pipeline) and refresh the live-view artifact. The
 * capsule page heartbeats this every few seconds while the dashboard is open,
 * so CubiQo is visibly, continuously working the goal. A cron backstop
 * (/api/cron/capsule-advance) calls the same engine when the dashboard is shut.
 *
 * Returns the CapsuleTickResult so the client can decide whether to keep
 * heartbeating (advanced/idle) or stop (budget_reached/terminal/all_done).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { advanceCapsule } from '@/next/lib/agent/capsule-engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const result = await advanceCapsule(auth, parsed.data.id);
  return NextResponse.json(result);
}
