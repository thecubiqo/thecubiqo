import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const heartbeatSchema = z.object({
  surface_type: z.enum(['web', 'desktop', 'mobile', 'extension', 'cloud_browser']),
  session_id: z.string().min(1).max(200),
  capabilities: z.record(z.union([z.boolean(), z.string(), z.array(z.string())])).default({}),
  device_id: z.string().max(200).optional(),
  app_version: z.string().max(100).optional(),
  os_platform: z.enum(['macos', 'windows', 'linux', 'ios', 'android', 'web']).optional(),
  ollama_models: z.array(z.string()).optional()
});

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!token || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = heartbeatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid heartbeat payload' }, { status: 400 });
  }

  const { surface_type, session_id, capabilities, device_id, app_version, os_platform, ollama_models } =
    parsed.data;
  const now = new Date().toISOString();

  const { error } = await supabase.from('surface_sessions').upsert(
    {
      user_id: user.id,
      surface_type,
      session_id,
      capabilities,
      device_id: device_id ?? null,
      app_version: app_version ?? null,
      os_platform: os_platform ?? null,
      ollama_models: ollama_models ?? null,
      last_heartbeat: now,
      last_seen: now,
      is_online: true,
      updated_at: now
    },
    {
      onConflict: 'user_id,surface_type',
      ignoreDuplicates: false
    }
  );

  if (error) {
    console.error('[heartbeat] upsert error:', error.message);
    return NextResponse.json({ error: 'Failed to upsert session' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
