import { ApiUserContext, cleanEnv, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { decryptToken } from './token-vault';
import { writeAudit } from './v2-actions';
import { getPodProvider } from '@/next/lib/pod/pod-provider-registry';

function defaultPrintifyApiBase() {
  return cleanEnv(process.env.PRINTIFY_API_BASE_URL) || getPodProvider('printify')?.apiUrl || 'https://api.printify.com/v1';
}

async function resolvePrintifyApiBase(auth: ApiUserContext) {
  const { data, error } = await auth.supabase
    .from('pod_providers')
    .select('api_url')
    .eq('provider', 'printify')
    .eq('status', 'active')
    .maybeSingle();

  if (error && !safeTableMissing(error)) return { error };
  return { apiBase: cleanEnv(data?.api_url) || defaultPrintifyApiBase() };
}

function sanitizePrintifyError(status: number, body: unknown) {
  const message = typeof body === 'object' && body
    ? String((body as Record<string, unknown>).message || (body as Record<string, unknown>).error || `Printify request failed with ${status}`)
    : `Printify request failed with ${status}`;
  return message.replace(/[A-Za-z0-9_-]{30,}/g, '[redacted]');
}

async function loadConnection(auth: ApiUserContext) {
  const { data, error } = await auth.supabase
    .from('store_connections')
    .select('id,user_id,platform,shop_domain,access_token,scope,status,metadata,connected_at,last_used_at')
    .eq('user_id', auth.user.id)
    .eq('platform', 'printify')
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('printify-connectors', 'store_connections') };
    return { error };
  }
  if (!data && cleanEnv(process.env.PRINTIFY_API_KEY)) {
    return {
      connection: {
        id: null,
        shop_domain: cleanEnv(process.env.PRINTIFY_SHOP_ID) || null,
        access_token: '',
        metadata: { source: 'server_env' }
      },
      envToken: cleanEnv(process.env.PRINTIFY_API_KEY)
    };
  }
  if (!data) return { blocked: 'Printify is not connected for this account.', status: 409 as const };
  return { connection: data, envToken: null };
}

async function getAccessToken(auth: ApiUserContext) {
  const loaded = await loadConnection(auth);
  if (!('connection' in loaded)) return loaded;
  if (loaded.connection.id) {
    await auth.supabase.from('store_connections').update({ last_used_at: new Date().toISOString() }).eq('id', loaded.connection.id);
  }
  return {
    connection: loaded.connection,
    token: loaded.envToken || decryptToken(loaded.connection.access_token)
  };
}

async function printifyRequest(auth: ApiUserContext, path: string, init: RequestInit = {}) {
  const loaded = await getAccessToken(auth);
  if (!('token' in loaded)) return loaded;
  const resolvedBase = await resolvePrintifyApiBase(auth);
  if ('error' in resolvedBase && resolvedBase.error) return { error: resolvedBase.error };
  const response = await fetch(`${resolvedBase.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${loaded.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CubiQo/1.0',
      ...(init.headers || {})
    }
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    return { error: new Error(sanitizePrintifyError(response.status, body)), status: response.status };
  }
  return { body, connectionId: loaded.connection.id, shopId: loaded.connection.shop_domain || null };
}

async function getShopId(auth: ApiUserContext) {
  const loaded = await getAccessToken(auth);
  if (!('token' in loaded)) return loaded;
  if (loaded.connection.shop_domain) return { shopId: loaded.connection.shop_domain };
  const shops = await printifyRequest(auth, '/shops.json');
  if (!('body' in shops)) return shops;
  const first = Array.isArray(shops.body) ? shops.body[0] : shops.body?.data?.[0];
  const shopId = first?.id ? String(first.id) : '';
  if (!shopId) return { blocked: 'Printify account has no shop id available.', status: 409 as const };
  if (loaded.connection.id) {
    await auth.supabase.from('store_connections').update({ shop_domain: shopId }).eq('id', loaded.connection.id);
  }
  return { shopId };
}

export async function getPrintProviders(auth: ApiUserContext) {
  return printifyRequest(auth, '/catalog/print_providers.json');
}

export async function getProducts(auth: ApiUserContext) {
  const shop = await getShopId(auth);
  if (!('shopId' in shop)) return shop;
  return printifyRequest(auth, `/shops/${encodeURIComponent(shop.shopId)}/products.json`);
}

export async function createProduct(auth: ApiUserContext, productData: Record<string, unknown>) {
  const shop = await getShopId(auth);
  if (!('shopId' in shop)) return shop;
  const result = await printifyRequest(auth, `/shops/${encodeURIComponent(shop.shopId)}/products.json`, {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'printify_product_created',
    toolName: 'printify_write',
    status: 'completed',
    message: 'Printify product created through server-side API',
    input: { title: productData.title, shopId: shop.shopId },
    result: { productId: result.body?.id || result.body?.product?.id || null }
  });
  return result;
}

export async function publishProduct(auth: ApiUserContext, productId: string) {
  const shop = await getShopId(auth);
  if (!('shopId' in shop)) return shop;
  const result = await printifyRequest(auth, `/shops/${encodeURIComponent(shop.shopId)}/products/${encodeURIComponent(productId)}/publish.json`, {
    method: 'POST',
    body: JSON.stringify({
      title: true,
      description: true,
      images: true,
      variants: true,
      tags: true
    })
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'printify_product_published',
    toolName: 'printify_write',
    status: 'completed',
    message: 'Printify product publish was submitted after user confirmation',
    input: { productId, shopId: shop.shopId },
    result: { productId }
  });
  return result;
}

export async function getOrders(auth: ApiUserContext) {
  const shop = await getShopId(auth);
  if (!('shopId' in shop)) return shop;
  return printifyRequest(auth, `/shops/${encodeURIComponent(shop.shopId)}/orders.json`);
}

export async function submitOrder(auth: ApiUserContext, orderData: Record<string, unknown>) {
  const shop = await getShopId(auth);
  if (!('shopId' in shop)) return shop;
  const result = await printifyRequest(auth, `/shops/${encodeURIComponent(shop.shopId)}/orders.json`, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  if (!('body' in result)) return result;
  await writeAudit(auth, {
    actionType: 'printify_order_submitted',
    toolName: 'printify_write',
    status: 'completed',
    message: 'Printify order submitted through server-side API',
    input: { shopId: shop.shopId },
    result: { orderId: result.body?.id || null }
  });
  return result;
}

export async function validatePrintifyToken(apiKey: string) {
  const response = await fetch(`${defaultPrintifyApiBase()}/shops.json`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CubiQo/1.0'
    }
  });
  const raw = await response.text();
  const body = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    return { ok: false, status: response.status, error: sanitizePrintifyError(response.status, body) };
  }
  return { ok: true, shops: body };
}
