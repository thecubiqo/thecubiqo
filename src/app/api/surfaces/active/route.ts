import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

  const thresholdIso = new Date(Date.now() - 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from('surface_sessions')
    .select(
      'id, surface_type, session_id, device_id, capabilities, ollama_models, last_heartbeat, is_online, app_version, os_platform'
    )
    .eq('user_id', user.id)
    .eq('is_online', true)
    .gte('last_heartbeat', thresholdIso)
    .order('last_heartbeat', { ascending: false });

  if (error) {
    console.error('[active-surfaces] query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions ?? [] });
}
