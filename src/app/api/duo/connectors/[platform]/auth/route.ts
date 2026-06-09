import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, jsonError } from '../../../../_lib/supabase-admin';

export const runtime = 'nodejs';

// OAuth config per platform (extend as new connectors are added)
const OAUTH_CONFIG: Record<string, { authUrl: string; clientIdEnv: string; scopes: string }> = {
  shopify: {
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    clientIdEnv: 'SHOPIFY_CLIENT_ID',
    scopes: 'read_products,write_products,read_orders',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    clientIdEnv: 'GITHUB_CLIENT_ID',
    scopes: 'repo,read:user',
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { platform } = await params;
  const normalized = platform.toLowerCase();

  const config = OAUTH_CONFIG[normalized];
  if (!config) return jsonError(`OAuth not configured for ${normalized}`, 400);

  const clientId = process.env[config.clientIdEnv];
  if (!clientId) return jsonError(`${config.clientIdEnv} not set`, 500);

  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/duo/connectors/${normalized}/callback`;
  const state = Buffer.from(JSON.stringify({ userId: auth.user.id, platform: normalized })).toString('base64url');

  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop'); // Shopify-specific

  const authUrl = config.authUrl.replace('{shop}', shop || '');
  const urlParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: config.scopes,
    state,
    response_type: 'code',
  });

  return NextResponse.json({ url: `${authUrl}?${urlParams}` });
}
