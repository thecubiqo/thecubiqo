// Shopify webhook handlers

import crypto from 'crypto';
import type { ShopifyWebhookPayload } from './types';

/**
 * Verify that a webhook request came from Shopify
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string,
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmacHeader;
}

/**
 * Handle product creation webhook
 */
export async function handleProductCreate(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify product created:', payload.id);
  // Add custom logic here (e.g., sync to database, trigger notifications)
}

/**
 * Handle product update webhook
 */
export async function handleProductUpdate(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify product updated:', payload.id);
  // Add custom logic here
}

/**
 * Handle product deletion webhook
 */
export async function handleProductDelete(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify product deleted:', payload.id);
  // Add custom logic here
}

/**
 * Handle order creation webhook
 */
export async function handleOrderCreate(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify order created:', payload.id);
  // Add custom logic here (e.g., fulfill via Printify)
}

/**
 * Handle order update webhook
 */
export async function handleOrderUpdate(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify order updated:', payload.id);
  // Add custom logic here
}

/**
 * Handle order fulfillment webhook
 */
export async function handleOrderFulfillment(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify order fulfilled:', payload.id);
  // Add custom logic here
}

/**
 * Handle order cancellation webhook
 */
export async function handleOrderCancellation(
  payload: ShopifyWebhookPayload,
): Promise<void> {
  console.log('Shopify order cancelled:', payload.id);
  // Add custom logic here
}

/**
 * Main webhook router
 */
export async function handleShopifyWebhook(
  topic: string,
  payload: ShopifyWebhookPayload,
): Promise<void> {
  switch (topic) {
    case 'products/create':
      await handleProductCreate(payload);
      break;
    case 'products/update':
      await handleProductUpdate(payload);
      break;
    case 'products/delete':
      await handleProductDelete(payload);
      break;
    case 'orders/create':
      await handleOrderCreate(payload);
      break;
    case 'orders/updated':
      await handleOrderUpdate(payload);
      break;
    case 'orders/fulfilled':
      await handleOrderFulfillment(payload);
      break;
    case 'orders/cancelled':
      await handleOrderCancellation(payload);
      break;
    default:
      console.log('Unknown Shopify webhook topic:', topic);
  }
}
