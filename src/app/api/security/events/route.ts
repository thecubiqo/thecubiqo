import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get('severity');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

  let query = auth.supabase
    .from('security_events')
    .select('id,user_id,event_type,severity,ip_address,user_agent,surface_type,action_taken,payload,resolved,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity) query = query.eq('severity', severity);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [] });
}
