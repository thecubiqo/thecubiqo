import { getSupabaseAdmin, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import type { DispatchPayload, NotificationChannel } from '@/next/types/notifications';

function channelEnabled(
  preferences: Record<string, Record<string, boolean>>,
  type: string,
  channel: NotificationChannel
) {
  const byType = preferences[type] || {};
  if (typeof byType[channel] === 'boolean') return byType[channel];
  return channel === 'in_app' || channel === 'push';
}

function inDndWindow(dndStart: string | null, dndEnd: string | null) {
  if (!dndStart || !dndEnd) return false;
  const now = new Date();
  const current = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startHour, startMinute = '0'] = dndStart.split(':');
  const [endHour, endMinute = '0'] = dndEnd.split(':');
  const start = Number(startHour) * 60 + Number(startMinute);
  const end = Number(endHour) * 60 + Number(endMinute);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start > end ? current >= start || current < end : current >= start && current < end;
}

async function queuePushLog(
  supabase: any,
  payload: DispatchPayload,
  notificationId: string | null
) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', payload.userId)
    .eq('active', true);

  if (!subs?.length) return;

  await supabase.from('push_notifications').insert({
    user_id: payload.userId,
    title: payload.title.slice(0, 160),
    message: (payload.body || '').slice(0, 500),
    action_url: payload.actionUrl || null,
    delivered: false,
    metadata: { notificationId, channel: 'push' }
  });
}

export async function dispatchNotification(payload: DispatchPayload): Promise<{ notificationId: string | null }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { notificationId: null };

  const { data: prefRow } = await supabase
    .from('notification_preferences')
    .select('preferences,dnd_start,dnd_end,briefing_call,urgent_call,wakeup_call')
    .eq('user_id', payload.userId)
    .maybeSingle();

  const preferences = (prefRow?.preferences || {}) as Record<string, Record<string, boolean>>;
  const channels = payload.channels?.length ? payload.channels : ['in_app'];
  const dndActive = inDndWindow(prefRow?.dnd_start || null, prefRow?.dnd_end || null);
  let notificationId: string | null = null;

  if (channels.includes('in_app') && channelEnabled(preferences, payload.type, 'in_app')) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        type: payload.type,
        title: payload.title.slice(0, 160),
        body: payload.body?.slice(0, 1000) || null,
        action_url: payload.actionUrl || null,
        action_label: payload.actionLabel || null,
        channel: channels,
        expires_at: payload.expiresAt || null,
        metadata: payload.metadata || {}
      })
      .select('id')
      .maybeSingle();

    if (!error || !safeTableMissing(error)) notificationId = data?.id ?? null;
  }

  if (
    channels.includes('push') &&
    !dndActive &&
    channelEnabled(preferences, payload.type, 'push')
  ) {
    await queuePushLog(supabase, payload, notificationId).catch(() => {});
  }

  return { notificationId };
}
