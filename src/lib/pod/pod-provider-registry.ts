export type PodConnectionType = 'direct_api' | 'shopify_app' | 'manual';

export type PodProviderRegistryEntry = {
  provider: string;
  label: string;
  connectionType: PodConnectionType;
  apiUrl?: string;
  dashboardUrlTemplate?: string;
  shopifyAppUrl?: string;
  supports: string[];
};

export const POD_PROVIDER_REGISTRY: readonly PodProviderRegistryEntry[] = [
  {
    provider: 'printify',
    label: 'Printify',
    connectionType: 'direct_api',
    apiUrl: 'https://api.printify.com/v1',
    dashboardUrlTemplate: 'https://printify.com/app/products/{provider_product_id}',
    supports: ['apparel', 'home', 'accessories']
  },
  {
    provider: 'printful',
    label: 'Printful',
    connectionType: 'direct_api',
    apiUrl: 'https://api.printful.com',
    dashboardUrlTemplate: 'https://www.printful.com/dashboard/default/products/{provider_product_id}',
    supports: ['apparel', 'home', 'accessories']
  },
  {
    provider: 'gelato',
    label: 'Gelato',
    connectionType: 'direct_api',
    apiUrl: 'https://api.gelato.com/v4',
    dashboardUrlTemplate: 'https://dashboard.gelato.com/products/{provider_product_id}',
    supports: ['apparel', 'paper', 'wall-art']
  },
  { provider: 'apliiq', label: 'Apliiq', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/apliiq', supports: ['apparel', 'hoodie', 'shirt', 'hat'] },
  { provider: 'customcat', label: 'CustomCat', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/customcat-fulfillment', supports: ['apparel', 'drinkware', 'home'] },
  { provider: 'teelaunch', label: 'Teelaunch', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/teelaunch-1', supports: ['apparel', 'home', 'accessories'] },
  { provider: 'shineon', label: 'ShineOn', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/shineon', supports: ['jewelry', 'gift'] },
  { provider: 'spreadconnect', label: 'Spreadconnect', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/spreadconnect', supports: ['apparel', 'accessories'] },
  { provider: 'only_caps', label: 'Only Caps', connectionType: 'shopify_app', shopifyAppUrl: 'https://apps.shopify.com/only-caps', supports: ['hat', 'cap'] },
  { provider: 'cjdropshipping', label: 'CJdropshipping', connectionType: 'manual', supports: ['dropshipping'] },
  { provider: 'zendrop', label: 'Zendrop', connectionType: 'manual', supports: ['dropshipping'] }
] as const;

export const DIRECT_POD_PROVIDER_IDS = POD_PROVIDER_REGISTRY
  .filter(item => item.connectionType === 'direct_api')
  .map(item => item.provider);

export const SHOPIFY_APP_PROVIDER_REGISTRY = POD_PROVIDER_REGISTRY
  .filter(item => item.connectionType === 'shopify_app')
  .map(item => ({
    provider: item.provider,
    label: item.label,
    appUrl: item.shopifyAppUrl || '',
    supports: item.supports
  }));

export const KNOWN_FULFILLMENT_PROVIDER_IDS = POD_PROVIDER_REGISTRY.map(item => item.provider);

export function normalizePodProviderId(value: unknown) {
  const provider = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return KNOWN_FULFILLMENT_PROVIDER_IDS.includes(provider) ? provider : null;
}

export function getPodProvider(provider: string | null | undefined) {
  const id = normalizePodProviderId(provider);
  return id ? POD_PROVIDER_REGISTRY.find(item => item.provider === id) || null : null;
}
