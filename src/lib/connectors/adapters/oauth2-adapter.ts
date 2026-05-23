import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { shouldUseProviderMock } from '@/next/lib/providers/live-provider-guard';
import { decrypt, encrypt, hint } from './crypto';
import type { ConnectorAdapter } from './base';

export interface OAuth2Config {
  platform: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  pkce: boolean;
  redirectPath: string;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

async function getConnectorId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  platform: string,
  payload: Record<string, unknown>,
) {
  if (!supabase) throw new Error('DB unavailable');

  const { data: existing } = await supabase
    .from('user_connectors')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('user_connectors')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single();
    if (error || !data?.id) throw new Error(error?.message || 'Failed to update connector');
    return data.id as string;
  }

  const { data, error } = await supabase
    .from('user_connectors')
    .insert({ user_id: userId, platform, ...payload })
    .select('id')
    .single();
  if (error || !data?.id) throw new Error(error?.message || 'Failed to create connector');
  return data.id as string;
}

export class OAuth2Adapter implements ConnectorAdapter {
  platform: string;
  adapterType = 'oauth2' as const;

  constructor(private config: OAuth2Config) {
    this.platform = config.platform;
  }

  buildAuthUrl(userId: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}${this.config.redirectPath}`,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      state: JSON.stringify({ userId, platform: this.config.platform, nonce }),
      access_type: 'offline',
      prompt: 'consent',
    });
    return `${this.config.authUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string, userId: string): Promise<void> {
    const tokens = shouldUseProviderMock()
      ? {
          access_token: `mock-${this.config.platform}-access-token`,
          refresh_token: `mock-${this.config.platform}-refresh-token`,
          expires_in: 3600,
          scope: this.config.scopes.join(' '),
        }
      : await this.fetchTokens({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}${this.config.redirectPath}`,
        });

    if (!tokens.access_token) throw new Error('Token exchange failed: no access token');

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('DB unavailable');

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
    const connectorId = await getConnectorId(supabase, userId, this.config.platform, {
      adapter_type: 'oauth2',
      auth_type: 'oauth',
      status: 'active',
      scopes: tokens.scope ? tokens.scope.split(/[ ,]+/).filter(Boolean) : this.config.scopes,
      token_expires_at: expiresAt,
      expires_at: expiresAt,
      last_health_check_at: new Date().toISOString(),
      health_status: 'healthy',
      updated_at: new Date().toISOString(),
    });

    await supabase.from('connector_secrets').upsert(
      {
        user_id: userId,
        connector_id: connectorId,
        platform: this.config.platform,
        secret_ref: `${this.config.platform}:${connectorId}:oauth`,
        status: 'active',
        access_token_encrypted: encrypt(tokens.access_token),
        refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        token_hint: hint(tokens.access_token),
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'connector_id' },
    );
  }

  async getAuthHeaders(userId: string): Promise<Record<string, string> | null> {
    const accessToken = await this.getAccessToken(userId);
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : null;
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

  private async getAccessToken(userId: string): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data: connector } = await supabase
      .from('user_connectors')
      .select('id,status,token_expires_at')
      .eq('user_id', userId)
      .eq('platform', this.config.platform)
      .maybeSingle();

    if (!connector || connector.status !== 'active') return null;

    const { data: secret } = await supabase
      .from('connector_secrets')
      .select('access_token_encrypted,refresh_token_encrypted')
      .eq('connector_id', connector.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!secret?.access_token_encrypted) return null;

    const expiresAt = connector.token_expires_at ? new Date(connector.token_expires_at) : null;
    if (expiresAt && expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshToken(userId, connector.id, secret.refresh_token_encrypted || null);
      const { data: fresh } = await supabase
        .from('connector_secrets')
        .select('access_token_encrypted')
        .eq('connector_id', connector.id)
        .eq('status', 'active')
        .maybeSingle();
      return fresh?.access_token_encrypted ? decrypt(fresh.access_token_encrypted) : null;
    }

    return decrypt(secret.access_token_encrypted);
  }

  private async refreshToken(userId: string, connectorId: string, encryptedRefreshToken: string | null): Promise<void> {
    if (!encryptedRefreshToken) return;
    try {
      const refreshToken = decrypt(encryptedRefreshToken);
      const tokens = shouldUseProviderMock()
        ? { access_token: `mock-${this.config.platform}-refreshed-token`, refresh_token: refreshToken, expires_in: 3600 }
        : await this.fetchTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });
      if (!tokens.access_token) return;

      const supabase = getSupabaseAdmin();
      if (!supabase) return;
      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      await supabase
        .from('connector_secrets')
        .update({
          access_token_encrypted: encrypt(tokens.access_token),
          refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : encryptedRefreshToken,
          token_hint: hint(tokens.access_token),
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('connector_id', connectorId);
      await supabase
        .from('user_connectors')
        .update({ token_expires_at: expiresAt, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('id', connectorId)
        .eq('user_id', userId);
    } catch {
      // Next request will try again; connector health cron can mark degraded.
    }
  }

  private async fetchTokens(extra: Record<string, string>): Promise<TokenResponse> {
    const res = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        ...extra,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    return (await res.json()) as TokenResponse;
  }
}
