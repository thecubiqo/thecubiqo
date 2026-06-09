import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { decryptToken } from './token-vault';
import { writeAudit } from './v2-actions';
import { shopifyApiVersion } from '@/next/lib/shopify/constants';

const SHOPIFY_API_VERSION = shopifyApiVersion();

function normalizeShopDomain(value: unknown) {
  let domain = String(value || '').trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) throw new Error('Shopify shop domain is required');
  if (!domain.endsWith('.myshopify.com')) domain = `${domain.replace(/\.myshopify\.com$/, '')}.myshopify.com`;
  return domain;
}

function assertSafeShopifyPath(path: string) {
  const normalized = path.toLowerCase();
  if (/billing|payment|payments|checkout|checkouts|transactions/.test(normalized)) {
    const error = new Error('blocked_shopify_billing');
    error.name = 'blocked_shopify_billing';
    throw error;
  }
}

function sanitizeShopifyError(status: number, body: unknown) {
  const message = typeof body === 'object' && body && 'errors' in body
    ? JSON.stringify((body as Record<string, unknown>).errors).slice(0, 400)
    : `Shopify Admin API request failed with ${status}`;
  return message.replace(/shpat_[A-Za-z0-9_]+/g, '[redacted]');
}

async function loadConnection(auth: ApiUserContext, shopDomain?: string) {
  let query = auth.supabase
    .from('store_connections')
    .select('id,user_id,platform,shop_domain,access_token,scope,status,metadata,connected_at,last_used_at')
    .eq('user_id', auth.user.id)
    .eq('platform', 'shopify')
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1);
  if (shopDomain) query = query.eq('shop_domain', normalizeShopDomain(shopDomain));

  const { data, error } = await query.maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('shopify-connectors', 'store_connections') };
    return { error };
  }
  if (!data) return { blocked: 'Shopify is not connected for this account.', status: 409 as const };
  return { connection: data };
}

async function getAccessToken(auth: ApiUserContext, shopDomain?: string) {
  const loaded = await loadConnection(auth, shopDomain);
  if (!('connection' in loaded)) return loaded;
  await auth.supabase.from('store_connections').update({ last_used_at: new Date().toISOString() }).eq('id', loaded.connection.id);
  return {
    connection: loaded.connection,
    token: decryptToken(loaded.connection.access_token)
  };
}

async function shopifyRequest(
  auth: ApiUserContext,
  shopDomain: string | undefined,
  path: string,
  init: RequestInit = {}
) {
  try {
    assertSafeShopifyPath(path);
  } catch {
    await writeAudit(auth, {
      actionType: 'blocked_shopify_billing',
      toolName: 'shopify_write',
      status: 'blocked',
      message: 'Shopify billing, payment, and checkout endpoints are hard-blocked',
      input: { path },
      blockReason: 'blocked_shopify_billing'
    });
    return { blocked: 'Shopify billing, payment, and checkout endpoints are blocked.', status: 403 as const };
  }
  const loaded = await getAccessToken(auth, shopDomain);
  if (!('token' in loaded)) return loaded;

  const domain = normalizeShopDomain(loaded.connection.shop_domain || shopDomain);
  const response = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}${path}`, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': loaded.token,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    return { error: new Error(sanitizeShopifyError(response.status, body)), status: response.status };
  }
  return { body, shopDomain: domain, connectionId: loaded.connection.id };
}

export async function getProducts(auth: ApiUserContext, shopDomain?: string) {
  return shopifyRequest(auth, shopDomain, '/products.json?limit=50&status=any');
}

export async function createProduct(auth: ApiUserContext, shopDomain: string | undefined, productData: Record<string, unknown>) {
  const result = await shopifyRequest(auth, shopDomain, '/products.json', {
    method: 'POST',
    body: JSON.stringify({ product: productData })
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'shopify_product_created',
    toolName: 'shopify_write',
    status: 'completed',
    message: 'Shopify product draft created through server-side Admin API',
    input: { shopDomain: result.shopDomain, title: productData.title },
    result: { productId: result.body?.product?.id ? String(result.body.product.id) : null }
  });
  return result;
}

export async function updateProduct(auth: ApiUserContext, shopDomain: string | undefined, productId: string, productData: Record<string, unknown>) {
  const result = await shopifyRequest(auth, shopDomain, `/products/${encodeURIComponent(productId)}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: productId, ...productData } })
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'shopify_product_updated',
    toolName: 'shopify_write',
    status: 'completed',
    message: 'Shopify product updated through server-side Admin API',
    input: { shopDomain: result.shopDomain, productId },
    result: { productId }
  });
  return result;
}

export async function getOrders(auth: ApiUserContext, shopDomain?: string) {
  return shopifyRequest(auth, shopDomain, '/orders.json?status=any&limit=50&fields=id,name,created_at,financial_status,fulfillment_status,total_price,currency,line_items');
}

export async function fulfillOrder(auth: ApiUserContext, shopDomain: string | undefined, orderId: string) {
  const fulfillmentOrders = await shopifyRequest(auth, shopDomain, `/orders/${encodeURIComponent(orderId)}/fulfillment_orders.json`);
  if (!('body' in fulfillmentOrders)) return fulfillmentOrders;
  const items = fulfillmentOrders.body?.fulfillment_orders || [];
  const first = Array.isArray(items) ? items[0] : null;
  if (!first?.id) return { blocked: 'No fulfillment order is available for this Shopify order.', status: 409 as const };
  const result = await shopifyRequest(auth, shopDomain, '/fulfillments.json', {
    method: 'POST',
    body: JSON.stringify({
      fulfillment: {
        line_items_by_fulfillment_order: [{ fulfillment_order_id: first.id }],
        notify_customer: false
      }
    })
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'shopify_order_fulfilled',
    toolName: 'shopify_write',
    status: 'completed',
    message: 'Shopify order fulfilment was submitted through server-side Admin API',
    input: { orderId },
    result: { fulfillmentId: result.body?.fulfillment?.id ? String(result.body.fulfillment.id) : null }
  });
  return result;
}

export function assertShopifyBillingBlocked(path: string) {
  try {
    assertSafeShopifyPath(path);
    return null;
  } catch (error) {
    return error instanceof Error ? error.name : 'blocked_shopify_billing';
  }
}
