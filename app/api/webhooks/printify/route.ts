// Printify webhook endpoint

import { NextRequest, NextResponse } from 'next/server';
import type { PrintifyWebhookPayload } from '@/integrations/printify/types';

/**
 * Handle Printify webhook events
 */
async function handlePrintifyWebhook(
  payload: PrintifyWebhookPayload,
): Promise<void> {
  console.log('Printify webhook received:', payload.type, payload.id);

  switch (payload.type) {
    case 'order:created':
      console.log('Printify order created:', payload.resource.id);
      // Add custom logic here
      break;
    case 'order:updated':
      console.log('Printify order updated:', payload.resource.id);
      // Add custom logic here
      break;
    case 'order:sent-to-production':
      console.log('Printify order sent to production:', payload.resource.id);
      // Add custom logic here
      break;
    case 'order:shipment:created':
      console.log('Printify shipment created:', payload.resource.id);
      // Add custom logic here (e.g., update Shopify fulfillment)
      break;
    case 'order:shipment:delivered':
      console.log('Printify shipment delivered:', payload.resource.id);
      // Add custom logic here
      break;
    case 'product:publish:started':
      console.log('Printify product publish started:', payload.resource.id);
      // Add custom logic here
      break;
    case 'product:publish:succeeded':
      console.log('Printify product publish succeeded:', payload.resource.id);
      // Add custom logic here
      break;
    case 'product:publish:failed':
      console.log('Printify product publish failed:', payload.resource.id);
      // Add custom logic here
      break;
    default:
      console.log('Unknown Printify webhook type:', payload.type);
  }
}

/**
 * POST /api/webhooks/printify
 * Handle Printify webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 },
      );
    }

    // Parse payload
    const payload: PrintifyWebhookPayload = await req.json();

    // Handle webhook
    await handlePrintifyWebhook(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Printify webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/webhooks/printify
 * Verify webhook endpoint is accessible
 */
export async function GET() {
  return NextResponse.json({
    service: 'Printify Webhook Handler',
    status: 'active',
  });
}
