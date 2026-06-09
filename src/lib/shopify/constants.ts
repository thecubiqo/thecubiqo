export const DEFAULT_SHOPIFY_API_VERSION = '2025-10';

export function shopifyApiVersion() {
  return String(process.env.SHOPIFY_API_VERSION || '').trim() || DEFAULT_SHOPIFY_API_VERSION;
}
