import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, jsonError } from '../../../../_lib/supabase-admin';

export const runtime = 'nodejs';

const TOKEN_ENDPOINTS: Record<string, { tokenUrl: string; clientIdEnv: string; secretEnv: string }> = {
  shopify: { tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token', clientIdEnv: 'SHOPIFY_CLIENT_ID', secretEnv: 'SHOPIFY_CLIENT_SECRET' },
  github:  { tokenUrl: 'https://github.com/login/oauth/access_token',            clientIdEnv: 'GITHUB_CLIENT_ID',   secretEnv: 'GITHUB_CLIENT_SECRET' },
  google:  { tokenUrl: 'https://oauth2.googleapis.com/token',                     clientIdEnv: 'GOOGLE_CLIENT_ID',   secretEnv: 'GOOGLE_CLIENT_SECRET' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError('Config error', 500);

  const { platform } = await params;
  const normalized = platform.toLowerCase();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');

  if (!code || !stateRaw) return jsonError('Missing code or state', 400);

  let stateData: { userId: string; platform: string };
  try {
    stateData = JSON.parse(Buffer.from(stateRaw, 'base64url').toString());
  } catch {
    return jsonError('Invalid state', 400);
  }

  const config = TOKEN_ENDPOINTS[normalized];
  if (!config) return jsonError(`Token exchange not configured for ${normalized}`, 400);

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.secretEnv];
  if (!clientId || !clientSecret) return jsonError('OAuth credentials not set', 500);

  const shop = searchParams.get('shop');
  const tokenUrl = config.tokenUrl.replace('{shop}', shop || '');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  // Exchange authorization code for tokens
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${baseUrl}/api/duo/connectors/${normalized}/callback`,
    }),
  }).catch(() => null);

  if (!tokenRes?.ok) return jsonError('Token exchange failed', 502);
  const tokens = await tokenRes.json().catch(() => null);
  if (!tokens?.access_token) return jsonError('No access token in response', 502);

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Upsert connector row (upsert on user_id + platform expression index)
  const { data: connector, error: connectorError } = await supabase
    .from('user_connectors')
    .upsert({
      user_id: stateData.userId,
      platform: normalized,
      category: normalized === 'github' ? 'code' : normalized === 'shopify' ? 'commerce' : 'docs',
      status: 'available',
      auth_type: 'oauth',
      scopes: tokens.scope ? tokens.scope.split(/[ ,]+/) : [],
      external_account_id: shop || null,
      expires_at: expiresAt,
      last_health_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (connectorError || !connector) return jsonError('Failed to save connector', 500);

  // Store tokens in connector_secrets (service role only — never returned to client)
  // TODO: encrypt tokens at rest using SUPABASE_VAULT_KEY before storing
  await supabase.from('connector_secrets').upsert({
    connector_id: connector.id,
    encrypted_access_token: tokens.access_token,
    encrypted_refresh_token: tokens.refresh_token || null,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'connector_id' });

  // Redirect user back to connectors page
  return NextResponse.redirect(`${baseUrl}/duo/connectors?connected=${normalized}`);
}
