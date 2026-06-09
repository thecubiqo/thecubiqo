export type PodConnectionType = 'direct_api' | 'shopify_app' | 'manual';

export type PodProviderRegistryEntry = {
  id: string;
  provider: string;
  label: string;
  integrationType: PodConnectionType;
  connectionType: PodConnectionType;
  supportsAutomation: boolean;
  apiUrl?: string;
  dashboardUrlTemplate?: string;
  shopifyAppUrl?: string;
  supports: string[];
};

export const POD_PROVIDER_REGISTRY: readonly PodProviderRegistryEntry[] = [
  {
    id: 'printify',
    provider: 'printify',
    label: 'Printify',
    integrationType: 'direct_api',
    connectionType: 'direct_api',
    supportsAutomation: true,
    apiUrl: 'https://api.printify.com/v1',
    dashboardUrlTemplate: 'https://printify.com/app/products/{provider_product_id}',
    supports: ['apparel', 'home', 'accessories']
  },
  {
    id: 'printful',
    provider: 'printful',
    label: 'Printful',
    integrationType: 'direct_api',
    connectionType: 'direct_api',
    supportsAutomation: true,
    apiUrl: 'https://api.printful.com',
    dashboardUrlTemplate: 'https://www.printful.com/dashboard/default/products/{provider_product_id}',
    supports: ['apparel', 'home', 'accessories']
  },
  {
    id: 'gelato',
    provider: 'gelato',
    label: 'Gelato',
    integrationType: 'direct_api',
    connectionType: 'direct_api',
    supportsAutomation: true,
    apiUrl: 'https://api.gelato.com/v4',
    dashboardUrlTemplate: 'https://dashboard.gelato.com/products/{provider_product_id}',
    supports: ['apparel', 'paper', 'wall-art']
  },
  { id: 'apliiq', provider: 'apliiq', label: 'Apliiq', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/apliiq', supports: ['apparel', 'hoodie', 'shirt', 'hat'] },
  { id: 'customcat', provider: 'customcat', label: 'CustomCat', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/customcat-fulfillment', supports: ['apparel', 'drinkware', 'home'] },
  { id: 'teelaunch', provider: 'teelaunch', label: 'Teelaunch', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/teelaunch-1', supports: ['apparel', 'home', 'accessories'] },
  { id: 'shineon', provider: 'shineon', label: 'ShineOn', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/shineon', supports: ['jewelry', 'gift'] },
  { id: 'spreadconnect', provider: 'spreadconnect', label: 'Spreadconnect', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/spreadconnect', supports: ['apparel', 'accessories'] },
  { id: 'only_caps', provider: 'only_caps', label: 'Only Caps', integrationType: 'shopify_app', connectionType: 'shopify_app', supportsAutomation: false, shopifyAppUrl: 'https://apps.shopify.com/only-caps', supports: ['hat', 'cap'] },
  { id: 'cjdropshipping', provider: 'cjdropshipping', label: 'CJdropshipping', integrationType: 'manual', connectionType: 'manual', supportsAutomation: false, supports: ['dropshipping'] },
  { id: 'zendrop', provider: 'zendrop', label: 'Zendrop', integrationType: 'manual', connectionType: 'manual', supportsAutomation: false, supports: ['dropshipping'] }
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
