# Shopify Integration for CubiQo

This integration enables CubiQo users to connect their Shopify stores for product management, order fulfillment, and print-on-demand operations.

## Features

- 🛍️ **Product Management**: Sync products between Shopify and your CubiQo site
- 📦 **Order Management**: Retrieve and process orders from Shopify
- 🔔 **Webhook Support**: Real-time notifications for products and orders
- 🔐 **Secure Authentication**: OAuth 2.0 flow with encrypted token storage
- 🔄 **Automatic Sync**: Keep products and inventory in sync

## Setup

### 1. Create a Shopify App

1. Go to your Shopify admin panel
2. Navigate to **Settings** > **Apps and sales channels** > **Develop apps**
3. Click **Create an app**
4. Give it a name (e.g., "CubiQo Integration")
5. Configure the following scopes:
   - `read_products`
   - `write_products`
   - `read_orders`
   - `write_orders` (if needed for fulfillment)
6. Install the app to get your **API Access Token**

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Shopify Configuration
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# OAuth Encryption Key (32-byte hex)
OAUTH_ENCRYPTION_KEY=your_32_byte_hex_key
```

Generate the encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Shopify Integration

Use the API to configure Shopify for a site:

```bash
POST /api/integrations/shopify
Content-Type: application/json

{
  "siteId": "your-site-id",
  "shopDomain": "your-store.myshopify.com",
  "accessToken": "your_access_token",
  "apiVersion": "2024-01",
  "enabled": true
}
```

### 4. Setup Webhooks (Optional but Recommended)

The integration automatically sets up webhooks when you configure it. To manually verify:

```bash
GET /api/integrations/shopify?siteId=your-site-id
```

Webhooks are created for:
- `products/create`
- `products/update`
- `products/delete`
- `orders/create`
- `orders/updated`
- `orders/fulfilled`
- `orders/cancelled`

## Usage

### Get Integration Status

```typescript
import { getShopifyStatus } from '@/lib/integrations/shopify';

const status = await getShopifyStatus('site-id');
console.log(status);
// { connected: true, shopName: "My Store", productCount: 42 }
```

### Sync Products

```typescript
import { syncShopifyProducts } from '@/lib/integrations/shopify';

const products = await syncShopifyProducts('site-id');
console.log(`Synced ${products.length} products`);
```

### Create a Product

```typescript
import { createShopifyProduct } from '@/lib/integrations/shopify';

const product = await createShopifyProduct('site-id', {
  title: 'My New Product',
  body_html: '<p>Product description</p>',
  vendor: 'My Brand',
  product_type: 'T-Shirt',
  variants: [
    {
      title: 'Small',
      price: '19.99',
      sku: 'TSHIRT-SM',
    },
  ],
});
```

### Get Orders

```typescript
import { getShopifyOrders } from '@/lib/integrations/shopify';

const orders = await getShopifyOrders('site-id');
console.log(`Retrieved ${orders.length} orders`);
```

### Direct Client Usage

For advanced use cases, use the `ShopifyClient` directly:

```typescript
import { ShopifyClient } from '@/integrations/shopify/client';

const client = new ShopifyClient({
  shopDomain: 'your-store.myshopify.com',
  accessToken: 'your_access_token',
  apiVersion: '2024-01',
});

// Get shop info
const shopInfo = await client.getShopInfo();

// Get products with filters
const products = await client.getProducts({
  limit: 50,
  published_status: 'published',
});

// Create webhook
await client.createWebhook(
  'products/create',
  'https://your-app.com/api/webhooks/shopify',
  'json'
);
```

## Webhook Handling

Webhooks are automatically handled by the integration. You can customize the behavior by modifying `/src/integrations/shopify/webhooks.ts`:

```typescript
import { handleProductCreate } from '@/integrations/shopify/webhooks';

// Custom product creation handler
export async function handleProductCreate(payload: ShopifyWebhookPayload): Promise<void> {
  console.log('New product created:', payload.id);
  
  // Add your custom logic here:
  // - Send notifications
  // - Update database
  // - Trigger other integrations (e.g., Printify)
}
```

## API Endpoints

### Configuration Endpoint

**GET** `/api/integrations/shopify?siteId={siteId}`
- Get configuration and status

**POST** `/api/integrations/shopify`
- Configure or update integration

**DELETE** `/api/integrations/shopify?siteId={siteId}`
- Remove integration

### Webhook Endpoint

**POST** `/api/webhooks/shopify?siteId={siteId}`
- Receive Shopify webhook events

**GET** `/api/webhooks/shopify`
- Verify endpoint is active

## Security

- All API access tokens are encrypted using AES-256-GCM before storage
- Webhook signatures are verified using HMAC-SHA256
- OAuth tokens stored in Supabase `oauth_tokens` table
- Integration configs stored in `integration_configs` table

## Troubleshooting

### "Shopify not configured for this site"

Make sure you've configured the integration:
```bash
POST /api/integrations/shopify
```

### "Invalid webhook signature"

Verify `SHOPIFY_WEBHOOK_SECRET` matches the secret in your Shopify app settings.

### Rate Limiting

Shopify has rate limits (2 requests/second for REST API). The client automatically handles rate limiting, but for bulk operations, implement delays:

```typescript
for (const product of products) {
  await createShopifyProduct(siteId, product);
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
}
```

## Advanced: Shopify + Printify Integration

See [Printify Integration](./printify.md) for information on connecting Shopify with Printify for print-on-demand fulfillment.

## Resources

- [Shopify API Documentation](https://shopify.dev/docs/api)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [@shopify/shopify-api on npm](https://www.npmjs.com/package/@shopify/shopify-api)

## Support

For issues or questions:
- File an issue on GitHub
- Check the [API Documentation](../../API_DOCUMENTATION.md)
- Review [Architecture](../../ARCHITECTURE.md)
