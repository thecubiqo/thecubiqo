import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const bodySchema = z.object({
  actioned: z.boolean().optional().default(false),
  dismissed: z.boolean().optional().default(false)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification read payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = { read_at: now };
  if (parsed.data.actioned) patch.actioned_at = now;
  if (parsed.data.dismissed) patch.dismissed_at = now;

  const { error } = await auth.supabase
    .from('notifications')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
