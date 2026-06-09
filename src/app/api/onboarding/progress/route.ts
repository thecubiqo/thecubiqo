import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { ONBOARDING_STEPS, STEP_ORDER, isOnboardingStep } from '@/next/lib/onboarding/step-config';
import type { OnboardingStepId } from '@/next/types/onboarding';

export const runtime = 'nodejs';

const progressSchema = z.object({
  step: z.custom<OnboardingStepId>(isOnboardingStep, 'Unknown onboarding step'),
  data: z.record(z.unknown()).optional().default({}),
  skipped: z.boolean().optional().default(false)
});

function mapRows(rows: Array<Record<string, any>>) {
  const completed = rows
    .filter(row => row.completed_at && !row.skipped)
    .map(row => row.step)
    .filter(isOnboardingStep);
  const skipped = rows
    .filter(row => row.skipped)
    .map(row => row.step)
    .filter(isOnboardingStep);

  return {
    completedSteps: completed,
    skippedSteps: skipped,
    steps: ONBOARDING_STEPS,
    isComplete: completed.includes('first_message') || STEP_ORDER.every(step => completed.includes(step) || skipped.includes(step))
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('onboarding_progress')
    .select('step,completed_at,skipped,answer_data')
    .eq('user_id', auth.user.id)
    .order('completed_at', { ascending: true, nullsFirst: true });

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('onboarding-progress', 'onboarding_progress');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapRows(data ?? []));
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = progressSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid onboarding progress payload', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { step, data, skipped } = parsed.data;

  const { error } = await auth.supabase
    .from('onboarding_progress')
    .upsert(
      {
        user_id: auth.user.id,
        step,
        completed_at: now,
        skipped,
        answer_data: data
      },
      { onConflict: 'user_id,step' }
    );

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('onboarding-progress', 'onboarding_progress');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auth.supabase.from('onboarding_events').insert({
    user_id: auth.user.id,
    event_type: skipped ? 'step_skipped' : 'step_completed',
    step,
    metadata: { data }
  });

  return NextResponse.json({ ok: true });
}
