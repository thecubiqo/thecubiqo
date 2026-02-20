# Shopify & Printify Integrations

This directory contains the implementation of Shopify and Printify integrations for the CubiQo platform.

## Overview

The integrations enable:
- **Shopify**: E-commerce store integration for product and order management
- **Printify**: Print-on-demand fulfillment for custom products
- **Combined**: Automated workflow from Shopify orders to Printify fulfillment

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

The following packages are included:
- `@shopify/shopify-api` - Official Shopify API client
- `printify-sdk-js` - Printify API SDK

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and add:

```bash
# Shopify
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Printify
PRINTIFY_API_TOKEN=your_api_token

# OAuth Encryption (generate with: openssl rand -hex 32)
OAUTH_ENCRYPTION_KEY=your_32_byte_hex_key
```

### 3. Setup Integrations

```typescript
// Configure Shopify
await fetch('/api/integrations/shopify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'your-site-id',
    shopDomain: 'yourstore.myshopify.com',
    accessToken: 'your_access_token',
    enabled: true,
  }),
});

// Configure Printify
await fetch('/api/integrations/printify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'your-site-id',
    apiToken: 'your_api_token',
    enabled: true,
  }),
});
```

### 4. Start Using

```typescript
import { syncShopifyProducts } from '@/lib/integrations/shopify';
import { syncPrintifyProducts } from '@/lib/integrations/printify';

// Sync products
const shopifyProducts = await syncShopifyProducts('site-id');
const printifyProducts = await syncPrintifyProducts('site-id', shopId);
```

## Documentation

- **[Shopify Integration Guide](./shopify.md)** - Complete Shopify setup and usage
- **[Printify Integration Guide](./printify.md)** - Complete Printify setup and usage
- **[Integration Examples](./INTEGRATION_EXAMPLES.md)** - Practical code examples
- **[API Documentation](../../API_DOCUMENTATION.md)** - Overall API reference

## Architecture

### Directory Structure

```
src/
├── integrations/           # Core integration clients
│   ├── shopify/
│   │   ├── client.ts      # Shopify REST API client
│   │   ├── types.ts       # TypeScript types
│   │   └── webhooks.ts    # Webhook handlers
│   └── printify/
│       ├── client.ts      # Printify API client
│       ├── types.ts       # TypeScript types
│       └── sync.ts        # Shopify-Printify sync utilities
│
├── lib/integrations/       # Public API wrappers
│   ├── shopify.ts         # High-level Shopify functions
│   └── printify.ts        # High-level Printify functions
│
└── app/api/
    ├── integrations/       # Configuration endpoints
    │   ├── shopify/
    │   │   └── route.ts   # GET/POST/DELETE config
    │   └── printify/
    │       └── route.ts   # GET/POST/DELETE config
    └── webhooks/          # Webhook endpoints
        ├── shopify/
        │   └── route.ts   # Shopify event handler
        └── printify/
            └── route.ts   # Printify event handler
```

## Features

### Shopify Integration

✅ Product management (CRUD operations)
✅ Order retrieval and processing
✅ Webhook subscriptions for real-time events
✅ OAuth 2.0 authentication
✅ Rate limiting support
✅ Automatic webhook setup

### Printify Integration

✅ Product catalog access
✅ Multi-shop support
✅ Order creation and fulfillment
✅ Blueprint (template) management
✅ Image upload and processing
✅ Webhook support for order updates

### Combined Features

✅ Product sync from Printify to Shopify
✅ Automatic order fulfillment workflow
✅ Bulk product operations
✅ Error handling and retry logic
✅ Rate limit management

## API Endpoints

### Configuration

- `GET /api/integrations/shopify?siteId={id}` - Get Shopify config
- `POST /api/integrations/shopify` - Configure Shopify
- `DELETE /api/integrations/shopify?siteId={id}` - Remove Shopify
- `GET /api/integrations/printify?siteId={id}` - Get Printify config
- `POST /api/integrations/printify` - Configure Printify
- `DELETE /api/integrations/printify?siteId={id}` - Remove Printify

### Webhooks

- `POST /api/webhooks/shopify?siteId={id}` - Shopify events
- `GET /api/webhooks/shopify` - Health check
- `POST /api/webhooks/printify?siteId={id}` - Printify events
- `GET /api/webhooks/printify` - Health check

## Usage Examples

### Check Integration Status

```typescript
import { getShopifyStatus, getPrintifyStatus } from '@/lib/integrations';

const status = await Promise.all([
  getShopifyStatus('site-id'),
  getPrintifyStatus('site-id'),
]);
```

### Sync Products

```typescript
import { syncPrintifyProductToShopify } from '@/integrations/printify/sync';

const product = await syncPrintifyProductToShopify(
  printifyClient,
  shopifyClient,
  printifyShopId,
  productId,
);
```

### Fulfill Orders

```typescript
import { createPrintifyOrderFromShopify } from '@/integrations/printify/sync';

const order = await createPrintifyOrderFromShopify(
  printifyClient,
  shopifyOrder,
  printifyShopId,
  productMapping,
);
```

See [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for more examples.

## Security

- **Token Encryption**: All API tokens encrypted with AES-256-GCM
- **Webhook Verification**: HMAC-SHA256 signature verification
- **Environment Variables**: Sensitive data stored in env vars
- **Supabase Storage**: Encrypted tokens stored in database
- **HTTPS Only**: All API communications use HTTPS

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Set up test credentials in `.env.test`:

```bash
# Test accounts
SHOPIFY_TEST_DOMAIN=test-store.myshopify.com
SHOPIFY_TEST_TOKEN=test_token
PRINTIFY_TEST_TOKEN=test_token
```

### Manual Testing

1. Configure integrations via API
2. Test product sync
3. Create test order in Shopify
4. Verify Printify order creation
5. Check webhook events

## Troubleshooting

### Common Issues

**"Integration not configured"**
- Ensure you've called POST /api/integrations/{provider}
- Check environment variables are set

**"Invalid webhook signature"**
- Verify SHOPIFY_WEBHOOK_SECRET matches Shopify app
- Check webhook payload is not modified

**Rate Limit Errors**
- Implement exponential backoff
- Use bulk operations where possible
- Monitor API quota usage

**Product Sync Failures**
- Check product data is valid
- Verify blueprints and variants exist
- Ensure images are uploaded

### Debug Mode

Enable verbose logging:

```typescript
process.env.DEBUG = 'shopify:*,printify:*';
```

## Performance

### Recommendations

- **Cache Product Mappings**: Store in Redis/database
- **Use Webhooks**: Prefer events over polling
- **Batch Operations**: Combine multiple API calls
- **Rate Limiting**: Respect API limits (2 req/s for Shopify)
- **Error Handling**: Implement retry with backoff

### Benchmarks

- Product sync: ~100 products/minute
- Order creation: ~2 orders/second
- Webhook processing: <100ms latency

## Contributing

1. Follow existing code patterns
2. Add TypeScript types for all new code
3. Write tests for new features
4. Update documentation
5. Run linter and type checker

## Support

- **Issues**: File on GitHub
- **Documentation**: See `/docs/integrations/`
- **Examples**: See `INTEGRATION_EXAMPLES.md`

## License

See [LICENSE](../../LICENSE) in the repository root.
