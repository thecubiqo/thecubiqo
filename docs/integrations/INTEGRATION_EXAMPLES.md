# Shopify + Printify Integration Examples

This guide provides practical examples for using Shopify and Printify integrations together in CubiQo.

## Table of Contents

1. [Setup](#setup)
2. [Basic Product Sync](#basic-product-sync)
3. [Automatic Order Fulfillment](#automatic-order-fulfillment)
4. [Custom Product Creation](#custom-product-creation)
5. [Webhook Automation](#webhook-automation)
6. [Error Handling](#error-handling)

## Setup

### 1. Configure Both Integrations

```typescript
// Configure Shopify
const shopifyResponse = await fetch('/api/integrations/shopify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'my-site-id',
    shopDomain: 'mystore.myshopify.com',
    accessToken: 'shpat_xxxxx',
    apiVersion: '2024-01',
    enabled: true,
  }),
});

// Configure Printify
const printifyResponse = await fetch('/api/integrations/printify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'my-site-id',
    apiToken: 'eyJhbGci...',
    enabled: true,
  }),
});
```

### 2. Verify Integration Status

```typescript
import { getShopifyStatus } from '@/lib/integrations/shopify';
import { getPrintifyStatus } from '@/lib/integrations/printify';

async function checkIntegrations(siteId: string) {
  const [shopifyStatus, printifyStatus] = await Promise.all([
    getShopifyStatus(siteId),
    getPrintifyStatus(siteId),
  ]);

  console.log('Shopify:', shopifyStatus);
  // { connected: true, shopName: "My Store", productCount: 42 }

  console.log('Printify:', printifyStatus);
  // { connected: true, shopCount: 2, productCount: 25 }

  return {
    ready: shopifyStatus.connected && printifyStatus.connected,
    shopifyStatus,
    printifyStatus,
  };
}
```

## Basic Product Sync

### Sync Single Product from Printify to Shopify

```typescript
import { syncPrintifyProductToShopify } from '@/integrations/printify/sync';
import { getPrintifyClient } from '@/lib/integrations/printify';
import { getShopifyClient } from '@/lib/integrations/shopify';

async function syncSingleProduct(
  siteId: string,
  printifyShopId: number,
  printifyProductId: string,
) {
  const printifyClient = await getPrintifyClient(siteId);
  const shopifyClient = await getShopifyClient(siteId);

  if (!printifyClient || !shopifyClient) {
    throw new Error('Integrations not configured');
  }

  const shopifyProduct = await syncPrintifyProductToShopify(
    printifyClient,
    shopifyClient,
    printifyShopId,
    printifyProductId,
  );

  console.log('Product synced:', shopifyProduct.id, shopifyProduct.title);
  return shopifyProduct;
}
```

### Bulk Sync All Products

```typescript
import { syncAllPrintifyProducts } from '@/integrations/printify/sync';

async function bulkSyncProducts(siteId: string, printifyShopId: number) {
  const printifyClient = await getPrintifyClient(siteId);
  const shopifyClient = await getShopifyClient(siteId);

  if (!printifyClient || !shopifyClient) {
    throw new Error('Integrations not configured');
  }

  console.log('Starting bulk sync...');
  const products = await syncAllPrintifyProducts(
    printifyClient,
    shopifyClient,
    printifyShopId,
  );

  console.log(`Successfully synced ${products.length} products`);
  return products;
}
```

## Automatic Order Fulfillment

### Create Product Mapping

```typescript
import { syncShopifyProducts } from '@/lib/integrations/shopify';
import { syncPrintifyProducts } from '@/lib/integrations/printify';

async function createProductMapping(siteId: string, printifyShopId: number) {
  const [shopifyProducts, printifyProducts] = await Promise.all([
    syncShopifyProducts(siteId),
    syncPrintifyProducts(siteId, printifyShopId),
  ]);

  // Create mapping based on SKU or title
  const mapping: Record<string, { productId: string; variantId: number }> = {};

  for (const shopifyProduct of shopifyProducts) {
    for (const shopifyVariant of shopifyProduct.variants) {
      // Find matching Printify product by SKU
      const printifyProduct = printifyProducts.find((p) =>
        p.variants.some((v) => v.sku === shopifyVariant.sku),
      );

      if (printifyProduct) {
        const printifyVariant = printifyProduct.variants.find(
          (v) => v.sku === shopifyVariant.sku,
        );

        if (printifyVariant) {
          mapping[shopifyProduct.id] = {
            productId: printifyProduct.id,
            variantId: printifyVariant.id,
          };
        }
      }
    }
  }

  console.log(`Created mapping for ${Object.keys(mapping).length} products`);
  return mapping;
}
```

### Fulfill Shopify Order via Printify

```typescript
import { createPrintifyOrderFromShopify } from '@/integrations/printify/sync';
import { getShopifyOrders } from '@/lib/integrations/shopify';

async function fulfillOrder(
  siteId: string,
  shopifyOrderId: string,
  printifyShopId: number,
  productMapping: Record<string, { productId: string; variantId: number }>,
) {
  const printifyClient = await getPrintifyClient(siteId);
  const shopifyClient = await getShopifyClient(siteId);

  if (!printifyClient || !shopifyClient) {
    throw new Error('Integrations not configured');
  }

  // Get Shopify order
  const shopifyOrder = await shopifyClient.getOrder(shopifyOrderId);

  // Create Printify order
  const printifyOrder = await createPrintifyOrderFromShopify(
    printifyClient,
    shopifyOrder,
    printifyShopId,
    productMapping,
  );

  console.log('Order fulfilled:', printifyOrder.id);
  return printifyOrder;
}
```

### Automatic Fulfillment on New Orders

```typescript
// In /src/integrations/shopify/webhooks.ts
import { createPrintifyOrderFromShopify } from '@/integrations/printify/sync';
import { getPrintifyClient } from '@/lib/integrations/printify';

export async function handleOrderCreate(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('New Shopify order:', payload.id);

  try {
    // Get site ID from order metadata or database
    const siteId = 'your-site-id';
    const printifyShopId = 123;

    // Load product mapping from database or cache
    const productMapping = await loadProductMapping(siteId);

    // Create Printify order
    const printifyClient = await getPrintifyClient(siteId);
    if (!printifyClient) {
      console.error('Printify not configured');
      return;
    }

    const shopifyOrder = payload as unknown as ShopifyOrder;
    const printifyOrder = await createPrintifyOrderFromShopify(
      printifyClient,
      shopifyOrder,
      printifyShopId,
      productMapping,
    );

    console.log('Order automatically fulfilled:', printifyOrder.id);
  } catch (error) {
    console.error('Failed to fulfill order:', error);
    // Send notification to admin
  }
}
```

## Custom Product Creation

### Create Print-on-Demand Product

```typescript
async function createCustomProduct(
  siteId: string,
  printifyShopId: number,
  design: {
    title: string;
    description: string;
    imageId: string;
    price: number;
  },
) {
  const printifyClient = await getPrintifyClient(siteId);
  const shopifyClient = await getShopifyClient(siteId);

  if (!printifyClient || !shopifyClient) {
    throw new Error('Integrations not configured');
  }

  // 1. Create product in Printify
  const printifyProduct = await printifyClient.createProduct(printifyShopId, {
    title: design.title,
    description: design.description,
    blueprint_id: 5, // T-shirt blueprint
    print_provider_id: 1,
    variants: [
      { id: 17390, price: design.price * 100, is_enabled: true }, // Small
      { id: 17391, price: design.price * 100, is_enabled: true }, // Medium
      { id: 17392, price: design.price * 100, is_enabled: true }, // Large
    ],
    print_areas: [
      {
        variant_ids: [17390, 17391, 17392],
        placeholders: [
          {
            position: 'front',
            images: [
              {
                id: design.imageId,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0,
              },
            ],
          },
        ],
      },
    ],
  });

  // 2. Publish to Printify shop
  await printifyClient.publishProduct(printifyShopId, printifyProduct.id);

  // 3. Sync to Shopify
  const shopifyProduct = await syncPrintifyProductToShopify(
    printifyClient,
    shopifyClient,
    printifyShopId,
    printifyProduct.id,
  );

  console.log('Custom product created and synced:', shopifyProduct.id);
  return { printifyProduct, shopifyProduct };
}
```

### Upload Design and Create Product

```typescript
import fs from 'fs';

async function uploadAndCreateProduct(
  siteId: string,
  printifyShopId: number,
  designPath: string,
  productDetails: {
    title: string;
    description: string;
    price: number;
  },
) {
  const printifyClient = await getPrintifyClient(siteId);
  if (!printifyClient) {
    throw new Error('Printify not configured');
  }

  // 1. Upload design image
  const imageBuffer = fs.readFileSync(designPath);
  const base64Image = imageBuffer.toString('base64');

  const uploadedImage = await printifyClient.uploadImage({
    file_name: 'design.png',
    contents: base64Image,
  });

  console.log('Image uploaded:', uploadedImage.id);

  // 2. Create product with uploaded image
  return createCustomProduct(siteId, printifyShopId, {
    ...productDetails,
    imageId: uploadedImage.id,
  });
}
```

## Webhook Automation

### Update Shopify on Printify Shipment

```typescript
// In /src/app/api/webhooks/printify/route.ts
import { getShopifyClient } from '@/lib/integrations/shopify';

async function handlePrintifyWebhook(payload: PrintifyWebhookPayload) {
  if (payload.type === 'order:shipment:created') {
    const siteId = 'your-site-id';
    const shopifyClient = await getShopifyClient(siteId);

    if (!shopifyClient) {
      console.error('Shopify not configured');
      return;
    }

    // Extract shipment info
    const shipment = payload.resource.data as {
      tracking_number: string;
      tracking_url: string;
      carrier: string;
    };

    // Update Shopify order fulfillment
    // Note: This requires additional Shopify fulfillment API calls
    console.log('Update Shopify fulfillment:', shipment);
  }
}
```

## Error Handling

### Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (error.status === 429 || error.status >= 500) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }

  throw lastError!;
}

// Usage
const products = await retryWithBackoff(() =>
  syncShopifyProducts('site-id')
);
```

### Comprehensive Error Handling

```typescript
async function safeProductSync(siteId: string, printifyShopId: number) {
  try {
    const products = await syncAllPrintifyProducts(
      await getPrintifyClient(siteId),
      await getShopifyClient(siteId),
      printifyShopId,
    );

    return {
      success: true,
      products,
      errors: [],
    };
  } catch (error) {
    console.error('Product sync failed:', error);

    // Log to monitoring service
    // await logError(error);

    // Send notification
    // await sendAdminNotification('Product sync failed');

    return {
      success: false,
      products: [],
      errors: [error.message],
    };
  }
}
```

### Rate Limit Management

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerSecond: number;
  private interval: number;

  constructor(requestsPerSecond: number = 2) {
    this.requestsPerSecond = requestsPerSecond;
    this.interval = 1000 / requestsPerSecond;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise((resolve) => setTimeout(resolve, this.interval));
      }
    }

    this.processing = false;
  }
}

// Usage
const rateLimiter = new RateLimiter(2); // 2 requests per second

const products = [];
for (const productId of productIds) {
  const product = await rateLimiter.add(() =>
    shopifyClient.getProduct(productId)
  );
  products.push(product);
}
```

## Complete Integration Example

```typescript
// Complete workflow: Setup -> Sync -> Fulfill
async function completeIntegrationWorkflow() {
  const siteId = 'my-site-id';
  const printifyShopId = 123;

  // 1. Check integration status
  console.log('Step 1: Checking integrations...');
  const status = await checkIntegrations(siteId);
  if (!status.ready) {
    throw new Error('Integrations not ready');
  }

  // 2. Sync products
  console.log('Step 2: Syncing products...');
  const products = await bulkSyncProducts(siteId, printifyShopId);
  console.log(`Synced ${products.length} products`);

  // 3. Create product mapping
  console.log('Step 3: Creating product mapping...');
  const productMapping = await createProductMapping(siteId, printifyShopId);

  // 4. Monitor and fulfill new orders
  console.log('Step 4: Monitoring orders...');
  const orders = await getShopifyOrders(siteId);
  
  for (const order of orders) {
    if (order.fulfillment_status === 'unfulfilled') {
      console.log(`Fulfilling order ${order.id}...`);
      await fulfillOrder(siteId, order.id, printifyShopId, productMapping);
    }
  }

  console.log('Integration workflow complete!');
}

// Run the workflow
completeIntegrationWorkflow().catch(console.error);
```

## Best Practices

1. **Cache Product Mappings**: Store mappings in Redis or database to avoid repeated API calls
2. **Use Webhooks**: Prefer webhook-driven automation over polling
3. **Handle Rate Limits**: Implement proper rate limiting and backoff strategies
4. **Log Everything**: Log all integration events for debugging
5. **Monitor Errors**: Set up alerts for integration failures
6. **Test with Test Stores**: Use Shopify development stores and Printify test mode
7. **Secure Credentials**: Never expose API tokens in client-side code
8. **Implement Retries**: Add retry logic for transient failures
9. **Validate Data**: Validate all data before sending to APIs
10. **Document Mappings**: Keep clear documentation of product ID mappings

## Resources

- [Shopify Integration Guide](../docs/integrations/shopify.md)
- [Printify Integration Guide](../docs/integrations/printify.md)
- [API Documentation](../API_DOCUMENTATION.md)
