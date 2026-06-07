/**
 * POST /api/composio/connect
 * Initiates OAuth connection for a Composio-supported app (gmail, linkedin, etc.)
 * Returns { redirectUrl } — frontend opens this URL so the user can authorise.
 *
 * Body: { app: 'gmail' | 'linkedin' | 'googledrive' | 'github' | 'slack' | 'notion' }
 */
import { createClient } from '@supabase/supabase-js';
import { initiateConnection, type ComposioApp } from '@/next/lib/composio';

export const maxDuration = 30;
export const runtime = 'nodejs';

const SUPPORTED_APPS: ComposioApp[] = [
  'gmail', 'linkedin', 'googledrive', 'github', 'slack', 'notion', 'twitter',
];

async function getAuthenticatedUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!process.env.COMPOSIO_API_KEY) {
    return Response.json({ error: 'Composio not configured.' }, { status: 503 });
  }

  const userId = await getAuthenticatedUserId(request.headers.get('authorization'));
  if (!userId) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { app } = await request.json();
  if (!app || !SUPPORTED_APPS.includes(app)) {
    return Response.json(
      { error: `Unsupported app. Valid options: ${SUPPORTED_APPS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const result = await initiateConnection(userId, app as ComposioApp);
    if (result.error) return Response.json({ error: result.error }, { status: 500 });
    return Response.json({
      app,
      oauthUrl: result.oauthUrl,
      linkToken: result.linkToken,
      accountId: result.accountId,
      message: `Open oauthUrl in a browser to connect ${app}`,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
