# Shopify & Printify Integration - Visual Guide

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CubiQo Platform                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Frontend / UI Layer                        │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │              Public API Wrappers                              │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │ │
│  │  │  shopify.ts      │  │  printify.ts     │                  │ │
│  │  │  - Get client    │  │  - Get client    │                  │ │
│  │  │  - Sync products │  │  - Sync products │                  │ │
│  │  │  - Get status    │  │  - Get orders    │                  │ │
│  │  └──────────────────┘  └──────────────────┘                  │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │               Integration Clients                             │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │ │
│  │  │ ShopifyClient    │  │ PrintifyClient   │                  │ │
│  │  │ - Products API   │  │ - Products API   │                  │ │
│  │  │ - Orders API     │  │ - Orders API     │                  │ │
│  │  │ - Webhooks API   │  │ - Blueprints API │                  │ │
│  │  └──────────────────┘  └──────────────────┘                  │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │                 API Routes Layer                              │ │
│  │  ┌──────────────────────────────────────────────────────┐    │ │
│  │  │  Configuration Routes                                 │    │ │
│  │  │  - /api/integrations/shopify  (GET/POST/DELETE)      │    │ │
│  │  │  - /api/integrations/printify (GET/POST/DELETE)      │    │ │
│  │  └──────────────────────────────────────────────────────┘    │ │
│  │  ┌──────────────────────────────────────────────────────┐    │ │
│  │  │  Webhook Routes                                       │    │ │
│  │  │  - /api/webhooks/shopify  (POST)                     │    │ │
│  │  │  - /api/webhooks/printify (POST)                     │    │ │
│  │  └──────────────────────────────────────────────────────┘    │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │                   Supabase Storage                            │ │
│  │  - integration_configs (configuration)                        │ │
│  │  - oauth_tokens (encrypted tokens)                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         │                                            │
         │ HTTPS                                      │ HTTPS
         │                                            │
         ▼                                            ▼
┌─────────────────────┐                    ┌─────────────────────┐
│   Shopify API       │                    │   Printify API      │
│   REST/GraphQL      │                    │   REST API v1       │
└─────────────────────┘                    └─────────────────────┘
```

## Data Flow: Product Sync

```
User Action: Sync Printify product to Shopify
│
▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Get Printify Product                                     │
│    printifyClient.getProduct(shopId, productId)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Transform Product Data                                   │
│    - Map Printify variants to Shopify format                │
│    - Convert prices (cents to dollars)                      │
│    - Map images and options                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create in Shopify                                        │
│    shopifyClient.createProduct(transformedProduct)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return Shopify Product                                   │
│    { id, title, variants, images, ... }                     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Order Fulfillment

```
Shopify Order Created
│
▼ Webhook: POST /api/webhooks/shopify
│
┌─────────────────────────────────────────────────────────────┐
│ 1. Verify Webhook Signature (HMAC-SHA256)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Extract Order Data                                       │
│    - Line items (products, variants, quantities)            │
│    - Shipping address                                       │
│    - Customer information                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Map Shopify Products to Printify                         │
│    - Lookup product mapping                                 │
│    - Match variants                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create Printify Order                                    │
│    printifyClient.createOrder(shopId, orderData)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Submit for Production                                    │
│    printifyClient.submitOrder(shopId, orderId)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Track Order Status                                       │
│    - Wait for Printify webhook                              │
│    - Update Shopify fulfillment status                      │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Flow

```
Developer Setup
│
▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Set Environment Variables                                 │
│    - SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET              │
│    - PRINTIFY_API_TOKEN                                     │
│    - OAUTH_ENCRYPTION_KEY                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Configure Shopify Integration                             │
│    POST /api/integrations/shopify                           │
│    {                                                         │
│      siteId: "my-site",                                     │
│      shopDomain: "mystore.myshopify.com",                   │
│      accessToken: "shpat_xxxxx",                            │
│      enabled: true                                          │
│    }                                                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Store Configuration in Supabase                           │
│    - Encrypt access token (AES-256-GCM)                     │
│    - Save to integration_configs table                       │
│    - Setup webhooks automatically                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Configure Printify Integration                            │
│    POST /api/integrations/printify                          │
│    {                                                         │
│      siteId: "my-site",                                     │
│      apiToken: "eyJhbGci...",                               │
│      enabled: true                                          │
│    }                                                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Store Configuration in Supabase                           │
│    - Encrypt API token (AES-256-GCM)                        │
│    - Save to integration_configs table                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Integrations Ready!                                       │
│    - Start syncing products                                  │
│    - Enable automatic fulfillment                            │
│    - Process webhooks                                        │
└──────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 1: Environment Variable Isolation            │    │
│  │ - Secrets stored in .env.local                     │    │
│  │ - Never committed to git                           │    │
│  │ - Separate keys per environment                    │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │ Layer 2: Token Encryption at Rest                  │    │
│  │ - AES-256-GCM encryption                           │    │
│  │ - 32-byte encryption key                           │    │
│  │ - Unique IV per token                              │    │
│  │ - Authentication tags                              │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │ Layer 3: Webhook Signature Verification            │    │
│  │ - HMAC-SHA256 signatures (Shopify)                 │    │
│  │ - Request validation                               │    │
│  │ - Replay attack prevention                         │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │ Layer 4: HTTPS-Only Communication                  │    │
│  │ - TLS 1.2+ required                                │    │
│  │ - Certificate validation                           │    │
│  │ - No plaintext transmission                        │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────▼───────────────────────────┐    │
│  │ Layer 5: Database Security (Supabase)              │    │
│  │ - Row Level Security (RLS)                         │    │
│  │ - Service role key isolation                       │    │
│  │ - Audit logging                                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### API Endpoints
```
Configuration:
  GET    /api/integrations/shopify?siteId={id}
  POST   /api/integrations/shopify
  DELETE /api/integrations/shopify?siteId={id}
  
  GET    /api/integrations/printify?siteId={id}
  POST   /api/integrations/printify
  DELETE /api/integrations/printify?siteId={id}

Webhooks:
  POST /api/webhooks/shopify?siteId={id}
  POST /api/webhooks/printify?siteId={id}
```

### Key Functions
```typescript
// Shopify
import {
  getShopifyClient,
  syncShopifyProducts,
  getShopifyStatus,
  createShopifyProduct,
  setupShopifyWebhooks,
} from '@/lib/integrations/shopify';

// Printify
import {
  getPrintifyClient,
  syncPrintifyProducts,
  getPrintifyStatus,
  createPrintifyProduct,
  getPrintifyBlueprints,
} from '@/lib/integrations/printify';

// Sync Utilities
import {
  syncPrintifyProductToShopify,
  createPrintifyOrderFromShopify,
  syncAllPrintifyProducts,
} from '@/integrations/printify/sync';
```

### Environment Variables
```bash
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
PRINTIFY_API_TOKEN=your_api_token
OAUTH_ENCRYPTION_KEY=your_32_byte_hex_key
```

---

For detailed documentation, see:
- [README](./docs/integrations/README.md)
- [Shopify Guide](./docs/integrations/shopify.md)
- [Printify Guide](./docs/integrations/printify.md)
- [Examples](./docs/integrations/INTEGRATION_EXAMPLES.md)
