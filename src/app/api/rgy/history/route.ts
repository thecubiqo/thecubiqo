import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('rgy_transitions')
    .select('from_status,to_status,reason,trigger_type,triggered_at,created_at,metadata')
    .eq('user_id', auth.user.id)
    .order('triggered_at', { ascending: false })
    .limit(20);

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('rgy-history', 'rgy_transitions');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transitions: data ?? [] });
}
