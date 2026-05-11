import { ApiUserContext, safeTableMissing } from './supabase-admin';

export type CommercePlatformDefaults = {
  productTitle: string;
  collectionTitle: string;
  bundleTitle: string;
  productTags: string[];
  productPrice: string | null;
};

const NEUTRAL_COMMERCE_DEFAULTS: CommercePlatformDefaults = {
  productTitle: 'New Product',
  collectionTitle: 'New Collection',
  bundleTitle: 'New Bundle',
  productTags: [],
  productPrice: null
};

function text(value: unknown, max = 240) {
  return String(value || '').trim().slice(0, max);
}

function stringArray(value: unknown, maxItems = 30) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return items.map(item => text(item, 120)).filter(Boolean).slice(0, maxItems);
}

function jsonObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};
}

export async function getCommercePlatformDefaults(auth: ApiUserContext): Promise<CommercePlatformDefaults> {
  const { data, error } = await auth.supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'commerce_defaults')
    .maybeSingle();

  if (error && !safeTableMissing(error)) return NEUTRAL_COMMERCE_DEFAULTS;
  const value = jsonObject(data?.value);
  return {
    productTitle: text(value.product_title || value.productTitle, 240) || NEUTRAL_COMMERCE_DEFAULTS.productTitle,
    collectionTitle: text(value.collection_title || value.collectionTitle, 240) || NEUTRAL_COMMERCE_DEFAULTS.collectionTitle,
    bundleTitle: text(value.bundle_title || value.bundleTitle, 240) || NEUTRAL_COMMERCE_DEFAULTS.bundleTitle,
    productTags: stringArray(value.product_tags || value.productTags),
    productPrice: text(value.product_price || value.productPrice, 40) || null
  };
}
