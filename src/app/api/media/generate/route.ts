import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { isPro } from '@/next/lib/billing/gates';
import { enqueueMediaGeneration } from '@/next/lib/media/generation-queue';

export const runtime = 'nodejs';

const generateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  mediaType: z.enum(['image', 'audio', 'video', 'video_clip']),
  sessionId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  style: z.string().max(80).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional(),
  negativePrompt: z.string().max(1000).optional()
});

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  if (!(await isPro(auth.user.id))) {
    return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 402 });
  }

  const parsed = generateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid media generation payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await enqueueMediaGeneration(auth.user.id, parsed.data);
  return NextResponse.json({ ...result, status: 'queued' }, { status: 202 });
}
