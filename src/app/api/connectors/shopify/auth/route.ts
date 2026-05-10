import { NextRequest, NextResponse } from 'next/server';
import { cleanEnv, requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_inventory'
] as const;

function normalizeShopDomain(value: unknown) {
  let domain = String(value || '').trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!domain) return '';
  if (!domain.endsWith('.myshopify.com')) domain = `${domain.replace(/\.myshopify\.com$/, '')}.myshopify.com`;
  return domain;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const clientId = cleanEnv(process.env.SHOPIFY_CLIENT_ID);
  if (!clientId) return NextResponse.json({ error: 'SHOPIFY_CLIENT_ID is not configured' }, { status: 500 });

  const shop = normalizeShopDomain(request.nextUrl.searchParams.get('shop'));
  if (!shop) return NextResponse.json({ error: 'shop is required, for example carlophillips.myshopify.com' }, { status: 400 });

  const state = crypto.randomUUID();
  const redirectUri = new URL('/api/connectors/shopify/callback', request.nextUrl.origin).toString();
  const { error } = await auth.supabase.from('connector_oauth_states').insert({
    user_id: auth.user.id,
    platform: 'shopify',
    state,
    shop_domain: shop,
    redirect_uri: redirectUri,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', SHOPIFY_SCOPES.join(','));
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  return NextResponse.json({
    authUrl: url.toString(),
    shop,
    scopes: SHOPIFY_SCOPES,
    redirect: 'client_navigates'
  });
}
