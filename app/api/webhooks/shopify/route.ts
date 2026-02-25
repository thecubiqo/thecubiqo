// Shopify webhook endpoint

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook, handleShopifyWebhook } from '@/integrations/shopify/webhooks';
import type { ShopifyWebhookPayload } from '@/integrations/shopify/types';

/**
 * POST /api/webhooks/shopify
 * Handle Shopify webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId');
    const topic = req.headers.get('x-shopify-topic');
    const hmac = req.headers.get('x-shopify-hmac-sha256');

    if (!siteId || !topic || !hmac) {
      return NextResponse.json(
        { error: 'Missing required headers or parameters' },
        { status: 400 },
      );
    }

    // Get raw body for verification
    const body = await req.text();

    // Verify webhook signature
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      );
    }

    const isValid = verifyShopifyWebhook(body, hmac, secret);
    if (!isValid) {
      console.error('Invalid Shopify webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 },
      );
    }

    // Parse payload
    const payload: ShopifyWebhookPayload = JSON.parse(body);

    // Handle webhook
    await handleShopifyWebhook(topic, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/shopify
 * Verify webhook endpoint is accessible
 */
export async function GET() {
  return NextResponse.json({
    service: 'Shopify Webhook Handler',
    status: 'active',
  });
}
