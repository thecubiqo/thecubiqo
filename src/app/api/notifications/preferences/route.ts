import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const preferencesSchema = z.object({
  preferences: z.record(z.record(z.boolean())).optional(),
  dndStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  dndEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  briefingCall: z.boolean().optional(),
  urgentCall: z.boolean().optional(),
  wakeupCall: z.boolean().optional()
});

function mapPreferences(row: Record<string, any> | null) {
  return {
    preferences: row?.preferences || {},
    dndStart: row?.dnd_start || null,
    dndEnd: row?.dnd_end || null,
    briefingCall: Boolean(row?.briefing_call),
    urgentCall: Boolean(row?.urgent_call),
    wakeupCall: Boolean(row?.wakeup_call)
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('notification_preferences')
    .select('preferences,dnd_start,dnd_end,briefing_call,urgent_call,wakeup_call')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('notification-preferences', 'notification_preferences');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapPreferences(data));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = preferencesSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification preferences payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const row: Record<string, unknown> = {
    user_id: auth.user.id,
    updated_at: new Date().toISOString()
  };
  if (payload.preferences) row.preferences = payload.preferences;
  if ('dndStart' in payload) row.dnd_start = payload.dndStart;
  if ('dndEnd' in payload) row.dnd_end = payload.dndEnd;
  if (typeof payload.briefingCall === 'boolean') row.briefing_call = payload.briefingCall;
  if (typeof payload.urgentCall === 'boolean') row.urgent_call = payload.urgentCall;
  if (typeof payload.wakeupCall === 'boolean') row.wakeup_call = payload.wakeupCall;

  const { data, error } = await auth.supabase
    .from('notification_preferences')
    .upsert(row, { onConflict: 'user_id' })
    .select('preferences,dnd_start,dnd_end,briefing_call,urgent_call,wakeup_call')
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('notification-preferences', 'notification_preferences');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapPreferences(data));
}
