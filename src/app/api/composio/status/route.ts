/**
 * GET /api/composio/status
 * Returns the list of connected Composio apps for the authenticated user.
 * Response: { connected: [{ id, toolkit, status }] }
 */
import { createClient } from '@supabase/supabase-js';
import { getConnectedApps } from '@/next/lib/composio';

export const maxDuration = 20;
export const runtime = 'nodejs';

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

export async function GET(request: Request) {
  if (!process.env.COMPOSIO_API_KEY) {
    return Response.json({ connected: [], note: 'Composio not configured.' });
  }

  const userId = await getAuthenticatedUserId(request.headers.get('authorization'));
  if (!userId) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const connected = await getConnectedApps(userId);
    return Response.json({ connected, userId });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
