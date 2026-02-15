// Founders Pass: OAuth helpers for token encryption and provider flows

import crypto from 'crypto';
import type { OAuthProvider } from './types';
import { OAUTH_PROVIDERS } from './types';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key) throw new Error('OAUTH_ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Build the OAuth authorization URL for a given provider.
 */
export function buildAuthUrl(
  provider: OAuthProvider,
  opts: {
    redirectUri: string;
    state: string;
    scopes?: string[];
    shopDomain?: string; // Shopify only
  },
): string {
  const cfg = OAUTH_PROVIDERS[provider];
  const scopes = opts.scopes ?? cfg.scopes;

  if (provider === 'shopify' && opts.shopDomain) {
    return `https://${opts.shopDomain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_CLIENT_ID}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(opts.redirectUri)}&state=${opts.state}`;
  }

  const params = new URLSearchParams({
    client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] ?? '',
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state: opts.state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `${cfg.authUrl}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  shopDomain?: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number; scopes: string[] }> {
  const cfg = OAUTH_PROVIDERS[provider];
  let tokenUrl = cfg.tokenUrl;

  if (provider === 'shopify' && shopDomain) {
    tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`] ?? '',
    client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] ?? '',
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth token exchange failed for ${provider}: ${text}`);
  }

  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresIn: json.expires_in,
    scopes: (json.scope ?? '').split(/[, ]+/).filter(Boolean),
  };
}

/**
 * Store encrypted OAuth tokens in Supabase.
 */
export async function storeTokens(
  userId: string,
  provider: OAuthProvider,
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number; scopes: string[] },
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const payload = {
    user_id: userId,
    provider,
    access_token_encrypted: encryptToken(tokens.accessToken),
    refresh_token_encrypted: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
    token_type: 'Bearer',
    scopes: tokens.scopes,
    expires_at: tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await sb
    .from('oauth_tokens')
    .upsert(payload, { onConflict: 'user_id,provider' });

  if (error) throw new Error(`storeTokens: ${error.message}`);
}

/**
 * Retrieve and decrypt a user's token for a provider.
 */
export async function getDecryptedToken(
  userId: string,
  provider: OAuthProvider,
): Promise<{ accessToken: string; refreshToken?: string; scopes: string[] } | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await sb
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error || !data) return null;

  return {
    accessToken: decryptToken(data.access_token_encrypted),
    refreshToken: data.refresh_token_encrypted
      ? decryptToken(data.refresh_token_encrypted)
      : undefined,
    scopes: data.scopes ?? [],
  };
}
