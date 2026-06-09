import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { isPro } from '@/next/lib/billing/gates';
import { encryptKey } from '@/next/lib/db/encryption';

export const runtime = 'nodejs';

const bodySchema = z.object({
  supabaseUrl: z.string().url().refine(value => value.startsWith('https://'), 'supabaseUrl must use https'),
  serviceRoleKey: z.string().min(20).max(4000)
});

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  if (!(await isPro(auth.user.id))) {
    return NextResponse.json({ error: 'Pro subscription required', code: 'PRO_REQUIRED' }, { status: 402 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid BYOD payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  let encrypted;
  try {
    encrypted = encryptKey(parsed.data.serviceRoleKey);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'BYOD encryption unavailable' }, { status: 500 });
  }

  const { data, error } = await auth.supabase
    .from('byod_connections')
    .upsert({
      user_id: auth.user.id,
      supabase_url: parsed.data.supabaseUrl,
      encrypted_service_role_key: encrypted.ciphertext,
      encryption_iv: encrypted.iv,
      encryption_tag: encrypted.tag,
      key_version: 1,
      status: 'pending_verification',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select('id,status')
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) {
      return NextResponse.json({ error: 'BYOD migration pending', migrationPending: true }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, connectionId: data?.id, status: data?.status || 'pending_verification' });
}
