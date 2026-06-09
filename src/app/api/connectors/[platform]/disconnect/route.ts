import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { platform } = await params;
  const normalized = platform.trim().toLowerCase();
  const { data } = await auth.supabase
    .from('user_connectors')
    .update({
      status: 'disconnected',
      health_status: 'unknown',
      health_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', auth.user.id)
    .eq('platform', normalized)
    .select('id');

  const ids = (data || []).map((row: { id: string }) => row.id);
  if (ids.length) {
    await auth.supabase.from('connector_secrets').update({ status: 'revoked', updated_at: new Date().toISOString() }).in('connector_id', ids);
  }

  return NextResponse.json({ disconnected: true, platform: normalized });
}
