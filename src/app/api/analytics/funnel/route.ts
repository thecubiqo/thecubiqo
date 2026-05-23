import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBearerToken, getSupabaseAdmin, requireAdminRequest } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const EventSchema = z.object({
  event_type: z.string().min(1).max(120),
  properties: z.record(z.unknown()).default({}),
  anon_session_id: z.string().max(200).optional(),
  created_at: z.string().datetime().optional(),
});

const BodySchema = z.union([
  EventSchema,
  z.object({ events: z.array(EventSchema).min(1).max(100) }),
]);

const STAGES = [
  'landing_view',
  'cta_click',
  'signup_complete',
  'onboarding_complete',
  'first_message',
  'first_memory',
  'first_capsule_tap',
  'first_briefing_received',
  'first_recommendation_click',
];

export async function POST(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid funnel payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Config error' }, { status: 500 });

  const token = getBearerToken(request);
  const userResult = token ? await supabase.auth.getUser(token) : null;
  const userId = userResult?.data?.user?.id || null;
  const events = 'events' in parsed.data ? parsed.data.events : [parsed.data];

  const { error } = await supabase.from('analytics_events').insert(events.map(event => ({
    user_id: userId,
    anon_session_id: event.anon_session_id || null,
    event_type: event.event_type,
    properties: event.properties || {},
    created_at: event.created_at || new Date().toISOString(),
  })));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if ('error' in admin) return admin.error;

  const from = request.nextUrl.searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = request.nextUrl.searchParams.get('to') || new Date().toISOString();
  const { data, error } = await admin.supabase
    .from('analytics_events')
    .select('event_type,user_id,anon_session_id')
    .gte('created_at', from)
    .lte('created_at', to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stages = Object.fromEntries(STAGES.map(stage => [stage, (data || []).filter((row: { event_type: string }) => row.event_type === stage).length]));
  const conversion_rates = {
    landing_to_cta: rate(stages.cta_click, stages.landing_view),
    cta_to_signup: rate(stages.signup_complete, stages.cta_click),
    signup_to_onboarded: rate(stages.onboarding_complete, stages.signup_complete),
    onboarded_to_first_message: rate(stages.first_message, stages.onboarding_complete),
    first_message_to_memory: rate(stages.first_memory, stages.first_message),
    memory_to_capsule: rate(stages.first_capsule_tap, stages.first_memory),
    capsule_to_briefing: rate(stages.first_briefing_received, stages.first_capsule_tap),
    briefing_to_recommendation: rate(stages.first_recommendation_click, stages.first_briefing_received),
  };

  return NextResponse.json({
    period: { from, to },
    stages,
    conversion_rates,
    activated_users: stages.first_capsule_tap,
    activation_rate: rate(stages.first_capsule_tap, stages.signup_complete),
  });
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}
