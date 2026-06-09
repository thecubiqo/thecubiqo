import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, jsonError } from '../../../../_lib/supabase-admin';
import { shouldUseProviderMock } from '@/next/lib/providers/live-provider-guard';

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

  const tokens = shouldUseProviderMock()
    ? { access_token: `mock-${normalized}-token`, refresh_token: null, expires_in: 3600, scope: '' }
    : await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${baseUrl}/api/duo/connectors/${normalized}/callback`,
        }),
      })
        .then(async (tokenRes) => tokenRes.ok ? tokenRes.json() : null)
        .catch(() => null);
  if (!tokens?.access_token) return jsonError('No access token in response', 502);

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Two-step upsert: expression-based unique index doesn't support Supabase onConflict.
  // Check for existing row first, then update or insert.
  const extAccountId = shop || null;
  let existingQuery = supabase
    .from('user_connectors')
    .select('id')
    .eq('user_id', stateData.userId)
    .eq('platform', normalized);
  existingQuery = extAccountId
    ? existingQuery.eq('external_account_id', extAccountId)
    : existingQuery.is('external_account_id', null);
  const { data: existing } = await existingQuery.maybeSingle();

  const connectorPayload = {
    user_id: stateData.userId,
    platform: normalized,
    category: normalized === 'github' ? 'code' : normalized === 'shopify' ? 'commerce' : 'docs',
    status: 'available',
    auth_type: 'oauth',
    scopes: tokens.scope ? tokens.scope.split(/[ ,]+/) : [],
    external_account_id: extAccountId,
    expires_at: expiresAt,
    last_health_check_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let connector: { id: string } | null = null;
  let connectorError: unknown = null;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('user_connectors')
      .update(connectorPayload)
      .eq('id', existing.id)
      .select('id')
      .single();
    connector = data;
    connectorError = error;
  } else {
    const { data, error } = await supabase
      .from('user_connectors')
      .insert(connectorPayload)
      .select('id')
      .single();
    connector = data;
    connectorError = error;
  }

  if (connectorError || !connector) return jsonError('Failed to save connector', 500);

  // Store tokens in connector_secrets. This table is service-role only; until
  // Vault/KMS is wired, the column names explicitly mark plaintext material.
  await supabase.from('connector_secrets').upsert({
    user_id: stateData.userId,
    connector_id: connector.id,
    platform: normalized,
    secret_ref: `${normalized}:${connector.id}:oauth`,
    access_token_plaintext: tokens.access_token,
    refresh_token_plaintext: tokens.refresh_token || null,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'connector_id' });

  // Redirect user back to connectors page
  return NextResponse.redirect(`${baseUrl}/duo/connectors?connected=${normalized}`);
}
