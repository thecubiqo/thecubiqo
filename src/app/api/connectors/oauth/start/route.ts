import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { buildOAuthAdapter, buildShopifyAdapter, getRegistryRow } from '@/next/lib/connectors/registry';

export const runtime = 'nodejs';

const StartSchema = z.object({
  platform: z.string().min(1).max(80).transform(value => value.trim().toLowerCase()),
  shopName: z.string().min(1).max(120).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = StartSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid OAuth start payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { platform, shopName } = parsed.data;
  const row = await getRegistryRow(platform);
  if (!row) return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  if (row.adapter_type !== 'oauth2') return NextResponse.json({ error: 'Platform is not OAuth' }, { status: 400 });

  const adapter = platform === 'shopify' && shopName
    ? buildShopifyAdapter(shopName)
    : await buildOAuthAdapter(platform);
  if (!adapter) {
    return NextResponse.json({ error: 'OAuth credentials not configured for this platform' }, { status: 501 });
  }

  const nonce = randomUUID();
  const statePayload = { userId: auth.user.id, platform, nonce, shopName: shopName || null };
  const { error } = await auth.supabase.from('oauth_states').insert({
    state: nonce,
    user_id: auth.user.id,
    platform,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (safeTableMissing(error)) return NextResponse.json({ error: 'OAuth state table missing', migrationPending: true }, { status: 500 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const authUrl = adapter.buildAuthUrl(auth.user.id, nonce).replace(
    encodeURIComponent(JSON.stringify({ userId: auth.user.id, platform: adapter.platform, nonce })),
    encodeURIComponent(JSON.stringify(statePayload)),
  );

  return NextResponse.json({ authUrl });
}
