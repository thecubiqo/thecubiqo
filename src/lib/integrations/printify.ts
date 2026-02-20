// Public Printify integration API

import { PrintifyClient } from '@/integrations/printify/client';
import type { PrintifyConfig, PrintifyProduct, PrintifyOrder, PrintifyShop } from '@/integrations/printify/types';

/**
 * Get a configured Printify client for a site
 */
export async function getPrintifyClient(siteId: string): Promise<PrintifyClient | null> {
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
      .eq('provider', 'printify')
      .eq('enabled', true)
      .single();

    if (error || !data) {
      return null;
    }

    const config: PrintifyConfig = {
      apiToken: data.config.apiToken,
      apiVersion: data.config.apiVersion || 'v1',
    };

    return new PrintifyClient(config);
  } catch (error) {
    console.error('Failed to get Printify client:', error);
    return null;
  }
}

/**
 * Get Printify shops
 */
export async function getPrintifyShops(siteId: string): Promise<PrintifyShop[]> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  return client.getShops();
}

/**
 * Sync Printify products for a site
 */
export async function syncPrintifyProducts(
  siteId: string,
  shopId: number,
): Promise<PrintifyProduct[]> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  const allProducts: PrintifyProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getProducts(shopId, page, 50);
    allProducts.push(...response.data);
    hasMore = response.next_page_url !== null;
    page++;
  }

  return allProducts;
}

/**
 * Get Printify status for a site
 */
export async function getPrintifyStatus(siteId: string): Promise<{
  connected: boolean;
  shopCount?: number;
  productCount?: number;
}> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    return { connected: false };
  }

  try {
    const shops = await client.getShops();
    let totalProducts = 0;

    // Get product count from first shop
    if (shops.length > 0) {
      const response = await client.getProducts(shops[0].id, 1, 1);
      totalProducts = response.total;
    }

    return {
      connected: true,
      shopCount: shops.length,
      productCount: totalProducts,
    };
  } catch (error) {
    console.error('Failed to get Printify status:', error);
    return { connected: false };
  }
}

/**
 * Create a product in Printify
 */
export async function createPrintifyProduct(
  siteId: string,
  shopId: number,
  product: Partial<PrintifyProduct>,
): Promise<PrintifyProduct> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  return client.createProduct(shopId, product);
}

/**
 * Update a product in Printify
 */
export async function updatePrintifyProduct(
  siteId: string,
  shopId: number,
  productId: string,
  product: Partial<PrintifyProduct>,
): Promise<PrintifyProduct> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  return client.updateProduct(shopId, productId, product);
}

/**
 * Get Printify orders for a site
 */
export async function getPrintifyOrders(
  siteId: string,
  shopId: number,
): Promise<PrintifyOrder[]> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  const allOrders: PrintifyOrder[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getOrders(shopId, page, 50);
    allOrders.push(...response.data);
    hasMore = response.next_page_url !== null;
    page++;
  }

  return allOrders;
}

/**
 * Create an order in Printify
 */
export async function createPrintifyOrder(
  siteId: string,
  shopId: number,
  order: {
    external_id: string;
    line_items: Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>;
    shipping_method: number;
    send_shipping_notification: boolean;
    address_to: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      country: string;
      region: string;
      address1: string;
      address2?: string;
      city: string;
      zip: string;
    };
  },
): Promise<PrintifyOrder> {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  const createdOrder = await client.createOrder(shopId, order);
  
  // Submit order for production
  await client.submitOrder(shopId, createdOrder.id);
  
  return createdOrder;
}

/**
 * Get available blueprints (product templates)
 */
export async function getPrintifyBlueprints(siteId: string) {
  const client = await getPrintifyClient(siteId);
  if (!client) {
    throw new Error('Printify not configured for this site');
  }

  return client.getBlueprints();
}
