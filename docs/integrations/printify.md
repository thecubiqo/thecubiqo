# Printify Integration for CubiQo

This integration enables CubiQo users to connect their Printify accounts for print-on-demand product management and order fulfillment.

## Features

- 🖨️ **Product Management**: Create and manage print-on-demand products
- 📦 **Order Fulfillment**: Automatically fulfill orders through Printify
- 🏪 **Multi-Shop Support**: Manage multiple Printify shops
- 🎨 **Blueprint Catalog**: Access Printify's product templates
- 🔐 **Secure API Access**: Token-based authentication with encryption
- 🔄 **Shopify Integration**: Seamless sync with Shopify stores

## Setup

### 1. Get Printify API Token

1. Log in to your [Printify account](https://printify.com)
2. Navigate to **Account** > **Connections** > **API**
3. Click **Generate Token**
4. Copy your API token (keep it secure!)

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Printify Configuration
PRINTIFY_API_TOKEN=your_printify_api_token

# OAuth Encryption Key (32-byte hex) - shared with Shopify
OAUTH_ENCRYPTION_KEY=your_32_byte_hex_key
```

Generate the encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Printify Integration

Use the API to configure Printify for a site:

```bash
POST /api/integrations/printify
Content-Type: application/json

{
  "siteId": "your-site-id",
  "apiToken": "your_api_token",
  "apiVersion": "v1",
  "enabled": true
}
```

## Usage

### Get Integration Status

```typescript
import { getPrintifyStatus } from '@/lib/integrations/printify';

const status = await getPrintifyStatus('site-id');
console.log(status);
// { connected: true, shopCount: 2, productCount: 25 }
```

### Get Shops

```typescript
import { getPrintifyShops } from '@/lib/integrations/printify';

const shops = await getPrintifyShops('site-id');
console.log(shops);
// [{ id: 123, title: "My Store", sales_channel: "shopify" }]
```

### Sync Products

```typescript
import { syncPrintifyProducts } from '@/lib/integrations/printify';

const shopId = 123; // Your Printify shop ID
const products = await syncPrintifyProducts('site-id', shopId);
console.log(`Synced ${products.length} products`);
```

### Create a Product

```typescript
import { createPrintifyProduct } from '@/lib/integrations/printify';

const product = await createPrintifyProduct('site-id', shopId, {
  title: 'Custom T-Shirt',
  description: 'A custom print-on-demand t-shirt',
  blueprint_id: 5, // T-shirt blueprint
  print_provider_id: 1,
  variants: [
    {
      id: 1,
      price: 1999, // Price in cents
      is_enabled: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [1],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: 'uploaded-image-id',
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
```

### Create an Order

```typescript
import { createPrintifyOrder } from '@/lib/integrations/printify';

const order = await createPrintifyOrder('site-id', shopId, {
  external_id: 'shopify-order-12345',
  line_items: [
    {
      product_id: 'printify-product-id',
      variant_id: 1,
      quantity: 2,
    },
  ],
  shipping_method: 1,
  send_shipping_notification: true,
  address_to: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    country: 'US',
    region: 'CA',
    address1: '123 Main St',
    city: 'Los Angeles',
    zip: '90001',
  },
});
```

### Get Available Blueprints

```typescript
import { getPrintifyBlueprints } from '@/lib/integrations/printify';

const blueprints = await getPrintifyBlueprints('site-id');
console.log(blueprints);
// [{ id: 5, title: "T-Shirt", brand: "Bella+Canvas", ... }]
```

### Direct Client Usage

For advanced use cases, use the `PrintifyClient` directly:

```typescript
import { PrintifyClient } from '@/integrations/printify/client';

const client = new PrintifyClient({
  apiToken: 'your_api_token',
  apiVersion: 'v1',
});

// Get shops
const shops = await client.getShops();

// Get products with pagination
const response = await client.getProducts(shopId, 1, 50);
console.log(`Page ${response.current_page} of ${response.last_page}`);

// Upload an image
const image = await client.uploadImage({
  file_name: 'design.png',
  contents: base64EncodedImage,
});

// Submit order for production
await client.submitOrder(shopId, orderId);
```

## Shopify + Printify Integration

### Automatic Order Fulfillment

Sync Printify products to Shopify and automatically fulfill orders:

```typescript
import { syncPrintifyProductToShopify, createPrintifyOrderFromShopify } from '@/integrations/printify/sync';
import { getPrintifyClient } from '@/lib/integrations/printify';
import { getShopifyClient } from '@/lib/integrations/shopify';

// 1. Sync a Printify product to Shopify
const printifyClient = await getPrintifyClient('site-id');
const shopifyClient = await getShopifyClient('site-id');

const shopifyProduct = await syncPrintifyProductToShopify(
  printifyClient,
  shopifyClient,
  printifyShopId,
  printifyProductId
);

// 2. When Shopify order is created, fulfill via Printify
const productMapping = {
  'shopify-product-id': {
    productId: 'printify-product-id',
    variantId: 1,
  },
};

const printifyOrder = await createPrintifyOrderFromShopify(
  printifyClient,
  shopifyOrder,
  printifyShopId,
  productMapping
);
```

### Webhook Integration

Handle Printify webhooks to update Shopify fulfillment status:

```typescript
// In /src/app/api/webhooks/printify/route.ts
import { updateShopifyFulfillmentFromPrintify } from '@/integrations/printify/sync';

export async function handlePrintifyWebhook(payload: PrintifyWebhookPayload) {
  if (payload.type === 'order:shipment:created') {
    await updateShopifyFulfillmentFromPrintify(
      printifyClient,
      shopifyClient,
      printifyShopId,
      payload.resource.id,
      shopifyOrderId
    );
  }
}
```

## API Endpoints

### Configuration Endpoint

**GET** `/api/integrations/printify?siteId={siteId}`
- Get configuration and status

**POST** `/api/integrations/printify`
- Configure or update integration

**DELETE** `/api/integrations/printify?siteId={siteId}`
- Remove integration

### Webhook Endpoint

**POST** `/api/webhooks/printify?siteId={siteId}`
- Receive Printify webhook events

**GET** `/api/webhooks/printify`
- Verify endpoint is active

## Webhooks

Printify sends webhooks for:
- `order:created` - Order created
- `order:updated` - Order updated
- `order:sent-to-production` - Order sent to production
- `order:shipment:created` - Shipment created
- `order:shipment:delivered` - Shipment delivered
- `product:publish:started` - Product publish started
- `product:publish:succeeded` - Product publish succeeded
- `product:publish:failed` - Product publish failed

Configure webhooks in your Printify dashboard to point to:
```
https://your-app.com/api/webhooks/printify?siteId=your-site-id
```

## Rate Limits

Printify enforces the following rate limits:
- **Global**: 600 requests/minute
- **Catalog endpoints**: 100 requests/minute
- **Product publishing**: 200 requests/30 minutes

The client automatically handles these limits, but for bulk operations, implement appropriate delays.

## Security

- API tokens are encrypted using AES-256-GCM before storage
- Tokens stored in Supabase `integration_configs` table
- Never expose API tokens in client-side code
- Use environment variables for sensitive data

## Troubleshooting

### "Printify not configured for this site"

Make sure you've configured the integration:
```bash
POST /api/integrations/printify
```

### Rate Limit Errors (HTTP 429)

Implement exponential backoff:
```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
}
```

### Product Publishing Issues

Ensure products have:
- Valid blueprint_id and print_provider_id
- At least one enabled variant
- Valid print areas with uploaded images
- Correct pricing (in cents)

## Advanced Features

### Bulk Product Sync

```typescript
import { syncAllPrintifyProducts } from '@/integrations/printify/sync';

const products = await syncAllPrintifyProducts(
  printifyClient,
  shopifyClient,
  printifyShopId
);
console.log(`Synced ${products.length} products to Shopify`);
```

### Image Upload and Processing

```typescript
import fs from 'fs';

const imageBuffer = fs.readFileSync('./design.png');
const base64Image = imageBuffer.toString('base64');

const uploadedImage = await client.uploadImage({
  file_name: 'design.png',
  contents: base64Image,
});

console.log('Image uploaded:', uploadedImage.id);
```

## Resources

- [Printify API Documentation](https://developers.printify.com/)
- [Printify Help Center](https://help.printify.com/)
- [Printify SDK on npm](https://npm.io/package/printify-sdk-js)
- [Shopify Integration Guide](./shopify.md)

## Support

For issues or questions:
- File an issue on GitHub
- Check the [API Documentation](../../API_DOCUMENTATION.md)
- Review [Architecture](../../ARCHITECTURE.md)
- Visit [Printify Help Center](https://help.printify.com/)
