import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({
  snoozeHours: z.number().int().min(1).max(720).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsedParams = paramsSchema.safeParse(await params);
  if (!parsedParams.success) return NextResponse.json({ error: 'Invalid nudge id' }, { status: 400 });

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid nudge dismiss payload', issues: parsedBody.error.flatten() }, { status: 400 });
  }

  const snoozedUntil = parsedBody.data.snoozeHours
    ? new Date(Date.now() + parsedBody.data.snoozeHours * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await auth.supabase
    .from('interventions_log')
    .update({
      user_response: 'dismissed',
      snoozed_until: snoozedUntil
    })
    .eq('id', parsedParams.data.id)
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, snoozedUntil });
}
