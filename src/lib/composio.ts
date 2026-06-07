// Composio 0.6.x integration — Vercel AI SDK provider
// API shape: composio.tools.get(userId, { toolkits: [...], limit })
//            composio.toolkits.authorize(userId, toolkitSlug)  → { redirectUrl }
//            composio.connectedAccounts.list({ userIds: [userId] })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _composio: any = null;

export const COMPOSIO_APPS = {
  GMAIL:        'gmail',
  LINKEDIN:     'linkedin',
  GOOGLE_DRIVE: 'googledrive',
  GITHUB:       'github',
  SLACK:        'slack',
  NOTION:       'notion',
  TWITTER:      'twitter',
} as const;

export type ComposioApp = typeof COMPOSIO_APPS[keyof typeof COMPOSIO_APPS];

export function getComposio() {
  if (!_composio) {
    if (!process.env.COMPOSIO_API_KEY) throw new Error('COMPOSIO_API_KEY not set');
    // Dynamic require avoids type conflicts with other AI SDK providers
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
 * Get Vercel AI SDK-compatible tools for a user, optionally filtered to specific apps.
 * Apps the user hasn't connected yet are silently skipped by Composio.
 */
export async function getUserTools(userId: string, apps?: ComposioApp[]) {
  const composio = getComposio();
  // composio.tools.get(userId, filterOptions) → Vercel AI SDK tool map
  const filterOpts = apps ? { toolkits: apps, limit: 40 } : { limit: 60 };
  return composio.tools.get(userId, filterOpts) as Promise<Record<string, unknown>>;
}

/**
 * Initiate OAuth connection for a specific app.
 * Returns a redirectUrl the user must visit in a browser to authorise.
 */
export async function initiateConnection(
  userId: string,
  app: ComposioApp,
  callbackUrl?: string
): Promise<{ redirectUrl: string | null }> {
  const composio = getComposio();
  // composio.toolkits.authorize handles auth-config discovery automatically
  const connectionRequest = await composio.toolkits.authorize(
    userId,
    app,
    // callbackUrl support varies per Composio version — pass if provided
    callbackUrl ? { callbackUrl } : undefined
  );
  return { redirectUrl: connectionRequest.redirectUrl ?? null };
}

/**
 * List all connected accounts for a user.
 * Returns array of { id, toolkitSlug, status, createdAt }.
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
