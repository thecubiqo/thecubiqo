import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { getRegistryRow, storeConsent } from '@/next/lib/connectors/registry';

export const runtime = 'nodejs';

const EnableSchema = z.object({
  platform: z.string().min(1).max(80).transform(value => value.trim().toLowerCase()),
  tosConsent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = EnableSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid extension enable payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const row = await getRegistryRow(parsed.data.platform);
  if (!row || row.adapter_type !== 'extension') {
    return NextResponse.json({ error: 'Not an extension platform' }, { status: 400 });
  }
  if (row.tos_risk === true && !parsed.data.tosConsent) {
    return NextResponse.json({ error: 'ToS consent required', code: 'TOS_CONSENT_REQUIRED' }, { status: 409 });
  }

  await auth.supabase.from('user_connectors').upsert(
    {
      user_id: auth.user.id,
      platform: parsed.data.platform,
      adapter_type: 'extension',
      auth_type: 'extension',
      status: 'active',
      health_status: 'unknown',
      metadata: parsed.data.tosConsent ? { tos_consented_at: new Date().toISOString() } : {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,platform' },
  );

  if (parsed.data.tosConsent) await storeConsent(auth.user.id, parsed.data.platform);
  return NextResponse.json({ enabled: true, platform: parsed.data.platform });
}
