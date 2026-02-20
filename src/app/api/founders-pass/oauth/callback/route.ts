// API: OAuth callback handler for all providers
import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, storeTokens } from '@/lib/founders-pass/oauth';
import { emitEvent, writeAuditLog } from '@/lib/founders-pass/service';
import type { OAuthProvider } from '@/lib/founders-pass/types';

const VALID_PROVIDERS = ['gmail', 'shopify', 'printify', 'printful', 'stripe', 'uber'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/founders-pass?oauth_error=${encodeURIComponent(error)}`, req.url),
      );
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    // State format: provider:userId:siteId
    const [provider, userId, siteId] = state.split(':');

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider in state' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid userId in state' }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/founders-pass/oauth/callback`;

    const tokens = await exchangeCode(
      provider as OAuthProvider,
      code,
      redirectUri,
      searchParams.get('shop') ?? undefined,
    );

    await storeTokens(userId, provider as OAuthProvider, tokens);

    await writeAuditLog({
      actor_id: userId,
      action: 'oauth.connected',
      resource_type: 'oauth_token',
      resource_id: provider,
      details: { scopes: tokens.scopes, site_id: siteId },
    });

    await emitEvent({
      siteId: siteId || undefined,
      userId,
      eventType: 'oauth_connected',
      eventData: { provider, scopes: tokens.scopes },
    });

    // Redirect back to the site or admin
    const returnUrl = siteId
      ? `/sites/${siteId}?oauth_success=${provider}`
      : `/founders-pass?oauth_success=${provider}`;

    return NextResponse.redirect(new URL(returnUrl, req.url));
  } catch (err) {
    
    return NextResponse.redirect(
      new URL(
        `/founders-pass?oauth_error=${encodeURIComponent(err instanceof Error ? err.message : 'Unknown error')}`,
        req.url,
      ),
    );
  }
}
