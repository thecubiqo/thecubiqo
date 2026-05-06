import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const PROVIDERS = ['shopify', 'printify', 'printful', 'stripe'];

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('integration_connections')
    .select('id,provider,status,metadata,created_at,updated_at')
    .eq('user_id', auth.user.id)
    .in('provider', PROVIDERS);

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      integrations: PROVIDERS.map(provider => ({ provider, status: 'not_connected' })),
      error: 'integration_connections is not available in Supabase yet'
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existing = new Map((data || []).map((item: { provider: string }) => [item.provider, item]));
  return NextResponse.json({
    migrationPending: false,
    integrations: PROVIDERS.map(provider => existing.get(provider) || { provider, status: 'not_connected' }),
    liveWorkflows: {
      productCreation: 'deferred',
      orderFulfillment: 'deferred',
      domainDeployment: 'deferred'
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const provider = String(body.provider || '').toLowerCase();
  if (!PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  if (body.secret || body.apiKey || body.token) {
    return NextResponse.json(
      {
        error: 'Secrets are not accepted by the launchpad endpoint. Use the BYO key vault after encryption is configured.'
      },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from('integration_connections')
    .upsert(
      {
        user_id: auth.user.id,
        provider,
        status: 'needs_action',
        metadata: {
          requestedAt: new Date().toISOString(),
          note: 'Connector UI staged; OAuth/token storage is not enabled yet.'
        }
      },
      { onConflict: 'user_id,provider' }
    )
    .select('id,provider,status,metadata,created_at,updated_at')
    .single();

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      error: 'integration_connections is not available in Supabase yet'
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ integration: data, migrationPending: false }, { status: 201 });
}
