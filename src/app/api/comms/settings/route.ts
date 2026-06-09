/**
 * GET  /api/comms/settings   — fetch current user's comms preferences
 * PATCH /api/comms/settings  — update comms preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

const patchSchema = z.object({
  active: z.boolean().optional(),
  wake_hour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().min(1).max(80).optional(),
  channel: z.enum(['sms', 'whatsapp', 'email', 'both']).optional(),
  briefing_config: z.object({
    tasks: z.boolean().optional(),
    calendar: z.boolean().optional(),
    goals: z.boolean().optional(),
    blockers: z.boolean().optional(),
    weather: z.boolean().optional(),
    custom_note: z.string().max(500).optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('user_comms_settings')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return defaults if not yet configured
  if (!data) {
    return NextResponse.json({
      user_id: auth.user.id,
      active: false,
      wake_hour: 7,
      timezone: 'UTC',
      channel: 'email',
      briefing_config: { tasks: true, calendar: true, goals: true, blockers: true, weather: false, custom_note: '' },
      last_briefing_date: null,
    });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const d = parsed.data;
  if (d.active !== undefined) updates.active = d.active;
  if (d.wake_hour !== undefined) updates.wake_hour = d.wake_hour;
  if (d.timezone !== undefined) updates.timezone = d.timezone;
  if (d.channel !== undefined) updates.channel = d.channel;
  if (d.briefing_config !== undefined) updates.briefing_config = d.briefing_config;

  // Upsert — user may not have a row yet
  const { data, error } = await auth.supabase
    .from('user_comms_settings')
    .upsert({ user_id: auth.user.id, ...updates }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
