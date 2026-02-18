// Public Shopify integration API

import { ShopifyClient } from '@/integrations/shopify/client';
import type { ShopifyConfig, ShopifyProduct, ShopifyOrder } from '@/integrations/shopify/types';

/**
 * Get a configured Shopify client for a site
 */
export async function getShopifyClient(siteId: string): Promise<ShopifyClient | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get integration config from database
    const { data, error } = await sb
      .from('integration_configs')
      .select('*')
      .eq('site_id', siteId)
      .eq('provider', 'shopify')
      .eq('enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    const config: ShopifyConfig = {
      shopDomain: data.config.shopDomain,
      accessToken: data.config.accessToken,
      apiVersion: data.config.apiVersion || '2024-01',
    };

    return new ShopifyClient(config);
  } catch (error) {
    console.error('Failed to get Shopify client:', error);
    return null;
  }
}

/**
 * Sync Shopify products for a site
 */
export async function syncShopifyProducts(siteId: string): Promise<ShopifyProduct[]> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    throw new Error('Shopify not configured for this site');
  }

  return client.getProducts({ limit: 250 });
}

/**
 * Get Shopify status for a site
 */
export async function getShopifyStatus(siteId: string): Promise<{
  connected: boolean;
  shopName?: string;
  productCount?: number;
}> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    return { connected: false };
  }

  try {
    const [shopInfo, products] = await Promise.all([
      client.getShopInfo(),
      client.getProducts({ limit: 1 }),
    ]);

    return {
      connected: true,
      shopName: shopInfo.name,
      productCount: products.length,
    };
  } catch (error) {
    console.error('Failed to get Shopify status:', error);
    return { connected: false };
  }
}

/**
 * Create a product in Shopify
 */
export async function createShopifyProduct(
  siteId: string,
  product: Partial<ShopifyProduct>,
): Promise<ShopifyProduct> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    throw new Error('Shopify not configured for this site');
  }

  return client.createProduct(product);
}

/**
 * Update a product in Shopify
 */
export async function updateShopifyProduct(
  siteId: string,
  productId: string,
  product: Partial<ShopifyProduct>,
): Promise<ShopifyProduct> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    throw new Error('Shopify not configured for this site');
  }

  return client.updateProduct(productId, product);
}

/**
 * Get Shopify orders for a site
 */
export async function getShopifyOrders(siteId: string): Promise<ShopifyOrder[]> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    throw new Error('Shopify not configured for this site');
  }

  return client.getOrders({ limit: 250 });
}

/**
 * Setup Shopify webhooks for a site
 */
export async function setupShopifyWebhooks(
  siteId: string,
  baseUrl: string,
): Promise<void> {
  const client = await getShopifyClient(siteId);
  if (!client) {
    throw new Error('Shopify not configured for this site');
  }

  const webhookUrl = `${baseUrl}/api/webhooks/shopify?siteId=${siteId}`;

  const topics = [
    'products/create',
    'products/update',
    'products/delete',
    'orders/create',
    'orders/updated',
    'orders/fulfilled',
    'orders/cancelled',
  ];

  // Get existing webhooks
  const existingWebhooks = await client.listWebhooks();

  for (const topic of topics) {
    // Check if webhook already exists
    const existing = existingWebhooks.find((w) => w.topic === topic && w.address === webhookUrl);
    
    if (!existing) {
      await client.createWebhook(topic, webhookUrl);
    }
  }
}
