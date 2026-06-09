import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const extensionToken = randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  await auth.supabase.from('extension_sessions').upsert(
    {
      user_id: auth.user.id,
      token: extensionToken,
      created_at: now,
      last_seen_at: now,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'user_id' },
  );

  await auth.supabase.from('user_connectors').upsert(
    {
      user_id: auth.user.id,
      platform: 'cubiqo_extension',
      adapter_type: 'extension',
      auth_type: 'extension',
      status: 'active',
      last_health_check_at: now,
      health_status: 'healthy',
      updated_at: now,
    },
    { onConflict: 'user_id,platform' },
  );

  return NextResponse.json({ extensionToken });
}
