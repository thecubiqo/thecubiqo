import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

function mapNudge(row: Record<string, any>) {
  return {
    id: row.id,
    type: row.intervention_type,
    message: row.message_sent,
    deliveredVia: row.delivered_via,
    userResponse: row.user_response,
    snoozedUntil: row.snoozed_until,
    metadata: row.metadata || {},
    createdAt: row.created_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const includeDismissed = request.nextUrl.searchParams.get('includeDismissed') === 'true';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 25), 100);
  const now = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from('interventions_log')
    .select('id,intervention_type,message_sent,delivered_via,user_response,snoozed_until,metadata,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (safeTableMissing(error)) return NextResponse.json({ nudges: [], migrationPending: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nudges = (data || [])
    .filter((row: Record<string, any>) => includeDismissed || row.user_response !== 'dismissed')
    .filter((row: Record<string, any>) => !row.snoozed_until || row.snoozed_until <= now)
    .map(mapNudge);

  return NextResponse.json({ nudges });
}
