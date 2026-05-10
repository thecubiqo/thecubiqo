import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cleanEnv, getSupabaseAdmin, safeTableMissing } from '../../../_lib/supabase-admin';
import { encryptToken, tokenHint } from '../../../_lib/token-vault';

export const runtime = 'nodejs';

function normalizeShopDomain(value: unknown) {
  let domain = String(value || '').trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) return '';
  if (!domain.endsWith('.myshopify.com')) domain = `${domain.replace(/\.myshopify\.com$/, '')}.myshopify.com`;
  return domain;
}

function verifyShopifyHmac(params: URLSearchParams, secret: string) {
  const hmac = params.get('hmac') || '';
  if (!hmac) return false;
  const message = [...params.entries()]
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(hmac, 'utf8'));
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.redirect(new URL('/actions?connector=shopify&status=server_config_missing', request.url));

  const clientSecret = cleanEnv(process.env.SHOPIFY_CLIENT_SECRET);
  const clientId = cleanEnv(process.env.SHOPIFY_CLIENT_ID);
  if (!clientSecret || !clientId) {
    return NextResponse.redirect(new URL('/actions?connector=shopify&status=oauth_env_missing', request.url));
  }

  const params = request.nextUrl.searchParams;
  if (!verifyShopifyHmac(params, clientSecret)) {
    return NextResponse.redirect(new URL('/actions?connector=shopify&status=hmac_failed', request.url));
  }

  const code = params.get('code') || '';
  const state = params.get('state') || '';
  const shop = normalizeShopDomain(params.get('shop'));
  if (!code || !state || !shop) {
    return NextResponse.redirect(new URL('/actions?connector=shopify&status=missing_callback_params', request.url));
  }

  const { data: stateRow, error: stateError } = await supabase
    .from('connector_oauth_states')
    .select('*')
    .eq('state', state)
    .eq('platform', 'shopify')
    .maybeSingle();
  if (stateError || !stateRow || stateRow.used_at || new Date(stateRow.expires_at).getTime() < Date.now() || stateRow.shop_domain !== shop) {
    return NextResponse.redirect(new URL('/actions?connector=shopify&status=state_failed', request.url));
  }

  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenBody.access_token) {
    return NextResponse.redirect(new URL('/actions?connector=shopify&status=token_exchange_failed', request.url));
  }

  const encrypted = encryptToken(String(tokenBody.access_token));
  const scope = String(tokenBody.scope || '');
  const upsert = await supabase
    .from('store_connections')
    .upsert({
      user_id: stateRow.user_id,
      platform: 'shopify',
      shop_domain: shop,
      access_token: encrypted,
      scope,
      status: 'active',
      metadata: {
        token_hint: tokenHint(String(tokenBody.access_token)),
        oauth_connected_at: new Date().toISOString()
      },
      connected_at: new Date().toISOString(),
      last_used_at: null
    }, { onConflict: 'user_id,platform,shop_domain' })
    .select('id')
    .single();

  if (upsert.error) {
    const status = safeTableMissing(upsert.error) ? 'migration_missing' : 'store_failed';
    return NextResponse.redirect(new URL(`/actions?connector=shopify&status=${status}`, request.url));
  }

  await supabase.from('connector_oauth_states').update({ used_at: new Date().toISOString() }).eq('id', stateRow.id);
  await supabase.from('action_audit_logs').insert({
    user_id: stateRow.user_id,
    action_type: 'shopify_connected',
    tool_name: 'shopify_read',
    status: 'completed',
    message: 'Shopify OAuth completed and token was stored encrypted server-side',
    input: { shopDomain: shop, scope },
    result: { connectionId: upsert.data.id, tokenExposed: false }
  });

  return NextResponse.redirect(new URL('/actions?connector=shopify&status=connected', request.url));
}
