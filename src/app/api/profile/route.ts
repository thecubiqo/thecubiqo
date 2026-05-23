import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../_lib/supabase-admin';

export const runtime = 'nodejs';

const patchSchema = z.object({
  displayName: z.string().max(120).optional(),
  primaryGoal: z.string().max(240).optional(),
  timezone: z.string().max(80).optional(),
  languagePreference: z.string().max(32).optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const [profile, aiProfile] = await Promise.all([
    auth.supabase
      .from('profiles')
      .select('id,email,display_name,primary_goal,goal_domain,onboarding_done,timezone,language_preference,visit_count,last_seen_at,subscription_tier')
      .eq('id', auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from('user_ai_profile')
      .select('personality_read,primary_drive,communication_style,current_phase,what_blocks,open_loops,rgy_score,rgy_dominance,rgy_trend,occupation,goal_domain,interests,last_updated')
      .eq('user_id', auth.user.id)
      .maybeSingle()
  ]);

  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (aiProfile.error) return NextResponse.json({ error: aiProfile.error.message }, { status: 500 });

  return NextResponse.json({
    profile: profile.data,
    aiProfile: aiProfile.data
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.displayName !== undefined) patch.display_name = parsed.data.displayName;
  if (parsed.data.primaryGoal !== undefined) patch.primary_goal = parsed.data.primaryGoal;
  if (parsed.data.timezone !== undefined) patch.timezone = parsed.data.timezone;
  if (parsed.data.languagePreference !== undefined) patch.language_preference = parsed.data.languagePreference;

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(patch)
    .eq('id', auth.user.id)
    .select('id,email,display_name,primary_goal,goal_domain,onboarding_done,timezone,language_preference,visit_count,last_seen_at,subscription_tier')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
