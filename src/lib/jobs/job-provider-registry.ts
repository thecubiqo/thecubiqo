export type JobProviderId =
  | 'linkedin'
  | 'indeed'
  | 'dice'
  | 'monster'
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'ziprecruiter'
  | 'wellfound'
  | 'company_site';

export type JobProviderAdapter = 'api' | 'stagehand' | 'ats' | 'generic_browser' | 'handoff';

export interface JobProvider {
  id: JobProviderId;
  label: string;
  domains: string[];
  supportsScan: boolean;
  supportsApply: boolean;
  supportsEasyApply: boolean;
  supportsGenericForm: boolean;
  requiresLogin: boolean;
  requiresFinalUserCta: boolean;
  adapter: JobProviderAdapter;
  searchUrlTemplate: string;
}

export const JOB_PROVIDER_REGISTRY: readonly JobProvider[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    domains: ['linkedin.com'],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: true,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'stagehand',
    searchUrlTemplate: 'https://www.linkedin.com/jobs/search/?keywords={query}&location={location}'
  },
  {
    id: 'indeed',
    label: 'Indeed',
    domains: ['indeed.com'],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: true,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'stagehand',
    searchUrlTemplate: 'https://www.indeed.com/jobs?q={query}&l={location}'
  },
  {
    id: 'dice',
    label: 'Dice',
    domains: ['dice.com'],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: true,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'stagehand',
    searchUrlTemplate: 'https://www.dice.com/jobs?q={query}&location={location}'
  },
  {
    id: 'monster',
    label: 'Monster',
    domains: ['monster.com'],
    supportsScan: true,
    supportsApply: false,
    supportsEasyApply: false,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'handoff',
    searchUrlTemplate: 'https://www.monster.com/jobs/search?q={query}&where={location}'
  },
  {
    id: 'greenhouse',
    label: 'Greenhouse',
    domains: ['greenhouse.io', 'greenhouse.com'],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: false,
    supportsGenericForm: true,
    requiresLogin: false,
    requiresFinalUserCta: true,
    adapter: 'ats',
    searchUrlTemplate: 'https://www.google.com/search?q={query}+{location}+site%3Agreenhouse.io'
  },
  {
    id: 'lever',
    label: 'Lever',
    domains: ['lever.co'],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: false,
    supportsGenericForm: true,
    requiresLogin: false,
    requiresFinalUserCta: true,
    adapter: 'ats',
    searchUrlTemplate: 'https://www.google.com/search?q={query}+{location}+site%3Alever.co'
  },
  {
    id: 'workday',
    label: 'Workday',
    domains: ['myworkdayjobs.com', 'workdayjobs.com'],
    supportsScan: true,
    supportsApply: false,
    supportsEasyApply: false,
    supportsGenericForm: true,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'handoff',
    searchUrlTemplate: 'https://www.google.com/search?q={query}+{location}+site%3Amyworkdayjobs.com'
  },
  {
    id: 'ziprecruiter',
    label: 'ZipRecruiter',
    domains: ['ziprecruiter.com'],
    supportsScan: true,
    supportsApply: false,
    supportsEasyApply: false,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'handoff',
    searchUrlTemplate: 'https://www.ziprecruiter.com/jobs-search?search={query}&location={location}'
  },
  {
    id: 'wellfound',
    label: 'Wellfound',
    domains: ['wellfound.com'],
    supportsScan: true,
    supportsApply: false,
    supportsEasyApply: false,
    supportsGenericForm: false,
    requiresLogin: true,
    requiresFinalUserCta: true,
    adapter: 'handoff',
    searchUrlTemplate: 'https://wellfound.com/jobs?query={query}&location={location}'
  },
  {
    id: 'company_site',
    label: 'Company Site',
    domains: [],
    supportsScan: true,
    supportsApply: true,
    supportsEasyApply: false,
    supportsGenericForm: true,
    requiresLogin: false,
    requiresFinalUserCta: true,
    adapter: 'generic_browser',
    searchUrlTemplate: 'https://www.google.com/search?q={query}+{location}+careers+apply'
  }
] as const;

export const JOB_PROVIDER_IDS = JOB_PROVIDER_REGISTRY.map(provider => provider.id);

export function isKnownJobProviderId(value: unknown): value is JobProviderId {
  return JOB_PROVIDER_IDS.includes(String(value) as JobProviderId);
}

export function getJobProvider(id: unknown) {
  const normalized = String(id || '').trim().toLowerCase();
  return JOB_PROVIDER_REGISTRY.find(provider => provider.id === normalized) || null;
}

export function getScanProviders() {
  return JOB_PROVIDER_REGISTRY.filter(provider => provider.supportsScan);
}

export function getApplyProviders() {
  return JOB_PROVIDER_REGISTRY.filter(provider => provider.supportsApply);
}

export function buildProviderSearchUrl(provider: JobProvider, query: string, location: string) {
  return provider.searchUrlTemplate
    .replace('{query}', encodeURIComponent(query))
    .replace('{location}', encodeURIComponent(location));
}

export function resolveJobProviderForUrl(jobUrl: string) {
  let hostname = '';
  try {
    hostname = new URL(jobUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  return JOB_PROVIDER_REGISTRY.find(provider =>
    provider.domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
  ) || null;
}

export function defaultScanProviderIds(): JobProviderId[] {
  return ['linkedin', 'indeed', 'dice', 'monster', 'greenhouse', 'lever', 'workday'];
}

export function enabledScanProviders(input: unknown) {
  const ids = Array.isArray(input)
    ? input.map(item => String(item).trim().toLowerCase()).filter(isKnownJobProviderId)
    : defaultScanProviderIds();
  const allowed = new Set(ids);
  return getScanProviders().filter(provider => allowed.has(provider.id));
}
