import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cleanEnv, requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const encryptionSecret = cleanEnv(process.env.KEY_ENCRYPTION_SECRET, process.env.BYO_KEY_ENCRYPTION_SECRET);

function encryptValue(value: string) {
  if (!encryptionSecret) return null;
  const key = createHash('sha256').update(encryptionSecret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

function maskKey(value: string) {
  const clean = value.trim();
  if (clean.length <= 8) return '********';
  return `${clean.slice(0, 4)}...${clean.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from('byo_api_keys')
    .select('id,provider,masked_label,key_hint,status,created_at,updated_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      keys: [],
      encryptionConfigured: Boolean(encryptionSecret),
      error: 'byo_api_keys is not available in Supabase yet'
    });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    migrationPending: false,
    encryptionConfigured: Boolean(encryptionSecret),
    keys: data || []
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const provider = String(body.provider || '').trim().toLowerCase();
  const key = String(body.apiKey || body.key || '').trim();

  if (!provider || !key) {
    return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 });
  }

  const encrypted = encryptValue(key);
  if (!encrypted) {
    return NextResponse.json(
      {
        error: 'BYO key storage is disabled until KEY_ENCRYPTION_SECRET is configured server-side.',
        encryptionConfigured: false
      },
      { status: 503 }
    );
  }

  const { data, error } = await auth.supabase
    .from('byo_api_keys')
    .upsert(
      {
        user_id: auth.user.id,
        provider,
        masked_label: maskKey(key),
        key_hint: key.slice(-4),
        encrypted_value: encrypted,
        status: 'stored'
      },
      { onConflict: 'user_id,provider' }
    )
    .select('id,provider,masked_label,key_hint,status,created_at,updated_at')
    .single();

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      error: 'byo_api_keys is not available in Supabase yet'
    });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ key: data, migrationPending: false, encryptionConfigured: true }, { status: 201 });
}
