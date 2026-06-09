/**
 * Composio 0.6.x integration — Vercel AI SDK provider
 *
 * Connection flow (Composio v3 API — the SDK's toolkits.authorize() is deprecated):
 *   1. GET /api/v3/auth_configs?toolkit=<app>  →  find auth_config_id for that app
 *   2. POST /api/v3/connected_accounts/link    →  create connection, get link_token + redirect_url
 *   3. POST /api/v3/internal/connected_accounts/link/{token}  →  exchange token for real OAuth URL
 *   4. Redirect user to OAuth URL → LinkedIn/Google authorize → Composio callback → ACTIVE
 *
 * Tool retrieval:
 *   composio.tools.get(userId, { toolkits: [...], limit })  →  Vercel AI SDK tool map
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _composio: any = null;

export const COMPOSIO_APPS = {
  GMAIL:             'gmail',
  LINKEDIN:          'linkedin',
  GOOGLE_DRIVE:      'googledrive',
  GITHUB:            'github',
  SLACK:             'slack',
  NOTION:            'notion',
  TWITTER:           'twitter',
  SUPABASE:          'supabase',
  GOOGLE_CALENDAR:   'googlecalendar',
  CANVA:             'canva',
  FIGMA:             'figma',
  INSTAGRAM:         'instagram',
  YOUTUBE:           'youtube',
} as const;

export type ComposioApp = typeof COMPOSIO_APPS[keyof typeof COMPOSIO_APPS];

const COMPOSIO_BACKEND = 'https://backend.composio.dev';

export function getComposio() {
  if (!_composio) {
    if (!process.env.COMPOSIO_API_KEY) throw new Error('COMPOSIO_API_KEY not set');
    const { Composio } = require('@composio/core');
    const { VercelProvider } = require('@composio/vercel');
    _composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }
  return _composio;
}

/**
 * Get Vercel AI SDK-compatible tools for a user, filtered to specific connected apps.
 * Apps the user hasn't connected yet are silently skipped by Composio.
 */
export async function getUserTools(userId: string, apps?: ComposioApp[]) {
  const composio = getComposio();
  const filterOpts = apps ? { toolkits: apps, limit: 40 } : { limit: 60 };
  return composio.tools.get(userId, filterOpts) as Promise<Record<string, unknown>>;
}

/**
 * Initiate OAuth connection using Composio v3 link API.
 * Returns { oauthUrl, linkToken, accountId } — navigate user to oauthUrl to authorise.
 *
 * This replaces the deprecated composio.toolkits.authorize() method.
 */
export async function initiateConnection(
  userId: string,
  app: ComposioApp
): Promise<{ oauthUrl: string | null; linkToken: string | null; accountId: string | null; error?: string }> {
  const apiKey = process.env.COMPOSIO_API_KEY!;

  try {
    // Step 1: Find the auth config for this specific toolkit
    const configRes = await fetch(
      `${COMPOSIO_BACKEND}/api/v3/auth_configs?toolkit=${app}&page=1&page_size=10`,
      { headers: { 'x-api-key': apiKey } }
    );
    const configData = await configRes.json() as { items?: Array<{ id: string; name: string; toolkitSlug?: string }> };

    // Pick the config that matches this toolkit exactly (not a partial match from another toolkit)
    const matchingConfig = (configData.items ?? []).find(
      c => c.name.toLowerCase().includes(app.toLowerCase()) || (c.toolkitSlug ?? '').toLowerCase() === app.toLowerCase()
    ) ?? configData.items?.[0];

    if (!matchingConfig) return { oauthUrl: null, linkToken: null, accountId: null, error: `No auth config found for ${app}` };

    // Step 2: Create a connection link
    const linkRes = await fetch(`${COMPOSIO_BACKEND}/api/v3/connected_accounts/link`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_config_id: matchingConfig.id, user_id: userId }),
    });
    const linkData = await linkRes.json() as {
      link_token?: string;
      redirect_url?: string;
      connected_account_id?: string;
      error?: unknown;
    };

    if (!linkData.link_token) {
      return { oauthUrl: null, linkToken: null, accountId: null, error: `Link creation failed: ${JSON.stringify(linkData.error)}` };
    }

    // Step 3: Exchange link token for the real OAuth URL
    const oauthRes = await fetch(
      `${COMPOSIO_BACKEND}/api/v3/internal/connected_accounts/link/${linkData.link_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: {}, accountType: 'PRIVATE' }),
      }
    );
    const oauthData = await oauthRes.json() as { status?: string; redirect_url?: string };

    return {
      oauthUrl: oauthData.redirect_url ?? null,
      linkToken: linkData.link_token,
      accountId: linkData.connected_account_id ?? null,
    };
  } catch (err) {
    return { oauthUrl: null, linkToken: null, accountId: null, error: String(err) };
  }
}

/**
 * List all connected (ACTIVE) accounts for a user.
 */
export async function getConnectedApps(userId: string): Promise<Array<{
  id: string;
  toolkit: string;
  status: string;
}>> {
  const composio = getComposio();
  const result = await composio.connectedAccounts.list({ userIds: [userId] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result.items ?? []).map((item: any) => ({
    id: item.id,
    toolkit: item.toolkit?.slug ?? item.appName ?? 'unknown',
    status: item.status ?? 'unknown',
  }));
}
