import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { dispatchNotification } from '@/next/lib/notifications/dispatcher';

export const runtime = 'nodejs';

const createNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  body: z.string().max(1000).optional(),
  actionUrl: z.string().max(500).optional(),
  actionLabel: z.string().max(80).optional(),
  channels: z.array(z.enum(['push', 'desktop', 'in_app', 'email', 'sms', 'call'])).max(6).optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

function mapNotification(row: Record<string, any>) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    actionLabel: row.action_label,
    readAt: row.read_at,
    actionedAt: row.actioned_at,
    dismissedAt: row.dismissed_at ?? null,
    createdAt: row.created_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100);

  let query = auth.supabase
    .from('notifications')
    .select('id,user_id,type,title,body,action_url,action_label,read_at,actioned_at,dismissed_at,created_at')
    .eq('user_id', auth.user.id)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.is('read_at', null);

  const { data, error } = await query;
  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('notifications', 'notifications');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await auth.supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .is('read_at', null)
    .is('dismissed_at', null);

  return NextResponse.json({
    notifications: (data ?? []).map(mapNotification),
    unreadCount: count ?? 0
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = createNotificationSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  if (payload.userId && payload.userId !== auth.user.id) {
    return NextResponse.json({ error: 'userId must match authenticated user' }, { status: 403 });
  }

  const result = await dispatchNotification({
    userId: auth.user.id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    actionUrl: payload.actionUrl,
    actionLabel: payload.actionLabel,
    channels: payload.channels,
    expiresAt: payload.expiresAt,
    metadata: payload.metadata
  });

  return NextResponse.json({ ok: true, ...result });
}
