import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { getSupabaseForUser } from '@/next/lib/db/client-resolver';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data: byod, error } = await auth.supabase
    .from('byod_connections')
    .select('id,supabase_url,status,verified_at,last_health_check_at,health_check_failures')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (safeTableMissing(error)) return NextResponse.json({ connected: false, status: 'migration_pending', migrationPending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!byod || !['active', 'connected'].includes(byod.status)) {
    return NextResponse.json({ connected: false, status: byod?.status ?? 'none' });
  }

  const start = Date.now();
  let reachable = false;
  try {
    const client = await getSupabaseForUser(auth.user.id);
    const { error: pingError } = await client.from('memory_events').select('id').limit(1);
    reachable = !pingError;
  } catch {
    reachable = false;
  }

  return NextResponse.json({
    connected: true,
    status: byod.status,
    supabaseUrl: byod.supabase_url,
    verifiedAt: byod.verified_at,
    health: {
      reachable,
      latencyMs: Date.now() - start,
      lastCheckedAt: new Date().toISOString()
    }
  });
}
