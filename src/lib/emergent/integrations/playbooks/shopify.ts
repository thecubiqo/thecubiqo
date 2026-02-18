/**
 * Shopify Integration Playbook
 * 
 * Pre-built playbook for Shopify e-commerce integration.
 * Handles product sync, order webhooks, inventory management.
 * 
 * @module emergent/integrations/playbooks/shopify
 */

export const shopifyPlaybook = {
  name: 'Shopify E-commerce Integration',
  service: 'shopify',
  description: 'Connect your app to Shopify for product management, orders, and inventory sync',
  version: '1.0.0',
  author: 'Emergent Team',
  instructions: `
This playbook integrates your application with Shopify:

1. **Setup**: Add your Shopify store URL and API credentials as secrets
2. **Products**: Sync products, variants, and inventory
3. **Orders**: Receive real-time order webhooks
4. **Customers**: Manage customer data and segments

Required Secrets:
- SHOPIFY_STORE_URL: Your Shopify store URL (e.g., mystore.myshopify.com)
- SHOPIFY_API_KEY: Admin API access token
- SHOPIFY_WEBHOOK_SECRET: Webhook signature secret
  `,
  parameters: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'Action to perform: sync_products, get_orders, update_inventory, create_webhook'
    },
    {
      name: 'productId',
      type: 'string',
      required: false,
      description: 'Product ID (for single product operations)'
    },
    {
      name: 'limit',
      type: 'number',
      required: false,
      default: 50,
      description: 'Number of items to fetch (max 250)'
    }
  ],
  steps: [
    {
      name: 'Validate Credentials',
      type: 'secret',
      config: {
        secretKey: 'SHOPIFY_API_KEY',
        outputVar: 'apiKey'
      }
    },
    {
      name: 'Check Action Type',
      type: 'condition',
      config: {
        condition: 'vars.action === "sync_products"',
        onTrue: [
          {
            name: 'Fetch Products from Shopify',
            type: 'http',
            config: {
              method: 'GET',
              url: 'https://{{secrets.SHOPIFY_STORE_URL}}/admin/api/2024-01/products.json?limit={{vars.limit}}',
              headers: {
                'X-Shopify-Access-Token': '{{secrets.SHOPIFY_API_KEY}}'
              }
            }
          },
          {
            name: 'Transform Product Data',
            type: 'transform',
            config: {
              input: 'products',
              output: 'transformedProducts',
              transform: `
                return input.products.map(p => ({
                  id: p.id,
                  title: p.title,
                  description: p.body_html,
                  price: p.variants[0]?.price,
                  image: p.images[0]?.src,
                  inventory: p.variants[0]?.inventory_quantity
                }))
              `
            }
          }
        ],
        onFalse: [
          {
            name: 'Handle Other Actions',
            type: 'condition',
            config: {
              condition: 'vars.action === "get_orders"',
              onTrue: [
                {
                  name: 'Fetch Orders',
                  type: 'http',
                  config: {
                    method: 'GET',
                    url: 'https://{{secrets.SHOPIFY_STORE_URL}}/admin/api/2024-01/orders.json?limit={{vars.limit}}&status=any',
                    headers: {
                      'X-Shopify-Access-Token': '{{secrets.SHOPIFY_API_KEY}}'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ],
  errorHandling: {
    retryCount: 3,
    retryDelay: 2000
  }
}

/**
 * Shopify webhook payload types
 */
export interface ShopifyOrderWebhook {
  id: number
  email: string
  created_at: string
  updated_at: string
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  financial_status: string
  fulfillment_status: string | null
  line_items: Array<{
    id: number
    product_id: number
    variant_id: number
    title: string
    quantity: number
    price: string
  }>
  customer: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  shipping_address: {
    address1: string
    address2: string | null
    city: string
    province: string
    country: string
    zip: string
  }
}

/**
 * Verify Shopify webhook signature
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  
  return hash === hmacHeader
}
