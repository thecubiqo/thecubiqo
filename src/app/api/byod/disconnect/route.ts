import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { invalidateBYODCache } from '@/next/lib/db/client-resolver';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { error } = await auth.supabase
    .from('byod_connections')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateBYODCache(auth.user.id);

  return NextResponse.json({ ok: true, message: 'BYOD connection disconnected. Data remains in your Supabase.' });
}
