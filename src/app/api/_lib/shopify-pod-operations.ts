import crypto from 'crypto';
import { ApiUserContext, cleanEnv, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { getCommercePlatformDefaults } from './platform-settings';
import {
  DIRECT_POD_PROVIDER_IDS,
  KNOWN_FULFILLMENT_PROVIDER_IDS,
  SHOPIFY_APP_PROVIDER_REGISTRY,
  getPodProvider
} from '@/next/lib/pod/pod-provider-registry';
import { shopifyApiVersion } from '@/next/lib/shopify/constants';
import { allowGlobalCommerceConnectors, globalConnectorWarning } from '@/next/lib/config/connectors';

export const SHOPIFY_POD_OPERATION_ACTION_TYPES = [
  'shopify_store_connect',
  'shopify_store_status',
  'shopify_product_create',
  'shopify_product_publish',
  'shopify_product_update',
  'shopify_product_archive',
  'fulfilment_provider_read',
  'pod_provider_connect',
  'design_create',
  'product_sync',
  'provider_product_status',
  'shopify_collection_create',
  'shopify_collection_assign',
  'shopify_inventory_read',
  'shopify_inventory_update',
  'shopify_orders_read',
  'shopify_order_summary',
  'aftership_connect',
  'aftership_tracking_read',
  'aftership_returns_read',
  'shopify_analytics_read',
  'shopify_bundles_read',
  'shopify_bundle_create',
  'marketplace_status_read'
] as const;

export type ShopifyPodOperationActionType = typeof SHOPIFY_POD_OPERATION_ACTION_TYPES[number];

type CommerceErrorResult = { error: Response | Error };
type CommerceBlockedResult = { blocked: string; status?: number; details?: Record<string, unknown> };
type ConnectorState = 'disconnected' | 'configured_unverified' | 'connected' | 'failed' | 'rate_limited';
type SyncStatus = 'prepared' | 'blocked_missing_credentials' | 'submitted' | 'synced' | 'failed' | 'rate_limited';

const SHOPIFY_API_VERSION = shopifyApiVersion();

const DIRECT_POD_PROVIDERS = DIRECT_POD_PROVIDER_IDS;
const SHOPIFY_APP_PROVIDERS = SHOPIFY_APP_PROVIDER_REGISTRY;
const KNOWN_FULFILLMENT_PROVIDERS = KNOWN_FULFILLMENT_PROVIDER_IDS;

export function isShopifyPodOperationAction(actionType: string): actionType is ShopifyPodOperationActionType {
  return SHOPIFY_POD_OPERATION_ACTION_TYPES.includes(actionType as ShopifyPodOperationActionType);
}

function text(value: unknown, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

function nullableText(value: unknown, max = 2000) {
  const normalized = text(value, max);
  return normalized || null;
}

function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

function stringArray(value: unknown, maxItems = 30) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return items.map(item => text(item, 120)).filter(Boolean).slice(0, maxItems);
}

function normalizeStoreUrl(value: unknown) {
  let store = text(value, 240).toLowerCase();
  if (!store) return null;
  store = store.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!store.endsWith('.myshopify.com')) store = `${store.replace(/\.myshopify\.com$/, '')}.myshopify.com`;
  return store;
}

function normalizeProvider(value: unknown) {
  const provider = text(value, 80).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return KNOWN_FULFILLMENT_PROVIDERS.includes(provider as any) ? provider : null;
}

function normalizeConnectorProvider(value: unknown) {
  const provider = text(value, 80).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return [...DIRECT_POD_PROVIDERS, 'aftership'].includes(provider as any) ? provider : null;
}

function normalizeStatus(value: unknown): 'draft' | 'active' | 'archived' {
  const status = text(value, 40).toLowerCase();
  return status === 'active' || status === 'archived' ? status : 'draft';
}

function maskSecret(secret: string) {
  if (!secret) return '';
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

function encryptionKey() {
  const raw = cleanEnv(process.env.CONNECTOR_ENCRYPTION_KEY, process.env.CUBIQO_CONNECTOR_KEY);
  return raw ? crypto.createHash('sha256').update(raw).digest() : null;
}

function encryptSecret(secret: string) {
  const key = encryptionKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return {
    secret_ciphertext: ciphertext.toString('base64'),
    secret_iv: iv.toString('base64'),
    secret_tag: cipher.getAuthTag().toString('base64'),
    secret_hint: maskSecret(secret)
  };
}

function decryptSecret(row: Record<string, any> | null | undefined) {
  const key = encryptionKey();
  if (!key || !row?.secret_ciphertext || !row?.secret_iv || !row?.secret_tag) return null;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(row.secret_iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.secret_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.secret_ciphertext, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

async function maybeMissingTable<T>(feature: string, table: string, result: { data: T; error: any }) {
  if (safeTableMissing(result.error)) return { error: missingMigrationResponse(feature, table) };
  if (result.error) return { error: new Error(result.error.message) };
  return { data: result.data };
}

function envShopifyCredentials() {
  const storeUrl = normalizeStoreUrl(cleanEnv(process.env.SHOPIFY_SHOP_DOMAIN, process.env.SHOPIFY_STORE_DOMAIN));
  const token = cleanEnv(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN, process.env.SHOPIFY_ACCESS_TOKEN);
  return { storeUrl, token };
}

async function resolveShopifyStore(auth: ApiUserContext, requestedStore?: unknown) {
  const requested = normalizeStoreUrl(requestedStore);
  if (requested) return { storeUrl: requested, source: 'payload' as const, settings: {} as Record<string, any> };

  const local = await auth.supabase
    .from('shopify_store_connections')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (safeTableMissing(local.error)) return { error: missingMigrationResponse('commerce-ops', 'shopify_store_connections') };
  if (local.error) return { error: new Error(local.error.message) };
  if (local.data?.store_url) {
    return {
      storeUrl: normalizeStoreUrl(local.data.store_url) || local.data.store_url,
      source: 'shopify_store_connections' as const,
      settings: local.data as Record<string, any>
    };
  }

  const oauth = await auth.supabase
    .from('store_connections')
    .select('shop_domain,metadata,default_product_tags,default_product_price,default_product_title')
    .eq('user_id', auth.user.id)
    .eq('platform', 'shopify')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!safeTableMissing(oauth.error) && !oauth.error && oauth.data?.shop_domain) {
    return {
      storeUrl: normalizeStoreUrl(oauth.data.shop_domain) || oauth.data.shop_domain,
      source: 'store_connections' as const,
      settings: {
        ...jsonObject(oauth.data.metadata),
        default_product_tags: oauth.data.default_product_tags,
        default_product_price: oauth.data.default_product_price,
        default_product_title: oauth.data.default_product_title
      }
    };
  }

  return {
    blocked: 'Connect a Shopify store before running this commerce action.',
    status: 409 as const,
    details: { requiredAction: 'connect_shopify_store' }
  };
}

function defaultProductTags(settings: Record<string, any>, payload: Record<string, unknown>) {
  const explicit = stringArray(payload.tags);
  if (explicit.length) return explicit;
  return stringArray(settings.default_product_tags || settings.defaultProductTags || settings.metadata?.default_product_tags);
}

function storeDefaultPrice(settings: Record<string, any>) {
  return text(settings.default_product_price || settings.defaultProductPrice || settings.metadata?.default_product_price, 40);
}

function envDirectProviderCredentials(provider: string) {
  const upper = provider.toUpperCase();
  const token = cleanEnv(
    process.env[`${upper}_API_KEY`],
    process.env[`${upper}_ACCESS_TOKEN`],
    provider === 'printify' ? process.env.PRINTIFY_API_KEY : undefined,
    provider === 'printful' ? process.env.PRINTFUL_API_KEY : undefined,
    provider === 'gelato' ? process.env.GELATO_API_KEY : undefined
  );
  const apiUrl = cleanEnv(process.env[`${upper}_API_URL`]);
  return { token, apiUrl };
}

async function readStoredSecret(auth: ApiUserContext, provider: string, storeUrl?: string) {
  let query = auth.supabase
    .from('commerce_connector_secrets')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('provider', provider)
    .order('created_at', { ascending: false })
    .limit(1);
  if (storeUrl) query = query.eq('store_url', storeUrl);
  const result = await query.maybeSingle();
  if (safeTableMissing(result.error)) return { missingTable: true as const };
  if (result.error) return { error: result.error as Error };
  return { secret: result.data as Record<string, any> | null };
}

async function getShopifyToken(auth: ApiUserContext, storeUrl: string) {
  const stored = await readStoredSecret(auth, 'shopify', storeUrl);
  if ('missingTable' in stored) return { missingTable: true as const };
  if ('error' in stored) return { error: stored.error };
  const token = decryptSecret(stored.secret);
  if (token) return { token, source: 'encrypted_secret' as const };

  const env = envShopifyCredentials();
  if (allowGlobalCommerceConnectors() && env.token && env.storeUrl === storeUrl) {
    console.warn(globalConnectorWarning('shopify'));
    return { token: env.token, source: 'server_env' as const };
  }
  return { token: null, source: 'none' as const };
}

async function getDirectProviderToken(auth: ApiUserContext, provider: string) {
  const env = envDirectProviderCredentials(provider);
  const registry = await readPodProviderConfig(auth, provider);
  const registryApiUrl = 'config' in registry ? text(registry.config?.api_url, 400) : '';
  const stored = await readStoredSecret(auth, provider);
  if ('missingTable' in stored) return { missingTable: true as const };
  if ('error' in stored) return { error: stored.error };
  const token = decryptSecret(stored.secret);
  if (token) {
    return { token, apiUrl: text(stored.secret?.metadata?.api_url, 400) || env.apiUrl || registryApiUrl, source: 'encrypted_secret' as const };
  }
  if (allowGlobalCommerceConnectors() && env.token) {
    console.warn(globalConnectorWarning(provider));
    return { token: env.token, apiUrl: env.apiUrl || registryApiUrl, source: 'server_env' as const };
  }
  return { token: null, apiUrl: env.apiUrl || registryApiUrl, source: 'none' as const };
}

async function readPodProviderConfig(auth: ApiUserContext, provider: string) {
  const { data, error } = await auth.supabase
    .from('pod_providers')
    .select('provider,label,status,connection_type,api_url,dashboard_url_template,shopify_app_url,supports_product_types,metadata')
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { config: null, tableMissing: true };
    return { error };
  }
  return { config: data || null, tableMissing: false };
}

async function readPodProviderConfigs(auth: ApiUserContext) {
  const { data, error } = await auth.supabase
    .from('pod_providers')
    .select('provider,label,status,connection_type,api_url,dashboard_url_template,shopify_app_url,supports_product_types,metadata');

  if (error) {
    if (safeTableMissing(error)) return { configs: [], tableMissing: true };
    return { error };
  }
  return { configs: data || [], tableMissing: false };
}

async function shopifyFetch(auth: ApiUserContext, storeUrl: string, path: string, init: RequestInit = {}) {
  const credentials = await getShopifyToken(auth, storeUrl);
  if ('missingTable' in credentials) return { missingTable: true as const };
  if ('error' in credentials) return { error: credentials.error };
  if (!credentials.token) return { blocked: 'Shopify credentials are missing server-side.', status: 409 as const };
  const response = await fetch(`https://${storeUrl}/admin/api/${SHOPIFY_API_VERSION}${path}`, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': credentials.token,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : {};
  if (response.status === 429) return { rateLimited: true as const, body, retryAfter: response.headers.get('retry-after') };
  if (!response.ok) return { error: new Error(body?.errors ? JSON.stringify(body.errors) : `Shopify request failed with ${response.status}`), body, status: response.status };
  return { body, source: credentials.source };
}

async function providerFetch(auth: ApiUserContext, provider: string, payload: Record<string, unknown>) {
  const credentials = await getDirectProviderToken(auth, provider);
  if ('missingTable' in credentials) return { missingTable: true as const };
  if ('error' in credentials) return { error: credentials.error };
  if (!credentials.token) return { blocked: `${provider} credentials are missing server-side.`, status: 409 as const };
  if (!credentials.apiUrl) return { blocked: `${provider} API URL is not configured server-side.`, status: 409 as const };
  const response = await fetch(credentials.apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : {};
  if (response.status === 429) return { rateLimited: true as const, body, retryAfter: response.headers.get('retry-after') };
  if (!response.ok) return { error: new Error(body?.error || body?.message || `${provider} request failed with ${response.status}`), body, status: response.status };
  return { body, source: credentials.source };
}

function connectorFromEnv(provider: string) {
  if (!allowGlobalCommerceConnectors()) {
    return { provider, state: 'disconnected' as ConnectorState, credentialStatus: 'global_env_disabled' };
  }
  if (provider === 'shopify') {
    const env = envShopifyCredentials();
    return env.token
      ? { provider, state: 'configured_unverified' as ConnectorState, credentialStatus: 'present_server_side_unverified', storeUrl: env.storeUrl }
      : { provider, state: 'disconnected' as ConnectorState, credentialStatus: 'missing', storeUrl: env.storeUrl };
  }
  const env = envDirectProviderCredentials(provider);
  return env.token
    ? { provider, state: 'configured_unverified' as ConnectorState, credentialStatus: 'present_server_side_unverified' }
    : { provider, state: 'disconnected' as ConnectorState, credentialStatus: 'missing' };
}

function mapConnector(row: Record<string, any> | null | undefined, fallback: ReturnType<typeof connectorFromEnv>) {
  if (!row) {
    return {
      ...fallback,
      connected: false,
      checkedAt: new Date().toISOString(),
      source: fallback.credentialStatus === 'missing' ? 'server_env_missing' : 'global_env_admin_only',
      note: fallback.credentialStatus === 'missing'
        ? `${fallback.provider} credentials are not configured server-side.`
        : `${fallback.provider} credentials exist server-side but have not been verified by a successful provider read.`
    };
  }
  return {
    provider: row.provider,
    state: row.status as ConnectorState,
    connected: row.status === 'connected',
    credentialStatus: row.secret_hint ? 'stored_server_side' : fallback.credentialStatus,
    secretHint: row.secret_hint || null,
    storeUrl: row.store_url || fallback.storeUrl || null,
    checkedAt: new Date().toISOString(),
    verifiedAt: row.verified_at || null,
    source: 'server_secret_store',
    note: row.status === 'connected' ? `${row.provider} verified server-side.` : `${row.provider} is not verified connected.`
  };
}

function mapShopifyProduct(row: Record<string, any>) {
  return {
    productId: row.product_id,
    shopifyId: row.shopify_id,
    title: row.title,
    description: row.description,
    seoDescription: row.seo_description,
    assetId: row.asset_id,
    fulfillmentProvider: row.fulfillment_provider,
    variants: row.variants || [],
    tags: row.tags || [],
    collections: row.collections || [],
    status: row.status,
    syncStatus: row.sync_status,
    providerProductId: row.provider_product_id,
    externalCallPerformed: Boolean(row.external_call_performed),
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at
  };
}

function seoFromProduct(title: string, description: string, provider: string, tags: string[]) {
  const tagCopy = tags.length ? ` Built around ${tags.slice(0, 4).join(', ')}.` : '';
  return `${title} is a premium POD product fulfilled through ${provider}. ${description}${tagCopy}`.replace(/\s+/g, ' ').slice(0, 320);
}

async function getReadyAsset(auth: ApiUserContext, assetId: string) {
  const result = await auth.supabase
    .from('gfx_assets')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('id', assetId)
    .maybeSingle();
  if (safeTableMissing(result.error)) return { error: missingMigrationResponse('commerce-ops', 'gfx_assets') };
  if (result.error) return { error: new Error(result.error.message) };
  if (!result.data) return { blocked: 'GFXTools asset was not found for this user.', status: 404 };
  if (result.data.status !== 'ready') return { blocked: 'Only ready GFXTools assets can enter Shopify/POD operations.', status: 400 };
  const variants = Array.isArray(result.data.platform_variants) ? result.data.platform_variants : [];
  if (!variants.length) return { blocked: 'Ready asset must include platform_variants before commerce handoff.', status: 400 };
  return { asset: result.data as Record<string, any> };
}

async function insertCommerceEvent(auth: ApiUserContext, payload: Record<string, unknown>) {
  await auth.supabase.from('commerce_events').insert({
    user_id: auth.user.id,
    ...payload
  });
}

export async function listCommerceState(auth: ApiUserContext): Promise<Record<string, unknown> | CommerceErrorResult> {
  const [
    shopifyConnections,
    secrets,
    providers,
    products,
    designs,
    syncs,
    collections,
    inventory,
    orderSummaries,
    analytics,
    bundles,
    marketplaces,
    events,
    aftershipConnections
  ] = await Promise.all([
    auth.supabase.from('shopify_store_connections').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    auth.supabase.from('commerce_connector_secrets').select('provider,connection_type,store_url,secret_hint,status,verified_at,metadata,created_at').eq('user_id', auth.user.id),
    auth.supabase.from('fulfillment_provider_statuses').select('*').eq('user_id', auth.user.id).order('provider'),
    auth.supabase.from('shopify_products').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('provider_designs').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('provider_product_syncs').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('shopify_collections').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('shopify_inventory_levels').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('shopify_order_summaries').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    auth.supabase.from('shopify_analytics_snapshots').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    auth.supabase.from('shopify_bundles').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(10),
    auth.supabase.from('marketplace_status_snapshots').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(5),
    auth.supabase.from('commerce_events').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('aftership_connections').select('id,status,secret_hint,verified_at,last_error,created_at,updated_at').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(3)
  ]);

  for (const result of [shopifyConnections, secrets, providers, products, designs, syncs, collections, inventory, orderSummaries, analytics, bundles, marketplaces, events, aftershipConnections]) {
    if (safeTableMissing(result.error)) return { error: missingMigrationResponse('commerce-ops', 'shopify_pod_operations') };
    if (result.error) return { error: new Error(result.error.message) };
  }

  const secretRows = (secrets.data || []) as Record<string, any>[];
  const secretByProvider = new Map<string, Record<string, any>>(secretRows.map(row => [row.provider, row]));

  return {
    shopifyStore: {
      selectedStoreUrl: (shopifyConnections.data || [])[0]?.store_url || null,
      connections: shopifyConnections.data || [],
      connector: mapConnector(secretByProvider.get('shopify'), connectorFromEnv('shopify'))
    },
    podConnectors: [
      mapConnector(secretByProvider.get('printify'), connectorFromEnv('printify')),
      mapConnector(secretByProvider.get('printful'), connectorFromEnv('printful')),
      mapConnector(secretByProvider.get('gelato'), connectorFromEnv('gelato'))
    ],
    aftership: {
      connector: mapConnector(secretByProvider.get('aftership'), connectorFromEnv('aftership')),
      connections: aftershipConnections.data || []
    },
    fulfillmentProviders: providers.data || buildProviderManifest([]),
    shopifyProducts: (products.data || []).map(mapShopifyProduct),
    providerDesigns: designs.data || [],
    providerProductSyncs: syncs.data || [],
    shopifyCollections: collections.data || [],
    shopifyInventory: inventory.data || [],
    shopifyOrderSummaries: orderSummaries.data || [],
    shopifyAnalytics: analytics.data || [],
    shopifyBundles: bundles.data || [],
    marketplaceStatuses: marketplaces.data || [],
    commerceEvents: events.data || []
  };
}

function buildProviderManifest(activeApps: string[], directOverrides: Record<string, string> = {}, providerConfigs: Record<string, any>[] = []) {
  const direct = DIRECT_POD_PROVIDERS.map(provider => {
    const env = connectorFromEnv(provider);
    const registry = getPodProvider(provider);
    const config = providerConfigs.find(item => item.provider === provider);
    return {
      provider,
      status: directOverrides[provider] || config?.status || (env.credentialStatus === 'missing' ? 'disconnected' : 'configured_unverified'),
      connection_type: 'direct_api',
      shopify_app_url: null,
      supports_product_types: config?.supports_product_types || registry?.supports || ['apparel', 'accessories', 'home', 'gift'],
      metadata: {
        credentialStatus: env.credentialStatus,
        apiUrlSource: config?.api_url ? 'pod_providers' : env.credentialStatus === 'missing' ? 'not_configured' : 'env_or_secret',
        dashboardUrlTemplate: config?.dashboard_url_template || registry?.dashboardUrlTemplate || null
      }
    };
  });
  const apps = SHOPIFY_APP_PROVIDERS.map(item => ({
    provider: item.provider,
    status: providerConfigs.find(config => config.provider === item.provider)?.status || (activeApps.includes(item.provider) ? 'active' : 'not_installed'),
    connection_type: 'shopify_app',
    shopify_app_url: providerConfigs.find(config => config.provider === item.provider)?.shopify_app_url || item.appUrl,
    supports_product_types: providerConfigs.find(config => config.provider === item.provider)?.supports_product_types || [...item.supports],
    metadata: {
      label: providerConfigs.find(config => config.provider === item.provider)?.label || item.label,
      routing: 'Shopify app handles fulfilment mapping; no direct API call from CubiQo.'
    }
  }));
  return [...direct, ...apps];
}

export async function readFulfilmentProviders(auth: ApiUserContext): Promise<Record<string, unknown> | CommerceErrorResult> {
  const resolved = await resolveShopifyStore(auth);
  if ('error' in resolved || 'blocked' in resolved) return resolved;
  const storeUrl = resolved.storeUrl;
  const current = await auth.supabase
    .from('fulfillment_provider_statuses')
    .select('*')
    .eq('user_id', auth.user.id);
  if (safeTableMissing(current.error)) return { error: missingMigrationResponse('commerce-ops', 'fulfillment_provider_statuses') };
  if (current.error) return { error: new Error(current.error.message) };

  const activeApps = new Set<string>(((current.data || []) as Record<string, any>[])
    .filter((row: Record<string, any>) => row.connection_type === 'shopify_app' && row.status === 'active')
    .map((row: Record<string, any>) => row.provider));
  const providerConfigs = await readPodProviderConfigs(auth);
  if ('error' in providerConfigs && providerConfigs.error) return { error: providerConfigs.error };
  const manifest = buildProviderManifest([...activeApps], {}, providerConfigs.configs || []);

  const rows = manifest.map(item => ({
    user_id: auth.user.id,
    provider: item.provider,
    status: item.status,
    connection_type: item.connection_type,
    shopify_app_url: item.shopify_app_url,
    supports_product_types: item.supports_product_types,
    metadata: item.metadata,
    checked_at: new Date().toISOString()
  }));
  const upsert = await auth.supabase
    .from('fulfillment_provider_statuses')
    .upsert(rows, { onConflict: 'user_id,provider' })
    .select('*');
  if (safeTableMissing(upsert.error)) return { error: missingMigrationResponse('commerce-ops', 'fulfillment_provider_statuses') };
  if (upsert.error) return { error: new Error(upsert.error.message) };
  return { storeUrl, providers: upsert.data || rows, performedExternalAction: false };
}

export async function connectShopifyStore(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: 'shopify_store_connect requires an approval preview card.', status: 400 };
  const storeUrl = normalizeStoreUrl(payload.storeUrl || payload.store_url);
  if (!storeUrl) return { blocked: 'Shopify store URL is required. Use yourstore.myshopify.com.', status: 400 };
  const apiKey = text(payload.apiKey || payload.api_key || payload.privateAppApiKey || payload.private_app_api_key, 2400);
  if (!apiKey) return { blocked: 'Shopify private app API key is required and must be sent only to the server action boundary.', status: 400 };
  const encrypted = encryptSecret(apiKey);
  if (!encrypted) {
    return {
      blocked: 'Connector encryption key is missing server-side, so CubiQo refused to store the Shopify key.',
      status: 500,
      details: { requiredEnv: 'CONNECTOR_ENCRYPTION_KEY' }
    };
  }

  const validation = await fetch(`https://${storeUrl}/admin/api/${SHOPIFY_API_VERSION}/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': apiKey,
      'Content-Type': 'application/json'
    }
  }).catch(error => ({ error }) as any);

  let status: ConnectorState = 'configured_unverified';
  let plan: string | null = null;
  let shopifyShopId: string | null = null;
  let lastError: string | null = null;
  if ('error' in validation) {
    status = 'failed';
    lastError = validation.error instanceof Error ? validation.error.message : 'Shopify validation failed';
  } else if (validation.status === 429) {
    status = 'rate_limited';
    lastError = 'Shopify validation rate limited.';
  } else if (validation.ok) {
    const body = await validation.json().catch(() => ({}));
    status = 'connected';
    plan = body?.shop?.plan_name || null;
    shopifyShopId = body?.shop?.id ? String(body.shop.id) : null;
  } else {
    status = 'failed';
    lastError = `Shopify validation failed with ${validation.status}`;
  }

  const secretResult = await auth.supabase
    .from('commerce_connector_secrets')
    .insert({
      user_id: auth.user.id,
      provider: 'shopify',
      connection_type: 'direct_api',
      store_url: storeUrl,
      ...encrypted,
      status,
      metadata: { shopifyApiVersion: SHOPIFY_API_VERSION, validation: status },
      verified_at: status === 'connected' ? new Date().toISOString() : null
    })
    .select('provider,store_url,secret_hint,status,verified_at')
    .maybeSingle();
  const checkedSecret = await maybeMissingTable('commerce-ops', 'commerce_connector_secrets', secretResult);
  if ('error' in checkedSecret) return checkedSecret;

  const connectionResult = await auth.supabase
    .from('shopify_store_connections')
    .upsert({
      user_id: auth.user.id,
      approval_id: approvalId,
      store_url: storeUrl,
      status,
      plan,
      product_counts: { active: 0, draft: 0, archived: 0 },
      shopify_shop_id: shopifyShopId,
      last_error: lastError,
      verified_at: status === 'connected' ? new Date().toISOString() : null
    }, { onConflict: 'user_id,store_url' })
    .select('*')
    .maybeSingle();
  const checkedConnection = await maybeMissingTable('commerce-ops', 'shopify_store_connections', connectionResult);
  if ('error' in checkedConnection) return checkedConnection;

  return {
    connection: checkedConnection.data,
    connector: checkedSecret.data,
    previewCard,
    performedExternalAction: status === 'connected',
    validationStatus: status,
    lastError
  };
}

export async function readShopifyStoreStatus(auth: ApiUserContext): Promise<Record<string, unknown> | CommerceErrorResult> {
  const resolved = await resolveShopifyStore(auth);
  if ('error' in resolved || 'blocked' in resolved) return resolved;
  const storeUrl = resolved.storeUrl;
  const local = await auth.supabase
    .from('shopify_store_connections')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('store_url', storeUrl)
    .maybeSingle();
  if (safeTableMissing(local.error)) return { error: missingMigrationResponse('commerce-ops', 'shopify_store_connections') };
  if (local.error) return { error: new Error(local.error.message) };

  const shop = await shopifyFetch(auth, storeUrl, '/shop.json');
  if ('missingTable' in shop) return { error: missingMigrationResponse('commerce-ops', 'commerce_connector_secrets') };
  if ('blocked' in shop) {
    return {
      storeUrl,
      state: local.data?.status || 'disconnected',
      connected: false,
      productCounts: local.data?.product_counts || { active: 0, draft: 0, archived: 0 },
      plan: local.data?.plan || null,
      note: shop.blocked,
      performedExternalAction: false
    };
  }
  if ('rateLimited' in shop) {
    return { storeUrl, state: 'rate_limited', connected: false, productCounts: local.data?.product_counts || {}, performedExternalAction: false, retryAfter: shop.retryAfter };
  }
  if ('error' in shop) {
    return { storeUrl, state: 'failed', connected: false, productCounts: local.data?.product_counts || {}, error: shop.error?.message || 'Shopify status read failed', performedExternalAction: false };
  }

  const [active, draft, archived] = await Promise.all([
    shopifyFetch(auth, storeUrl, '/products/count.json?status=active'),
    shopifyFetch(auth, storeUrl, '/products/count.json?status=draft'),
    shopifyFetch(auth, storeUrl, '/products/count.json?status=archived')
  ]);
  const counts = {
    active: 'body' in active ? Number(active.body?.count || 0) : 0,
    draft: 'body' in draft ? Number(draft.body?.count || 0) : 0,
    archived: 'body' in archived ? Number(archived.body?.count || 0) : 0
  };
  await auth.supabase
    .from('shopify_store_connections')
    .upsert({
      user_id: auth.user.id,
      store_url: storeUrl,
      status: 'connected',
      plan: shop.body?.shop?.plan_name || null,
      product_counts: counts,
      shopify_shop_id: shop.body?.shop?.id ? String(shop.body.shop.id) : null,
      verified_at: new Date().toISOString()
    }, { onConflict: 'user_id,store_url' });
  return { storeUrl, state: 'connected', connected: true, plan: shop.body?.shop?.plan_name || null, productCounts: counts, performedExternalAction: false };
}

export async function connectDirectProvider(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: 'pod_provider_connect requires an approval preview card.', status: 400 };
  const provider = normalizeConnectorProvider(payload.provider);
  if (!provider) return { blocked: 'Select a supported direct connector: Printify, Printful, Gelato, or AfterShip.', status: 400 };
  if (!DIRECT_POD_PROVIDERS.includes(provider as any) && provider !== 'aftership') {
    return { blocked: 'Only Printify, Printful, Gelato, and AfterShip use direct credential connectors in V2.', status: 400 };
  }
  const apiKey = text(payload.apiKey || payload.api_key || payload.accessToken || payload.access_token, 2400);
  if (!apiKey) return { blocked: `${provider} API key is required.`, status: 400 };
  const encrypted = encryptSecret(apiKey);
  if (!encrypted) {
    return { blocked: 'Connector encryption key is missing server-side, so CubiQo refused to store the API key.', status: 500, details: { requiredEnv: 'CONNECTOR_ENCRYPTION_KEY' } };
  }
  const apiUrl = nullableText(payload.apiUrl || payload.api_url, 500);
  const result = await auth.supabase
    .from('commerce_connector_secrets')
    .insert({
      user_id: auth.user.id,
      provider,
      connection_type: 'direct_api',
      store_url: null,
      ...encrypted,
      status: 'configured_unverified',
      metadata: { api_url: apiUrl, approvalId },
      verified_at: null
    })
    .select('provider,connection_type,secret_hint,status,verified_at,metadata')
    .maybeSingle();
  const checked = await maybeMissingTable('commerce-ops', 'commerce_connector_secrets', result);
  if ('error' in checked) return checked;
  return { connector: checked.data, previewCard, performedExternalAction: false };
}

export async function createShopifyProduct(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: 'shopify_product_create requires a full approval preview card.', status: 400 };
  const assetId = text(payload.assetId || payload.asset_id, 80);
  const assetResult = await getReadyAsset(auth, assetId);
  if ('error' in assetResult || 'blocked' in assetResult) return assetResult;
  const provider = normalizeProvider(payload.fulfillmentProvider || payload.fulfillment_provider);
  if (!provider) return { blocked: 'Select a supported fulfillment provider before creating a Shopify product.', status: 400 };
  const resolved = await resolveShopifyStore(auth, payload.storeUrl || payload.store_url);
  if ('error' in resolved || 'blocked' in resolved) return resolved;
  const platformDefaults = await getCommercePlatformDefaults(auth);
  const settings = resolved.settings as Record<string, any>;
  const title = text(payload.title, 240) || text(settings.default_product_title || settings.defaultProductTitle, 240) || platformDefaults.productTitle;
  const description = text(payload.description, 5000);
  const tags = defaultProductTags(settings, payload).length
    ? defaultProductTags(settings, payload)
    : platformDefaults.productTags;
  const defaultPrice = text(payload.price, 40) || storeDefaultPrice(settings) || platformDefaults.productPrice || '';
  const variants = Array.isArray(payload.variants)
    ? payload.variants
    : defaultPrice ? [{ title: 'Default', price: defaultPrice }] : [];
  const collections = stringArray(payload.collections);
  const storeUrl = resolved.storeUrl;
  const productPayload = {
    product: {
      title,
      body_html: description,
      status: 'draft',
      tags: tags.join(', '),
      images: assetResult.asset.asset_url ? [{ src: assetResult.asset.asset_url }] : [],
      variants: variants.map((variant: any) => ({
        title: text(variant.title, 120) || 'Default',
        price: Number(variant.price || 0).toFixed(2),
        sku: text(variant.sku, 120),
        inventory_quantity: Number(variant.inventory_quantity || 0)
      }))
    }
  };

  let syncStatus: SyncStatus = 'blocked_missing_credentials';
  let shopifyId: string | null = null;
  let externalCallPerformed = false;
  let lastError: string | null = null;
  const createResult = await shopifyFetch(auth, storeUrl, '/products.json', {
    method: 'POST',
    body: JSON.stringify(productPayload)
  });
  if ('missingTable' in createResult) return { error: missingMigrationResponse('commerce-ops', 'commerce_connector_secrets') };
  if ('blocked' in createResult) {
    lastError = createResult.blocked || 'Shopify credentials are missing server-side.';
  } else if ('rateLimited' in createResult) {
    syncStatus = 'rate_limited';
    lastError = 'Shopify product creation was rate limited; queued status recorded.';
  } else if ('error' in createResult) {
    syncStatus = 'failed';
    lastError = createResult.error?.message || 'Shopify product creation failed';
  } else {
    syncStatus = 'submitted';
    externalCallPerformed = true;
    shopifyId = createResult.body?.product?.id ? String(createResult.body.product.id) : null;
  }

  const insert = await auth.supabase
    .from('shopify_products')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      shopify_id: shopifyId,
      title,
      description,
      seo_description: seoFromProduct(title, description, provider, tags),
      asset_id: assetId,
      fulfillment_provider: provider,
      variants,
      tags,
      collections,
      status: 'draft',
      sync_status: syncStatus,
      product_payload: productPayload,
      external_call_performed: externalCallPerformed,
      last_error: lastError
    })
    .select('*')
    .maybeSingle();
  const checked = await maybeMissingTable('commerce-ops', 'shopify_products', insert);
  if ('error' in checked) return checked;

  return { product: mapShopifyProduct(checked.data as Record<string, any>), previewCard, provider, externalCallPerformed, lastError };
}

export async function mutateShopifyProduct(
  auth: ApiUserContext,
  approvalId: string,
  actionType: 'shopify_product_publish' | 'shopify_product_update' | 'shopify_product_archive',
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: `${actionType} requires a diff/approval preview card.`, status: 400 };
  const productId = text(payload.productId || payload.product_id, 80);
  const existing = await auth.supabase
    .from('shopify_products')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('product_id', productId)
    .maybeSingle();
  if (safeTableMissing(existing.error)) return { error: missingMigrationResponse('commerce-ops', 'shopify_products') };
  if (existing.error) return { error: new Error(existing.error.message) };
  if (!existing.data) return { blocked: 'Shopify product record was not found for this user.', status: 404 };
  const row = existing.data as Record<string, any>;
  const nextStatus = actionType === 'shopify_product_publish' ? 'active' : actionType === 'shopify_product_archive' ? 'archived' : normalizeStatus(payload.status || row.status);
  const updates: Record<string, unknown> = {
    approval_id: approvalId,
    title: text(payload.title, 240) || row.title,
    description: text(payload.description, 5000) || row.description,
    tags: stringArray(payload.tags).length ? stringArray(payload.tags) : row.tags,
    collections: stringArray(payload.collections).length ? stringArray(payload.collections) : row.collections,
    status: nextStatus,
    published_at: nextStatus === 'active' ? (row.published_at || new Date().toISOString()) : row.published_at,
    sync_status: row.shopify_id ? 'submitted' : 'blocked_missing_credentials',
    last_error: row.shopify_id ? null : 'No verified Shopify product id exists, so only the local approved state changed.',
    external_call_performed: false
  };
  if (actionType === 'shopify_product_archive') updates.last_error = 'Archived locally; irreversible Shopify archive requires connected Shopify id.';

  const update = await auth.supabase
    .from('shopify_products')
    .update(updates)
    .eq('user_id', auth.user.id)
    .eq('product_id', productId)
    .select('*')
    .maybeSingle();
  const checked = await maybeMissingTable('commerce-ops', 'shopify_products', update);
  if ('error' in checked) return checked;
  if (nextStatus === 'active') {
    await insertCommerceEvent(auth, {
      event_type: 'product_published',
      product_id: productId,
      asset_id: row.asset_id,
      provider: row.fulfillment_provider,
      approval_id: approvalId,
      payload: { shopifyProductId: row.shopify_id, localProductId: productId }
    });
  }
  return { product: mapShopifyProduct(checked.data as Record<string, any>), previewCard, externalCallPerformed: false };
}

export async function createProviderDesign(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: 'design_create requires an approval preview card.', status: 400 };
  const provider = normalizeProvider(payload.provider);
  if (!provider) return { blocked: 'Select a supported direct POD provider before submitting a design.', status: 400 };
  if (!DIRECT_POD_PROVIDERS.includes(provider as any)) return { blocked: `${provider} is a Shopify-app provider in V2; CubiQo does not call it directly.`, status: 400 };
  const assetId = text(payload.assetId || payload.asset_id, 80);
  const assetResult = await getReadyAsset(auth, assetId);
  if ('error' in assetResult || 'blocked' in assetResult) return assetResult;
  const designPayload = {
    provider,
    asset_id: assetId,
    asset_url: assetResult.asset.asset_url,
    platform_variants: assetResult.asset.platform_variants || [],
    product_type: text(payload.productType || payload.product_type, 120),
    template_id: nullableText(payload.templateId || payload.template_id, 160)
  };
  let status: SyncStatus = 'blocked_missing_credentials';
  let providerProductId: string | null = null;
  let externalCallPerformed = false;
  let lastError: string | null = null;
  const submitted = await providerFetch(auth, provider, designPayload);
  if ('missingTable' in submitted) return { error: missingMigrationResponse('commerce-ops', 'commerce_connector_secrets') };
  if ('blocked' in submitted) {
    lastError = submitted.blocked || `${provider} credentials are missing server-side.`;
  } else if ('rateLimited' in submitted) {
    status = 'rate_limited';
    lastError = `${provider} design submission was rate limited.`;
  } else if ('error' in submitted) {
    status = 'failed';
    lastError = submitted.error?.message || `${provider} design submission failed`;
  } else {
    status = 'submitted';
    externalCallPerformed = true;
    providerProductId = submitted.body?.id || submitted.body?.product_id || submitted.body?.job_id || null;
  }
  const insert = await auth.supabase
    .from('provider_designs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      asset_id: assetId,
      provider,
      provider_product_id: providerProductId,
      status,
      design_payload: designPayload,
      preview_card: previewCard,
      external_call_performed: externalCallPerformed,
      last_error: lastError
    })
    .select('*')
    .maybeSingle();
  const checked = await maybeMissingTable('commerce-ops', 'provider_designs', insert);
  if ('error' in checked) return checked;
  if (providerProductId) {
    await insertCommerceEvent(auth, {
      event_type: 'design_ready',
      asset_id: assetId,
      provider,
      approval_id: approvalId,
      payload: { providerProductId }
    });
  }
  return { design: checked.data, previewCard, externalCallPerformed, lastError };
}

export async function syncProviderProduct(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
): Promise<Record<string, unknown> | CommerceBlockedResult | CommerceErrorResult> {
  if (!previewCard) return { blocked: 'product_sync requires an approval preview card.', status: 400 };
  const providerDesignId = text(payload.providerDesignId || payload.provider_design_id, 80);
  const productId = text(payload.productId || payload.product_id, 80);
  const design = await auth.supabase.from('provider_designs').select('*').eq('user_id', auth.user.id).eq('id', providerDesignId).maybeSingle();
  if (safeTableMissing(design.error)) return { error: missingMigrationResponse('commerce-ops', 'provider_designs') };
  if (design.error) return { error: new Error(design.error.message) };
  if (!design.data) return { blocked: 'Provider design was not found for this user.', status: 404 };
  const insert = await auth.supabase
    .from('provider_product_syncs')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      provider_design_id: providerDesignId,
      shopify_product_id: productId || null,
      provider: design.data.provider,
      status: design.data.provider_product_id ? 'prepared' : 'blocked_missing_credentials',
      sync_payload: { productId, providerProductId: design.data.provider_product_id, previewCard },
      external_call_performed: false,
      last_error: design.data.provider_product_id ? null : 'Provider product id is missing; sync cannot call Shopify yet.'
    })
    .select('*')
    .maybeSingle();
  const checked = await maybeMissingTable('commerce-ops', 'provider_product_syncs', insert);
  if ('error' in checked) return checked;
  return { sync: checked.data, previewCard, externalCallPerformed: false };
}

export async function readProviderProductStatus(auth: ApiUserContext): Promise<Record<string, unknown> | CommerceErrorResult> {
  const result = await auth.supabase
    .from('provider_designs')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (safeTableMissing(result.error)) return { error: missingMigrationResponse('commerce-ops', 'provider_designs') };
  if (result.error) return { error: new Error(result.error.message) };
  return { providerDesigns: result.data || [], performedExternalAction: false };
}

export async function createShopifyCollection(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
) {
  if (!previewCard) return { blocked: 'shopify_collection_create requires an approval preview card.', status: 400 };
  const platformDefaults = await getCommercePlatformDefaults(auth);
  const insert = await auth.supabase
    .from('shopify_collections')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      title: text(payload.title, 240) || platformDefaults.collectionTitle,
      collection_type: text(payload.collectionType || payload.collection_type, 40) === 'smart' ? 'smart' : 'manual',
      rules: jsonObject(payload.rules),
      status: 'prepared',
      external_call_performed: false
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_collections', insert);
}

export async function assignShopifyCollection(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
) {
  if (!previewCard) return { blocked: 'shopify_collection_assign requires an approval preview card.', status: 400 };
  const insert = await auth.supabase
    .from('shopify_collection_assignments')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      collection_id: text(payload.collectionId || payload.collection_id, 80),
      product_id: text(payload.productId || payload.product_id, 80),
      status: 'prepared',
      external_call_performed: false
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_collection_assignments', insert);
}

export async function readInventory(auth: ApiUserContext) {
  const result = await auth.supabase.from('shopify_inventory_levels').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50);
  return maybeMissingTable('commerce-ops', 'shopify_inventory_levels', result);
}

export async function updateInventory(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
) {
  if (!previewCard) return { blocked: 'shopify_inventory_update requires before/after approval preview card.', status: 400 };
  const insert = await auth.supabase
    .from('shopify_inventory_adjustments')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      product_id: nullableText(payload.productId || payload.product_id, 80),
      variant_id: nullableText(payload.variantId || payload.variant_id, 120),
      before_quantity: Number(payload.beforeQuantity ?? payload.before_quantity ?? 0),
      after_quantity: Number(payload.afterQuantity ?? payload.after_quantity ?? 0),
      status: 'prepared',
      external_call_performed: false
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_inventory_adjustments', insert);
}

export async function readOrderSummary(auth: ApiUserContext, payload: Record<string, unknown> = {}) {
  const productResult = await auth.supabase.from('shopify_products').select('title,status,variants').eq('user_id', auth.user.id);
  if (safeTableMissing(productResult.error)) return { error: missingMigrationResponse('commerce-ops', 'shopify_products') };
  if (productResult.error) return { error: new Error(productResult.error.message) };
  const products = productResult.data || [];
  const snapshot = {
    user_id: auth.user.id,
    date_range: jsonObject(payload.dateRange || payload.date_range),
    open_count: 0,
    fulfilled_count: 0,
    cancelled_count: 0,
    revenue: 0,
    fulfilment_rate: 0,
    top_products: products.slice(0, 5).map((product: Record<string, any>) => ({ title: product.title, status: product.status })),
    source: 'local_aggregate_no_customer_pii'
  };
  const insert = await auth.supabase.from('shopify_order_summaries').insert(snapshot).select('*').maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_order_summaries', insert);
}

export async function connectAfterShip(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
) {
  const result = await connectDirectProvider(auth, approvalId, { ...payload, provider: 'aftership' }, previewCard);
  if ('blocked' in result || 'error' in result) return result;
  const insert = await auth.supabase
    .from('aftership_connections')
    .upsert({
      user_id: auth.user.id,
      approval_id: approvalId,
      status: 'configured_unverified',
      secret_hint: (result.connector as Record<string, any>)?.secret_hint || null
    }, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'aftership_connections', insert);
}

export async function readAfterShipTracking(auth: ApiUserContext) {
  const insert = await auth.supabase
    .from('aftership_tracking_snapshots')
    .insert({ user_id: auth.user.id, shipment_count: 0, statuses: [], source: 'aftership_disconnected_or_read_only' })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'aftership_tracking_snapshots', insert);
}

export async function readAfterShipReturns(auth: ApiUserContext) {
  const insert = await auth.supabase
    .from('aftership_return_snapshots')
    .insert({ user_id: auth.user.id, open_return_count: 0, statuses: [], source: 'aftership_disconnected_or_read_only' })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'aftership_return_snapshots', insert);
}

export async function readAnalytics(auth: ApiUserContext, payload: Record<string, unknown> = {}) {
  const summary = await readOrderSummary(auth, payload);
  if ('error' in summary) return summary;
  const insert = await auth.supabase
    .from('shopify_analytics_snapshots')
    .insert({
      user_id: auth.user.id,
      date_range: jsonObject(payload.dateRange || payload.date_range),
      revenue: 0,
      sessions: 0,
      conversion_rate: 0,
      top_products: (summary.data as Record<string, any>)?.top_products || [],
      source: 'aggregate_only_no_customer_pii'
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_analytics_snapshots', insert);
}

export async function readBundles(auth: ApiUserContext) {
  const result = await auth.supabase.from('shopify_bundles').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
  return maybeMissingTable('commerce-ops', 'shopify_bundles', result);
}

export async function createBundle(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>,
  previewCard: Record<string, unknown> | null
) {
  if (!previewCard) return { blocked: 'shopify_bundle_create requires bundle contents and pricing preview.', status: 400 };
  const platformDefaults = await getCommercePlatformDefaults(auth);
  const insert = await auth.supabase
    .from('shopify_bundles')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      title: text(payload.title, 240) || platformDefaults.bundleTitle,
      product_ids: stringArray(payload.productIds || payload.product_ids, 20),
      pricing: jsonObject(payload.pricing),
      status: 'prepared',
      external_call_performed: false
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'shopify_bundles', insert);
}

export async function readMarketplaceStatus(auth: ApiUserContext) {
  const insert = await auth.supabase
    .from('marketplace_status_snapshots')
    .insert({
      user_id: auth.user.id,
      marketplaces: [
        { marketplace: 'amazon', status: 'unknown', source: 'Marketplace Connect app read-only status not verified' },
        { marketplace: 'ebay', status: 'unknown', source: 'Marketplace Connect app read-only status not verified' },
        { marketplace: 'walmart', status: 'unknown', source: 'Marketplace Connect app read-only status not verified' }
      ],
      source: 'shopify_marketplace_connect_read_only'
    })
    .select('*')
    .maybeSingle();
  return maybeMissingTable('commerce-ops', 'marketplace_status_snapshots', insert);
}
