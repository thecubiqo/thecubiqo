import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { ApiKeyAdapter, type ApiKeyConfig } from './adapters/api-key-adapter';
import { ExtensionAdapter } from './adapters/extension-adapter';
import { OAuth2Adapter, type OAuth2Config } from './adapters/oauth2-adapter';

type RegistryRow = Record<string, unknown> & {
  platform: string;
  adapter_type: 'oauth2' | 'api_key' | 'open_banking' | 'extension';
};

let cache: Map<string, RegistryRow> | null = null;
let cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getRegistry(): Promise<Map<string, RegistryRow>> {
  if (cache && Date.now() - cacheTs < CACHE_TTL_MS) return cache;

  const supabase = getSupabaseAdmin();
  if (!supabase) return new Map();

  const { data } = await supabase.from('connector_registry').select('*').eq('is_active', true);
  cache = new Map(((data || []) as RegistryRow[]).map(row => [row.platform, row]));
  cacheTs = Date.now();
  return cache;
}

export function clearConnectorRegistryCache() {
  cache = null;
  cacheTs = 0;
}

export async function buildOAuthAdapter(platform: string): Promise<OAuth2Adapter | null> {
  const row = await getRegistryRow(platform);
  if (!row || row.adapter_type !== 'oauth2' || platform === 'shopify') return null;
  return buildOAuthAdapterSync(platform, row);
}

export function buildOAuthAdapterSync(platform: string, row: RegistryRow): OAuth2Adapter | null {
  if (!row || row.adapter_type !== 'oauth2' || platform === 'shopify') return null;

  const clientId = process.env[String(row.oauth_client_id_env || '')];
  const clientSecret = process.env[String(row.oauth_client_secret_env || '')];
  if (!clientId || !clientSecret) return null;

  const config: OAuth2Config = {
    platform: platform === 'youtube' ? 'google' : platform,
    authUrl: String(row.oauth_auth_url || ''),
    tokenUrl: String(row.oauth_token_url || ''),
    clientId,
    clientSecret,
    scopes: Array.isArray(row.oauth_default_scopes) ? (row.oauth_default_scopes as string[]) : [],
    pkce: row.oauth_pkce !== false,
    redirectPath: '/api/connectors/oauth/callback',
  };
  return new OAuth2Adapter(config);
}

export async function getApiKeyConfig(platform: string): Promise<ApiKeyConfig | null> {
  const row = await getRegistryRow(platform);
  if (!row || row.adapter_type !== 'api_key') return null;

  return {
    platform,
    headerName: String(row.api_key_header_name || 'Authorization'),
    headerPrefix: row.api_key_header_prefix ? String(row.api_key_header_prefix) : null,
    apiBaseUrl: String(row.api_base_url || ''),
  };
}

export function buildExtensionAdapter(platform: string): ExtensionAdapter {
  return new ExtensionAdapter(platform);
}

export async function getRegistryRow(platform: string): Promise<RegistryRow | null> {
  const registry = await getRegistry();
  return registry.get(platform) || null;
}

export async function requiresTosConsent(platform: string): Promise<boolean> {
  const row = await getRegistryRow(platform);
  return row?.tos_risk === true;
}

export async function storeConsent(userId: string, platform: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data } = await supabase
    .from('user_connectors')
    .select('metadata')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle();

  await supabase
    .from('user_connectors')
    .update({
      metadata: {
        ...((data?.metadata as Record<string, unknown>) || {}),
        tos_consented_at: new Date().toISOString(),
        tos_consented_platform: platform,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('platform', platform);
}

export function buildShopifyAdapter(shopName: string): OAuth2Adapter {
  const shop = shopName.replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*$/i, '').replace(/[^a-z0-9-]/gi, '');
  return new OAuth2Adapter({
    platform: 'shopify',
    authUrl: `https://${shop}.myshopify.com/admin/oauth/authorize`,
    tokenUrl: `https://${shop}.myshopify.com/admin/oauth/access_token`,
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    scopes: [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'read_inventory',
      'write_inventory',
      'read_analytics',
      'read_reports',
    ],
    pkce: false,
    redirectPath: '/api/connectors/oauth/callback',
  });
}
