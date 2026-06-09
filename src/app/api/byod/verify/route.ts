import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { decryptKey } from '@/next/lib/db/encryption';

export const runtime = 'nodejs';

const REQUIRED_TABLES = [
  'memory_events',
  'conversation_sessions',
  'user_ai_profile',
  'chat_turns',
  'recommendation_events'
];

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data: byod, error } = await auth.supabase
    .from('byod_connections')
    .select('id,supabase_url,encrypted_service_role_key,encryption_iv,encryption_tag,status')
    .eq('user_id', auth.user.id)
    .in('status', ['pending_verification', 'pending', 'error', 'unhealthy'])
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!byod) return NextResponse.json({ error: 'No pending connection found' }, { status: 404 });

  let serviceRoleKey: string;
  try {
    serviceRoleKey = decryptKey({
      ciphertext: byod.encrypted_service_role_key,
      iv: byod.encryption_iv,
      tag: byod.encryption_tag
    });
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
  }

  const start = Date.now();
  const userClient = createClient(byod.supabase_url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const tablesPresent: string[] = [];
  const tablesMissing: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error: tableError } = await userClient.from(table).select('id').limit(1);
    if (tableError) tablesMissing.push(table);
    else tablesPresent.push(table);
  }

  const latencyMs = Date.now() - start;
  const allPresent = tablesMissing.length === 0;
  const now = new Date().toISOString();

  await auth.supabase
    .from('byod_connections')
    .update({
      status: allPresent ? 'active' : 'error',
      verified_at: allPresent ? now : null,
      last_health_check_at: now,
      health_check_failures: allPresent ? 0 : 1,
      updated_at: now
    })
    .eq('user_id', auth.user.id);

  await auth.supabase.from('byod_sync_log').insert({
    user_id: auth.user.id,
    connection_id: byod.id,
    operation: 'health_check',
    table_name: '*',
    status: allPresent ? 'success' : 'error',
    error_message: allPresent ? null : `Missing tables: ${tablesMissing.join(', ')}`,
    latency_ms: latencyMs
  });

  return NextResponse.json({
    ok: allPresent,
    status: allPresent ? 'active' : 'error',
    health: { reachable: true, latencyMs, tablesPresent, tablesMissing, lastCheckedAt: now }
  });
}
