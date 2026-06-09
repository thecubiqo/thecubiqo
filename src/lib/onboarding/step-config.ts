import type { OnboardingStep, OnboardingStepId } from '@/next/types/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Meet CubiQo.',
    skippable: false,
    order: 1
  },
  {
    id: 'right_now',
    title: 'Right Now',
    description: 'What are you actively working on today? This is the most important step.',
    skippable: false,
    order: 2
  },
  {
    id: 'about_you',
    title: 'About You',
    description: 'A little background so CubiQo can personalise over time.',
    skippable: true,
    order: 3
  },
  {
    id: 'how_you_work',
    title: 'How You Work',
    description: 'How direct or warm should CubiQo sound? Any constraints to know about?',
    skippable: true,
    order: 4
  },
  {
    id: 'connector_setup',
    title: 'Connect Tools',
    description: 'Link accounts so CubiQo can act — not just advise. Skip until a task needs one.',
    skippable: true,
    order: 5
  },
  {
    id: 'first_message',
    title: 'First Message',
    description: 'Send your first message. CubiQo will start with full context already loaded.',
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
