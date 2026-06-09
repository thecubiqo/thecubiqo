import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { decrypt, encrypt, hint } from './crypto';
import type { ConnectorAdapter } from './base';

export interface ApiKeyConfig {
  platform: string;
  headerName: string;
  headerPrefix: string | null;
  apiBaseUrl: string;
}

export class ApiKeyAdapter implements ConnectorAdapter {
  platform: string;
  adapterType = 'api_key' as const;

  constructor(private config: ApiKeyConfig) {
    this.platform = config.platform;
  }

  async saveKey(userId: string, apiKey: string, apiSecret?: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('DB unavailable');

    const { data: existing } = await supabase
      .from('user_connectors')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', this.config.platform)
      .maybeSingle();

    const payload = {
      user_id: userId,
      platform: this.config.platform,
      adapter_type: 'api_key',
      auth_type: 'api_key',
      status: 'active',
      last_health_check_at: new Date().toISOString(),
      health_status: 'healthy',
      updated_at: new Date().toISOString(),
    };

    const connector = existing?.id
      ? await supabase.from('user_connectors').update(payload).eq('id', existing.id).select('id').single()
      : await supabase.from('user_connectors').insert(payload).select('id').single();

    if (connector.error || !connector.data?.id) throw new Error(connector.error?.message || 'Failed to save connector');

    await supabase.from('connector_secrets').upsert(
      {
        user_id: userId,
        connector_id: connector.data.id,
        platform: this.config.platform,
        secret_ref: `${this.config.platform}:${connector.data.id}:api_key`,
        status: 'active',
        api_key_encrypted: encrypt(apiKey),
        api_secret_encrypted: apiSecret ? encrypt(apiSecret) : null,
        token_hint: hint(apiKey),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'connector_id' },
    );
  }

  async getAuthHeaders(userId: string): Promise<Record<string, string> | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data } = await supabase
      .from('user_connectors')
      .select('id,status')
      .eq('user_id', userId)
      .eq('platform', this.config.platform)
      .maybeSingle();

    if (!data || data.status !== 'active') return null;

    const { data: secret } = await supabase
      .from('connector_secrets')
      .select('api_key_encrypted')
      .eq('connector_id', data.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!secret?.api_key_encrypted) return null;
    const key = decrypt(secret.api_key_encrypted);
    const value = this.config.headerPrefix ? `${this.config.headerPrefix} ${key}` : key;
    return { [this.config.headerName]: value };
  }

  async isConnected(userId: string): Promise<boolean> {
    return (await this.getAuthHeaders(userId)) !== null;
  }

  async disconnect(userId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;
    const { data } = await supabase
      .from('user_connectors')
      .update({ status: 'disconnected', health_status: 'unknown', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('platform', this.config.platform)
      .select('id');
    const ids = (data || []).map((row: { id: string }) => row.id);
    if (ids.length) {
      await supabase.from('connector_secrets').update({ status: 'revoked', updated_at: new Date().toISOString() }).in('connector_id', ids);
    }
  }
}
