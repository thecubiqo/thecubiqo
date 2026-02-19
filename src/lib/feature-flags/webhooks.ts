/**
 * Feature Flag Webhook System
 * Handles webhook delivery for feature flag changes
 */

import { createClient } from '@/lib/supabase/server';
import type { FeatureFlag, FeatureFlagWebhookPayload } from '@/types/feature-flags';

/**
 * Trigger webhooks for a feature flag event
 */
export async function triggerWebhooks(
  flagId: string,
  event: string,
  flag: FeatureFlag,
  changedBy?: string,
  changes?: any
): Promise<void> {
  const supabase = await createClient();

  try {
    // Get all enabled webhooks for this flag
    const { data: webhooks, error } = await supabase
      .from('feature_flag_webhooks')
      .select('*')
      .eq('flag_id', flagId)
      .eq('enabled', true);

    if (error || !webhooks || webhooks.length === 0) {
      
      return;
    }

    // Filter webhooks that listen to this event
    const relevantWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes(event)
    );

    if (relevantWebhooks.length === 0) {
      
      return;
    }

    // Prepare payload
    const payload: FeatureFlagWebhookPayload = {
      event,
      flag,
      timestamp: new Date().toISOString(),
      changed_by: changedBy,
      changes,
    };

    // Deliver webhooks in parallel
    await Promise.all(
      relevantWebhooks.map((webhook) =>
        deliverWebhook(webhook, payload)
      )
    );
  } catch (error) {
    
  }
}

/**
 * Deliver a single webhook with retry logic
 */
async function deliverWebhook(
  webhook: any,
  payload: FeatureFlagWebhookPayload,
  attemptNumber: number = 1
): Promise<void> {
  const supabase = await createClient();
  const maxRetries = webhook.retry_config?.max_retries || 3;
  const backoffMs = webhook.retry_config?.backoff_ms || 1000;

  try {
    // Sign payload if secret is provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CubiQo-Event': payload.event,
      'X-CubiQo-Flag': payload.flag.name,
      'X-CubiQo-Timestamp': payload.timestamp,
    };

    if (webhook.secret) {
      const signature = await signPayload(payload, webhook.secret);
      headers['X-CubiQo-Signature'] = signature;
    }

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const responseBody = await response.text().catch(() => '');

    // Log delivery
    await supabase.from('feature_flag_webhook_logs').insert({
      webhook_id: webhook.id,
      flag_id: payload.flag.id,
      url: webhook.url,
      event: payload.event,
      payload: payload as any,
      status_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limit size
      error: response.ok ? null : `HTTP ${response.status}`,
      attempt_number: attemptNumber,
    });

    // Retry if not successful and retries left
    if (!response.ok && attemptNumber < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, backoffMs * attemptNumber)
      );
      await deliverWebhook(webhook, payload, attemptNumber + 1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log failed delivery
    await supabase.from('feature_flag_webhook_logs').insert({
      webhook_id: webhook.id,
      flag_id: payload.flag.id,
      url: webhook.url,
      event: payload.event,
      payload: payload as any,
      status_code: null,
      response_body: null,
      error: errorMessage,
      attempt_number: attemptNumber,
    });

    // Retry if retries left
    if (attemptNumber < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, backoffMs * attemptNumber)
      );
      await deliverWebhook(webhook, payload, attemptNumber + 1);
    }
  }
}

/**
 * Sign webhook payload with HMAC-SHA256
 */
async function signPayload(
  payload: FeatureFlagWebhookPayload,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    return await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  } catch (error) {
    
    return false;
  }
}
