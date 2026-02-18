// Printify sync utilities for Shopify-Printify integration

import { PrintifyClient } from './client';
import { ShopifyClient } from '../shopify/client';
import type { PrintifyProduct, PrintifyOrder } from './types';
import type { ShopifyProduct, ShopifyOrder } from '../shopify/types';

/**
 * Sync a Printify product to Shopify
 */
export async function syncPrintifyProductToShopify(
  printifyClient: PrintifyClient,
  shopifyClient: ShopifyClient,
  printifyShopId: number,
  printifyProductId: string,
): Promise<ShopifyProduct> {
  // Get product from Printify
  const printifyProduct = await printifyClient.getProduct(
    printifyShopId,
    printifyProductId,
  );

  // Transform Printify product to Shopify format
  const shopifyProduct: Partial<ShopifyProduct> = {
    title: printifyProduct.title,
    body_html: printifyProduct.description,
    vendor: 'Printify',
    product_type: 'Print on Demand',
    tags: printifyProduct.tags.join(','),
    variants: printifyProduct.variants
      .filter((v) => v.is_enabled)
      .map((variant, index) => ({
        id: variant.id.toString(),
        product_id: '',
        title: variant.title,
        price: (variant.price / 100).toFixed(2), // Convert cents to dollars
        sku: variant.sku,
        position: index + 1,
        inventory_policy: 'deny',
        compare_at_price: null,
        fulfillment_service: 'manual',
        inventory_management: null,
        option1: variant.title,
        option2: null,
        option3: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        taxable: true,
        barcode: null,
        grams: variant.grams,
        image_id: null,
        weight: variant.grams,
        weight_unit: 'g',
        inventory_item_id: '',
        inventory_quantity: 999,
        old_inventory_quantity: 999,
        requires_shipping: true,
        admin_graphql_api_id: '',
      })),
    images: printifyProduct.images.map((img, index) => ({
      id: '',
      product_id: '',
      position: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      alt: printifyProduct.title,
      width: 0,
      height: 0,
      src: img.src,
      variant_ids: [],
      admin_graphql_api_id: '',
    })),
  };

  // Create or update product in Shopify
  const createdProduct = await shopifyClient.createProduct(shopifyProduct);

  return createdProduct;
}

/**
 * Create a Printify order from a Shopify order
 */
export async function createPrintifyOrderFromShopify(
  printifyClient: PrintifyClient,
  shopifyOrder: ShopifyOrder,
  printifyShopId: number,
  productMapping: Record<string, { productId: string; variantId: number }>,
): Promise<PrintifyOrder> {
  // Transform Shopify order to Printify format
  const printifyOrder = {
    external_id: shopifyOrder.id,
    line_items: shopifyOrder.line_items
      .map((item) => {
        const mapping = productMapping[item.product_id || ''];
        if (!mapping) return null;

        return {
          product_id: mapping.productId,
          variant_id: mapping.variantId,
          quantity: item.quantity,
        };
      })
      .filter(Boolean) as Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>,
    shipping_method: 1, // Standard shipping
    send_shipping_notification: true,
    address_to: {
      first_name: shopifyOrder.email.split('@')[0] || 'Customer',
      last_name: '',
      email: shopifyOrder.email,
      phone: shopifyOrder.phone || '',
      country: 'US', // Extract from shipping address
      region: '',
      address1: '',
      city: '',
      zip: '',
    },
  };

  // Create order in Printify
  const createdOrder = await printifyClient.createOrder(
    printifyShopId,
    printifyOrder,
  );

  // Submit order for production
  await printifyClient.submitOrder(printifyShopId, createdOrder.id);

  return createdOrder;
}

/**
 * Sync all Printify products to Shopify
 */
export async function syncAllPrintifyProducts(
  printifyClient: PrintifyClient,
  shopifyClient: ShopifyClient,
  printifyShopId: number,
): Promise<ShopifyProduct[]> {
  const syncedProducts: ShopifyProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await printifyClient.getProducts(printifyShopId, page, 50);

    for (const printifyProduct of response.data) {
      try {
        const shopifyProduct = await syncPrintifyProductToShopify(
          printifyClient,
          shopifyClient,
          printifyShopId,
          printifyProduct.id,
        );
        syncedProducts.push(shopifyProduct);
      } catch (error) {
        console.error(
          `Failed to sync product ${printifyProduct.id}:`,
          error,
        );
      }
    }

    hasMore = response.next_page_url !== null;
    page++;
  }

  return syncedProducts;
}

/**
 * Get Printify order status and update Shopify fulfillment
 */
export async function updateShopifyFulfillmentFromPrintify(
  printifyClient: PrintifyClient,
  shopifyClient: ShopifyClient,
  printifyShopId: number,
  printifyOrderId: string,
  shopifyOrderId: string,
): Promise<void> {
  const printifyOrder = await printifyClient.getOrder(
    printifyShopId,
    printifyOrderId,
  );

  // If order is fulfilled in Printify, we could update Shopify
  // This would require additional Shopify fulfillment API calls
  if (printifyOrder.fulfilled_at) {
    console.log(
      `Printify order ${printifyOrderId} fulfilled, should update Shopify order ${shopifyOrderId}`,
    );
  }
}
