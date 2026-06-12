import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../_lib/supabase-admin';
import { isAuthorizedCron } from '../../_lib/cron-auth';
import { liveProvidersAllowed } from '@/next/lib/providers/live-provider-guard';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Light health checks per platform — verify token is still valid
const HEALTH_CHECK_URLS: Record<string, string> = {
  github:  'https://api.github.com/user',
  shopify: 'https://{shop}.myshopify.com/admin/api/2024-01/shop.json',
  google:  'https://www.googleapis.com/oauth2/v1/tokeninfo',
};

async function checkConnector(
  platform: string,
  accessToken: string,
  externalAccountId: string | null
): Promise<boolean> {
  const url = HEALTH_CHECK_URLS[platform]?.replace('{shop}', externalAccountId || '');
  if (!url) return true; // Unknown platform — assume available

  try {
    if (!liveProvidersAllowed()) return true;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });

  // Get connectors that haven't been checked in the last 30 minutes
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: connectors } = await supabase
    .from('user_connectors')
    .select('id,platform,status,external_account_id,connector_secrets(access_token_plaintext)')
    .eq('status', 'available')
    .or(`last_health_check_at.is.null,last_health_check_at.lt.${cutoff}`)
    .limit(50);

  if (!connectors || connectors.length === 0) {
    return NextResponse.json({ checked: 0, healthy: 0, degraded: 0 });
  }

  let healthy = 0;
  let degraded = 0;

  for (const connector of connectors) {
    const secrets = (connector as Record<string, unknown>).connector_secrets as { access_token_plaintext?: string } | null;
    const accessToken = secrets?.access_token_plaintext;
    if (!accessToken) continue;

    const isHealthy = await checkConnector(
      connector.platform,
      accessToken,
      connector.external_account_id ?? null
    );

    await supabase
      .from('user_connectors')
      .update({
        status: isHealthy ? 'available' : 'needs_auth',
        last_health_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connector.id);

    if (isHealthy) healthy++; else degraded++;
  }

  // Log to job_runs (idempotency key is minute-granular)
  await supabase.from('job_runs').insert({
    job_name: 'connector-health',
    status: 'completed',
    metadata: { healthy, degraded, total: connectors.length },
    idempotency_key: `connector-health:${new Date().toISOString().slice(0, 16)}`,
  }).then(() => {}).catch(() => {});

  return NextResponse.json({ checked: connectors.length, healthy, degraded });
}
