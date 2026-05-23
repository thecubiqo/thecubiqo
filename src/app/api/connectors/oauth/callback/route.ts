import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { buildOAuthAdapter, buildShopifyAdapter } from '@/next/lib/connectors/registry';

export const runtime = 'nodejs';

const OAuthStateSchema = z.object({
  userId: z.string().uuid(),
  platform: z.string().min(1).max(80).transform(value => value.trim().toLowerCase()),
  nonce: z.string().min(8).max(200),
  shopName: z.string().min(1).max(120).nullable().optional(),
});

function popupMessage(type: 'OAUTH_SUCCESS' | 'OAUTH_ERROR', payload: Record<string, string>) {
  const safePayload = JSON.stringify({ type, ...payload }).replace(/</g, '\\u003c');
  return new NextResponse(
    `<script>window.opener?.postMessage(${safePayload}, window.location.origin);window.close();</script>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return popupMessage('OAUTH_ERROR', { error });
  if (!code || !stateParam) return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 });

  const rawState = (() => {
    try {
      return JSON.parse(stateParam);
    } catch {
      return null;
    }
  })();
  const parsedState = OAuthStateSchema.safeParse(rawState);
  if (!parsedState.success) return NextResponse.json({ error: 'Invalid state' }, { status: 400 });

  const { data: storedState } = await supabase
    .from('oauth_states')
    .select('user_id')
    .eq('state', parsedState.data.nonce)
    .eq('platform', parsedState.data.platform)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!storedState || storedState.user_id !== parsedState.data.userId) {
    return NextResponse.json({ error: 'State mismatch' }, { status: 400 });
  }

  const adapter = parsedState.data.platform === 'shopify' && parsedState.data.shopName
    ? buildShopifyAdapter(parsedState.data.shopName)
    : await buildOAuthAdapter(parsedState.data.platform);
  if (!adapter) return NextResponse.json({ error: 'Platform not found' }, { status: 404 });

  await adapter.exchangeCode(code, parsedState.data.userId);
  await supabase.from('oauth_states').delete().eq('state', parsedState.data.nonce);

  return popupMessage('OAUTH_SUCCESS', { platform: parsedState.data.platform });
}
