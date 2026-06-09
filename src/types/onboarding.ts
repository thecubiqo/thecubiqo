export type OnboardingStepId =
  | 'welcome'
  | 'right_now'      // what are you working on right now + blocker
  | 'about_you'      // occupation, interests
  | 'how_you_work'   // tone preference, constraints
  | 'connector_setup'
  | 'first_message'
  // legacy ids — kept so old onboarding_progress rows don't break
  | 'personal_context'
  | 'goals'
  | 'tone_preference';

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  skippable: boolean;
  order: number;
};

export type OnboardingProgress = {
  completedSteps: OnboardingStepId[];
  skippedSteps: OnboardingStepId[];
  steps: OnboardingStep[];
  isComplete: boolean;
};

export type OnboardingStepPayload = {
  step: OnboardingStepId;
  data?: Record<string, unknown>;
  skipped?: boolean;
};

export type OnboardingCompletionProfile = {
  ageRange?: string;
  occupation?: string;
  primaryGoal?: string;
  goalDomain?: string;
  primaryDrive?: string | string[];
  whatBlocks?: string;
  interests?: string[];
  tone?: string;
  timezone?: string;
  languagePreference?: string;
  rgyMap?: Record<string, 'green' | 'yellow' | 'red'>;
  contextSummary?: string;
  // New fields from updated wizard
  constraints?: string;
};
