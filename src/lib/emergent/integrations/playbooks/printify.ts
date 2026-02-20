/**
 * Printify Integration Playbook
 * 
 * Pre-built playbook for Printify print-on-demand integration.
 * Handles product creation, order fulfillment, shipping updates.
 * 
 * @module emergent/integrations/playbooks/printify
 */

export const printifyPlaybook = {
  name: 'Printify Print-on-Demand Integration',
  service: 'printify',
  description: 'Connect your app to Printify for print-on-demand product fulfillment',
  version: '1.0.0',
  author: 'Emergent Team',
  instructions: `
This playbook integrates your application with Printify:

1. **Setup**: Add your Printify API token as a secret
2. **Products**: Browse catalog, create custom products
3. **Orders**: Submit orders for fulfillment
4. **Shipping**: Track shipment status

Required Secrets:
- PRINTIFY_API_TOKEN: Your Printify API access token
- PRINTIFY_SHOP_ID: Your Printify shop ID
  `,
  parameters: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'Action: get_catalog, create_product, submit_order, get_shipment'
    },
    {
      name: 'blueprintId',
      type: 'number',
      required: false,
      description: 'Product blueprint ID (for create_product)'
    },
    {
      name: 'orderId',
      type: 'string',
      required: false,
      description: 'Order ID (for get_shipment)'
    }
  ],
  steps: [
    {
      name: 'Validate API Token',
      type: 'secret',
      config: {
        secretKey: 'PRINTIFY_API_TOKEN',
        outputVar: 'apiToken'
      }
    },
    {
      name: 'Route Action',
      type: 'condition',
      config: {
        condition: 'vars.action === "get_catalog"',
        onTrue: [
          {
            name: 'Fetch Product Catalog',
            type: 'http',
            config: {
              method: 'GET',
              url: 'https://api.printify.com/v1/catalog/blueprints.json',
              headers: {
                'Authorization': 'Bearer {{secrets.PRINTIFY_API_TOKEN}}'
              }
            }
          }
        ],
        onFalse: [
          {
            name: 'Handle Create Product',
            type: 'condition',
            config: {
              condition: 'vars.action === "create_product"',
              onTrue: [
                {
                  name: 'Create Printify Product',
                  type: 'http',
                  config: {
                    method: 'POST',
                    url: 'https://api.printify.com/v1/shops/{{secrets.PRINTIFY_SHOP_ID}}/products.json',
                    headers: {
                      'Authorization': 'Bearer {{secrets.PRINTIFY_API_TOKEN}}'
                    },
                    body: {
                      title: '{{vars.productTitle}}',
                      description: '{{vars.productDescription}}',
                      blueprint_id: '{{vars.blueprintId}}',
                      print_provider_id: '{{vars.printProviderId}}',
                      variants: '{{vars.variants}}'
                    }
                  }
                }
              ],
              onFalse: [
                {
                  name: 'Handle Submit Order',
                  type: 'condition',
                  config: {
                    condition: 'vars.action === "submit_order"',
                    onTrue: [
                      {
                        name: 'Submit Order to Printify',
                        type: 'http',
                        config: {
                          method: 'POST',
                          url: 'https://api.printify.com/v1/shops/{{secrets.PRINTIFY_SHOP_ID}}/orders.json',
                          headers: {
                            'Authorization': 'Bearer {{secrets.PRINTIFY_API_TOKEN}}'
                          },
                          body: {
                            external_id: '{{vars.externalOrderId}}',
                            line_items: '{{vars.lineItems}}',
                            shipping_method: '{{vars.shippingMethod}}',
                            send_shipping_notification: true,
                            address_to: '{{vars.shippingAddress}}'
                          }
                        }
                      }
                    ]
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
    retryCount: 2,
    retryDelay: 3000
  }
}

/**
 * Printify webhook payload types
 */
export interface PrintifyOrderWebhook {
  id: string
  type: 'order:created' | 'order:updated' | 'order:shipment:created' | 'order:shipment:delivered'
  data: {
    id: string
    shop_id: number
    status: 'pending' | 'on-hold' | 'in-production' | 'completed' | 'canceled'
    line_items: Array<{
      product_id: string
      variant_id: number
      quantity: number
      status: string
    }>
    shipments: Array<{
      carrier: string
      tracking_number: string
      tracking_url: string
      status: 'in-transit' | 'delivered' | 'returned'
    }>
  }
}

/**
 * Verify Printify webhook signature
 */
export function verifyPrintifyWebhook(
  body: string,
  signatureHeader: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex')
  
  return `sha256=${hash}` === signatureHeader
}
