import { getJobProvider, resolveJobProviderForUrl, type JobProvider, type JobProviderId } from './job-provider-registry';

export type HandoffStepOwner = 'cubiqo' | 'user' | 'shared';
export type HandoffStepKind = 'prepare' | 'browser' | 'manual_gate' | 'review' | 'final_cta';

export interface JobApplicationHandoffStep {
  id: string;
  label: string;
  detail: string;
  owner: HandoffStepOwner;
  kind: HandoffStepKind;
  requiresUserInput: boolean;
  screenshotRequired: boolean;
  auditRequired: boolean;
}

export interface JobApplicationHandoffChecklist {
  providerId: JobProviderId | 'unknown';
  providerLabel: string;
  adapter: string;
  jobUrl: string;
  jobTitle: string | null;
  company: string | null;
  supportsApply: boolean;
  supportsGenericForm: boolean;
  requiresLogin: boolean;
  requiresFinalUserCta: true;
  finalSubmitAutonomous: false;
  summary: string;
  steps: JobApplicationHandoffStep[];
  missingUserInputs: string[];
  blockedUntilApproval: string[];
}

function cleanText(value: unknown, max = 220) {
  return String(value || '').trim().slice(0, max) || null;
}

type ProviderStepBuilder = (provider: JobProvider) => JobApplicationHandoffStep;

const PROVIDER_OPENING_STEPS: Partial<Record<JobProviderId, ProviderStepBuilder>> = {
  linkedin: provider => ({
    id: 'linkedin-easy-apply',
    label: 'Open LinkedIn Easy Apply',
    detail: 'CubiQo opens the approved browser session, finds Easy Apply, and stops if login, CAPTCHA, or identity checks appear.',
    owner: 'cubiqo',
    kind: 'browser',
    requiresUserInput: provider.requiresLogin,
    screenshotRequired: true,
    auditRequired: true
  }),
  indeed: provider => quickApplyStep(provider),
  dice: provider => quickApplyStep(provider),
};

const ADAPTER_OPENING_STEPS: Record<string, ProviderStepBuilder> = {
  ats: provider => ({
    id: `${provider.id}-ats-form`,
    label: `Open ${provider.label} ATS form`,
    detail: 'CubiQo reads the form structure, fills clear profile fields, and flags custom questions, salary fields, legal attestations, and missing profile data.',
    owner: 'shared',
    kind: 'browser',
    requiresUserInput: false,
    screenshotRequired: true,
    auditRequired: true
  }),
  generic_browser: provider => ({
    id: `${provider.id}-generic-form`,
    label: 'Open company-site application',
    detail: 'CubiQo treats the page as a generic employer form: inspect fields, fill safe known values, and stop for anything ambiguous.',
    owner: 'shared',
    kind: 'browser',
    requiresUserInput: provider.requiresLogin,
    screenshotRequired: true,
    auditRequired: true
  })
};

function quickApplyStep(provider: JobProvider): JobApplicationHandoffStep {
  return {
    id: `${provider.id}-quick-apply`,
    label: `Open ${provider.label} apply flow`,
    detail: `CubiQo opens ${provider.label}, uses approved profile data only, and pauses for sign-in or platform-specific screening questions.`,
    owner: 'shared',
    kind: 'browser',
    requiresUserInput: provider.requiresLogin,
    screenshotRequired: true,
    auditRequired: true
  };
}

export function resolveHandoffProvider(platform: unknown, jobUrl: unknown): JobProvider | null {
  const requested = getJobProvider(platform);
  if (requested) return requested;

  const url = String(jobUrl || '').trim();
  if (!url) return null;

  return resolveJobProviderForUrl(url) || getJobProvider('company_site');
}

function providerOpeningStep(provider: JobProvider): JobApplicationHandoffStep {
  const builder = PROVIDER_OPENING_STEPS[provider.id] ?? ADAPTER_OPENING_STEPS[provider.adapter] ?? ADAPTER_OPENING_STEPS.generic_browser;
  return builder(provider);
}

export function buildJobApplicationHandoffChecklist(input: {
  jobUrl?: unknown;
  platform?: unknown;
  jobTitle?: unknown;
  company?: unknown;
  profileData?: Record<string, unknown> | null;
}): JobApplicationHandoffChecklist {
  const provider = resolveHandoffProvider(input.platform, input.jobUrl);
  const jobUrl = String(input.jobUrl || '').trim();
  const profile = input.profileData || {};
  const hasResume = Boolean(profile.resumeVersion || profile.resumeVersionId || profile.resume_url || profile.resumeUrl);
  const hasContact = Boolean(profile.email || profile.phone || profile.name);

  const baseProvider = provider || {
    id: 'company_site',
    label: 'Company Site',
    adapter: 'generic_browser',
    supportsApply: true,
    supportsGenericForm: true,
    requiresLogin: false
  } as JobProvider;

  const missingUserInputs = [
    !hasContact ? 'contact details' : null,
    !hasResume ? 'selected resume version' : null,
    'custom essay answers',
    'salary and work-authorization confirmations'
  ].filter(Boolean) as string[];

  const steps: JobApplicationHandoffStep[] = [
    {
      id: 'approval',
      label: 'Approval and session check',
      detail: 'The job_apply approval, browser_session_id, and URL allowlist are checked before any browser action runs.',
      owner: 'cubiqo',
      kind: 'prepare',
      requiresUserInput: false,
      screenshotRequired: false,
      auditRequired: true
    },
    {
      id: 'packet',
      label: 'Load application packet',
      detail: 'CubiQo uses the saved job profile, selected resume version, cover note, and saved answers. It does not invent missing answers.',
      owner: 'cubiqo',
      kind: 'prepare',
      requiresUserInput: missingUserInputs.length > 0,
      screenshotRequired: false,
      auditRequired: true
    },
    providerOpeningStep(baseProvider),
    {
      id: 'missing-fields',
      label: 'Flag missing or sensitive fields',
      detail: 'Custom questions, salary, legal eligibility, demographic fields, and anything not covered by profile data are shown to the user instead of guessed.',
      owner: 'shared',
      kind: 'manual_gate',
      requiresUserInput: true,
      screenshotRequired: true,
      auditRequired: true
    },
    {
      id: 'review-receipt',
      label: 'Capture review receipt',
      detail: 'Before final submit, CubiQo captures a screenshot receipt and stores it in the audit log so the user can verify exactly what the browser saw.',
      owner: 'cubiqo',
      kind: 'review',
      requiresUserInput: false,
      screenshotRequired: true,
      auditRequired: true
    },
    {
      id: 'final-submit',
      label: 'User presses final CTA',
      detail: 'CubiQo never autonomously submits. The final Submit application button is a separate user action after review.',
      owner: 'user',
      kind: 'final_cta',
      requiresUserInput: true,
      screenshotRequired: true,
      auditRequired: true
    }
  ];

  return {
    providerId: provider?.id || 'company_site',
    providerLabel: baseProvider.label,
    adapter: baseProvider.adapter,
    jobUrl,
    jobTitle: cleanText(input.jobTitle),
    company: cleanText(input.company),
    supportsApply: Boolean(baseProvider.supportsApply),
    supportsGenericForm: Boolean(baseProvider.supportsGenericForm),
    requiresLogin: Boolean(baseProvider.requiresLogin),
    requiresFinalUserCta: true,
    finalSubmitAutonomous: false,
    summary: `${baseProvider.label} handoff: prepare packet, fill safe profile fields, pause for missing answers, capture receipt, then user submits.`,
    steps,
    missingUserInputs,
    blockedUntilApproval: [
      'No browser action runs before approval',
      'No final submit runs without the user pressing the final CTA',
      'No payment, email send, deploy, or production mutation is allowed'
    ]
  };
}
