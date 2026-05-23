import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

function mapEvent(row: Record<string, any>) {
  return {
    id: row.id,
    actorId: row.actor_id,
    eventType: row.event_type,
    entityId: row.entity_id,
    entityType: row.entity_type,
    metadata: row.metadata || {},
    previewText: row.preview_text || null,
    createdAt: row.created_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50);
  const before = request.nextUrl.searchParams.get('before');

  let query = auth.supabase
    .from('social_activity_feed')
    .select('id,actor_id,event_type,entity_id,entity_type,preview_text,metadata,created_at')
    .eq('user_id', auth.user.id)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: (data || []).map(mapEvent), hasMore: (data?.length || 0) === limit });
}
