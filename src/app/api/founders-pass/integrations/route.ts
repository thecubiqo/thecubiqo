// API: Integration configs per site
import { NextRequest, NextResponse } from 'next/server';
import { listIntegrations, upsertIntegration, writeAuditLog } from '@/lib/founders-pass/service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    }
    const integrations = await listIntegrations(siteId);
    return NextResponse.json({ integrations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const integration = await upsertIntegration(body.site_id, body.provider, {
      client_id: body.client_id,
      config: body.config ?? {},
      enabled: body.enabled ?? false,
    });

    await writeAuditLog({
      actor_id: body.actor_id ?? null,
      action: 'integration.configured',
      resource_type: 'integration',
      resource_id: integration.id,
      details: { site_id: body.site_id, provider: body.provider },
    });

    return NextResponse.json({ integration });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
