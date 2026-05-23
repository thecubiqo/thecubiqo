import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const rgyColorSchema = z.enum(['green', 'yellow', 'red']);

const completionSchema = z.object({
  profile: z
    .object({
      ageRange: z.string().max(80).optional(),
      occupation: z.string().max(160).optional(),
      primaryGoal: z.string().max(240).optional(),
      goalDomain: z.string().max(160).optional(),
      primaryDrive: z.union([z.string().max(160), z.array(z.string().max(160)).max(8)]).optional(),
      whatBlocks: z.string().max(600).optional(),
      interests: z.array(z.string().max(80)).max(20).optional(),
      tone: z.string().max(120).optional(),
      timezone: z.string().max(80).optional(),
      languagePreference: z.string().max(32).optional(),
      rgyMap: z.record(rgyColorSchema).optional(),
      contextSummary: z.string().max(800).optional()
    })
    .passthrough()
    .optional()
    .default({}),
  firstMessage: z.string().max(4000).optional()
});

function driveList(primaryDrive: unknown): string[] {
  if (Array.isArray(primaryDrive)) return primaryDrive.map(String).map(item => item.trim()).filter(Boolean).slice(0, 8);
  if (typeof primaryDrive === 'string' && primaryDrive.trim()) return [primaryDrive.trim()];
  return [];
}

function truncate(value: string, max = 800) {
  return value.trim().replace(/\s+/g, ' ').slice(0, max);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = completionSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid onboarding completion payload', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile, firstMessage } = parsed.data;
  const now = new Date().toISOString();
  const drives = driveList(profile.primaryDrive);
  const contextSummary = truncate(
    profile.contextSummary ||
      [
        profile.occupation ? `Role: ${profile.occupation}` : '',
        profile.primaryGoal ? `Goal: ${profile.primaryGoal}` : '',
        profile.whatBlocks ? `Blocker: ${profile.whatBlocks}` : ''
      ]
        .filter(Boolean)
        .join(' | '),
    800
  );

  const profileUpdate: Record<string, unknown> = {
    onboarding_done: true,
    onboarding_summary: contextSummary || null,
    last_seen_at: now
  };
  if (profile.ageRange) profileUpdate.age_range = profile.ageRange;
  if (profile.primaryGoal) profileUpdate.primary_goal = profile.primaryGoal;
  if (profile.goalDomain) profileUpdate.goal_domain = profile.goalDomain;
  if (profile.timezone) profileUpdate.timezone = profile.timezone;
  if (profile.languagePreference) profileUpdate.language_preference = profile.languagePreference;

  const { error: profileError } = await auth.supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', auth.user.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { error: aiProfileError } = await auth.supabase
    .from('user_ai_profile')
    .upsert(
      {
        user_id: auth.user.id,
        occupation: profile.occupation ?? null,
        goal_domain: profile.goalDomain ?? null,
        primary_drive: drives.join(', ') || null,
        primary_drive_list: drives,
        communication_style: profile.tone ?? 'balanced',
        what_blocks: profile.whatBlocks ?? null,
        interests: profile.interests ?? [],
        rgy_map: profile.rgyMap ?? {},
        current_phase: 'onboarding_complete',
        session_count: 0,
        last_updated: now,
        updated_at: now
      },
      { onConflict: 'user_id' }
    );

  if (aiProfileError) {
    if (safeTableMissing(aiProfileError)) return missingMigrationResponse('onboarding-complete', 'user_ai_profile');
    return NextResponse.json({ error: aiProfileError.message }, { status: 500 });
  }

  const memoryRows = [
    profile.primaryGoal
      ? {
          user_id: auth.user.id,
          event_type: 'goal_update',
          summary: truncate(`Primary onboarding goal: ${profile.primaryGoal}`),
          keywords: [profile.primaryGoal, profile.goalDomain].filter(Boolean),
          weight: 3,
          source: 'onboarding',
          user_confirmed: true,
          metadata: { goalDomain: profile.goalDomain ?? null }
        }
      : null,
    profile.whatBlocks
      ? {
          user_id: auth.user.id,
          event_type: 'blocker',
          summary: truncate(`Initial blocker: ${profile.whatBlocks}`),
          keywords: [profile.whatBlocks, profile.primaryGoal].filter(Boolean),
          weight: 2,
          source: 'onboarding',
          user_confirmed: true,
          metadata: {}
        }
      : null,
    contextSummary
      ? {
          user_id: auth.user.id,
          event_type: 'preference',
          summary: truncate(`Onboarding context: ${contextSummary}`),
          keywords: [profile.occupation, profile.goalDomain, ...(profile.interests ?? [])].filter(Boolean),
          weight: 2,
          source: 'onboarding',
          user_confirmed: true,
          metadata: { tone: profile.tone ?? null, drives }
        }
      : null
  ].filter(Boolean);

  if (memoryRows.length) {
    const { error: memoryError } = await auth.supabase.from('memory_events').insert(memoryRows);
    if (memoryError) {
      if (safeTableMissing(memoryError)) return missingMigrationResponse('onboarding-complete', 'memory_events');
      return NextResponse.json({ error: memoryError.message }, { status: 500 });
    }
  }

  const { error: rgyError } = await auth.supabase
    .from('rgy_status')
    .upsert(
      {
        user_id: auth.user.id,
        status: 'green',
        score: 80,
        reason: 'Onboarding completed',
        changed_at: now,
        evaluated_at: now,
        updated_at: now
      },
      { onConflict: 'user_id' }
    );

  if (rgyError) {
    if (safeTableMissing(rgyError)) return missingMigrationResponse('onboarding-complete', 'rgy_status');
    return NextResponse.json({ error: rgyError.message }, { status: 500 });
  }

  await auth.supabase.from('onboarding_progress').upsert(
    {
      user_id: auth.user.id,
      step: 'complete',
      completed_at: now,
      skipped: false,
      answer_data: { profile, firstMessage: firstMessage?.slice(0, 500) ?? null }
    },
    { onConflict: 'user_id,step' }
  );

  await auth.supabase.from('onboarding_events').insert({
    user_id: auth.user.id,
    event_type: 'onboarding_completed',
    step: 'complete',
    metadata: { first_message: firstMessage?.slice(0, 200) ?? null }
  });

  return NextResponse.json({ ok: true, redirectTo: '/chat' });
}
