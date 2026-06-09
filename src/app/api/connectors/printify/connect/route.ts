import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../../_lib/supabase-admin';
import { encryptToken, tokenHint } from '../../../_lib/token-vault';
import { validatePrintifyToken } from '../../../_lib/printify-client';
import { writeAudit } from '../../../_lib/v2-actions';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const apiKey = normalizeText(body.apiKey ?? body.api_key, 2400);
  if (!apiKey) return NextResponse.json({ error: 'Printify API key is required' }, { status: 400 });

  const validation = await validatePrintifyToken(apiKey);
  if (!validation.ok) {
    await writeAudit(auth, {
      actionType: 'printify_connected',
      toolName: 'printify_write',
      status: 'blocked',
      message: 'Printify API key validation failed before storage',
      blockReason: 'invalid_printify_key',
      result: { status: validation.status }
    });
    return NextResponse.json({ error: validation.error || 'Printify API key validation failed', stored: false }, { status: 401 });
  }

  const shops = Array.isArray(validation.shops) ? validation.shops : validation.shops?.data || [];
  const firstShop = Array.isArray(shops) ? shops[0] : null;
  const shopId = firstShop?.id ? String(firstShop.id) : null;
  const scope = 'printify_api_key';
  const encrypted = encryptToken(apiKey);

  const { data, error } = await auth.supabase
    .from('store_connections')
    .upsert({
      user_id: auth.user.id,
      platform: 'printify',
      shop_domain: shopId,
      access_token: encrypted,
      scope,
      status: 'active',
      metadata: {
        token_hint: tokenHint(apiKey),
        shop_name: firstShop?.title || firstShop?.sales_channel || null,
        connected_at: new Date().toISOString()
      },
      connected_at: new Date().toISOString()
    }, { onConflict: 'user_id,platform,shop_domain' })
    .select('id,platform,shop_domain,scope,status,metadata,connected_at,last_used_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('printify-connectors', 'store_connections');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAudit(auth, {
    actionType: 'printify_connected',
    toolName: 'printify_write',
    status: 'completed',
    message: 'Printify API key validated and stored encrypted server-side',
    input: { shopId },
    result: { connectionId: data.id, tokenExposed: false }
  });

  return NextResponse.json({ connected: true, connection: data, tokenExposed: false });
}
