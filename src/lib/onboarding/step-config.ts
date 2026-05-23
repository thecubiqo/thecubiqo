import type { OnboardingStep, OnboardingStepId } from '@/next/types/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Meet CubiQo and set the tone for the first session.',
    skippable: false,
    order: 1
  },
  {
    id: 'personal_context',
    title: 'Personal Context',
    description: 'Tell CubiQo who you are and what kind of life it is joining.',
    skippable: false,
    order: 2
  },
  {
    id: 'goals',
    title: 'Current Goals',
    description: 'Set the main outcome CubiQo should help you move toward.',
    skippable: false,
    order: 3
  },
  {
    id: 'tone_preference',
    title: 'Communication Style',
    description: 'Choose how direct, warm, or structured CubiQo should sound.',
    skippable: true,
    order: 4
  },
  {
    id: 'connector_setup',
    title: 'Connect Your Tools',
    description: 'Link supported tools or skip until a task needs one.',
    skippable: true,
    order: 5
  },
  {
    id: 'first_message',
    title: 'First Message',
    description: 'Send the first message so CubiQo can start with real context.',
    skippable: false,
    order: 6
  }
];

export const STEP_ORDER = ONBOARDING_STEPS.map(step => step.id);

export function isOnboardingStep(value: unknown): value is OnboardingStepId {
  return typeof value === 'string' && STEP_ORDER.includes(value as OnboardingStepId);
}

export function getNextStep(
  currentStep: OnboardingStepId,
  skipped: OnboardingStepId[] = []
): OnboardingStepId | 'complete' {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) return 'complete';

  for (const step of STEP_ORDER.slice(currentIndex + 1)) {
    if (!skipped.includes(step)) return step;
  }

  return 'complete';
}
