import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { ApiKeyAdapter } from '@/next/lib/connectors/adapters/api-key-adapter';
import { getApiKeyConfig } from '@/next/lib/connectors/registry';

export const runtime = 'nodejs';

const ApiKeySaveSchema = z.object({
  platform: z.string().min(1).max(80).transform(value => value.trim().toLowerCase()),
  apiKey: z.string().min(8).max(8000),
  apiSecret: z.string().min(1).max(8000).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = ApiKeySaveSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid API key payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const config = await getApiKeyConfig(parsed.data.platform);
  if (!config) return NextResponse.json({ error: 'Platform not found' }, { status: 404 });

  await new ApiKeyAdapter(config).saveKey(auth.user.id, parsed.data.apiKey, parsed.data.apiSecret);
  return NextResponse.json({ connected: true });
}
