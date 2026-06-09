import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { decryptKey } from './encryption';

const clientCache = new Map<string, { client: SupabaseClient; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getSupabaseForUser(userId: string): Promise<SupabaseClient> {
  const cached = clientCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.client;

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase server configuration is missing');

  const { data: byod, error } = await admin
    .from('byod_connections')
    .select('supabase_url, encrypted_service_role_key, encryption_iv, encryption_tag, status')
    .eq('user_id', userId)
    .in('status', ['active', 'connected'])
    .maybeSingle();

  if (safeTableMissing(error) || !byod) return admin as SupabaseClient;

  let serviceRoleKey: string;
  try {
    serviceRoleKey = decryptKey({
      ciphertext: byod.encrypted_service_role_key,
      iv: byod.encryption_iv,
      tag: byod.encryption_tag
    });
  } catch {
    try {
      await admin.from('byod_sync_log').insert({
        user_id: userId,
        operation: 'client_resolve',
        table_name: '*',
        status: 'error',
        error_message: 'Decryption failed'
      });
    } catch {
      // Keep DB routing available even if audit logging is unavailable.
    }
    return admin as SupabaseClient;
  }

  const client = createClient(byod.supabase_url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  clientCache.set(userId, { client, expiresAt: Date.now() + CACHE_TTL_MS });
  return client;
}

export function invalidateBYODCache(userId: string): void {
  clientCache.delete(userId);
}
