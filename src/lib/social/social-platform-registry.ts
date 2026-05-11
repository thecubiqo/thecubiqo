export type SocialPlatformId =
  | 'linkedin'
  | 'x'
  | 'instagram'
  | 'threads'
  | 'tiktok'
  | 'facebook'
  | 'pinterest';

export type SocialQueuePlatform = 'linkedin' | 'x' | 'twitter' | 'instagram' | 'threads';

export type SocialPlatformRegistryEntry = {
  id: SocialPlatformId;
  label: string;
  aliases: string[];
  startUrl: string;
  supportsQueue: boolean;
  supportsDirectApi: boolean;
  requiresMedia: boolean;
};

export const SOCIAL_PLATFORM_REGISTRY: readonly SocialPlatformRegistryEntry[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    aliases: ['linkedin', 'linkedin.com'],
    startUrl: 'https://www.linkedin.com/feed/',
    supportsQueue: true,
    supportsDirectApi: true,
    requiresMedia: false
  },
  {
    id: 'x',
    label: 'X/Twitter',
    aliases: ['x', 'twitter', 'x.com', 'twitter.com'],
    startUrl: 'https://x.com/compose/post',
    supportsQueue: true,
    supportsDirectApi: true,
    requiresMedia: false
  },
  {
    id: 'instagram',
    label: 'Instagram',
    aliases: ['instagram', 'instagram.com'],
    startUrl: 'https://www.instagram.com/',
    supportsQueue: true,
    supportsDirectApi: true,
    requiresMedia: true
  },
  {
    id: 'threads',
    label: 'Threads',
    aliases: ['threads', 'threads.net'],
    startUrl: 'https://www.threads.net/',
    supportsQueue: true,
    supportsDirectApi: true,
    requiresMedia: false
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    aliases: ['tiktok', 'tiktok.com'],
    startUrl: 'https://www.tiktok.com/',
    supportsQueue: false,
    supportsDirectApi: false,
    requiresMedia: true
  },
  {
    id: 'facebook',
    label: 'Facebook',
    aliases: ['facebook', 'fb', 'facebook.com'],
    startUrl: 'https://www.facebook.com/',
    supportsQueue: false,
    supportsDirectApi: false,
    requiresMedia: false
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    aliases: ['pinterest', 'pinterest.com'],
    startUrl: 'https://www.pinterest.com/',
    supportsQueue: false,
    supportsDirectApi: false,
    requiresMedia: true
  }
] as const;

export const SOCIAL_PLATFORM_IDS = SOCIAL_PLATFORM_REGISTRY.map(item => item.id);

export function canonicalSocialPlatform(value: unknown): SocialPlatformId | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  const match = SOCIAL_PLATFORM_REGISTRY.find(item => item.id === raw || item.aliases.includes(raw));
  return match?.id || null;
}

export function normalizeSocialQueuePlatform(value: unknown): SocialQueuePlatform | null {
  const raw = String(value || '').trim().toLowerCase();
  const canonical = canonicalSocialPlatform(raw);
  if (!canonical) return null;
  const entry = getSocialPlatform(canonical);
  if (!entry?.supportsQueue) return null;
  return raw === 'twitter' ? 'twitter' : canonical as SocialQueuePlatform;
}

export function getSocialPlatform(platform: SocialPlatformId | SocialQueuePlatform | string | null | undefined) {
  const canonical = canonicalSocialPlatform(platform);
  return canonical ? SOCIAL_PLATFORM_REGISTRY.find(item => item.id === canonical) || null : null;
}

export function getQueueSocialPlatforms() {
  return SOCIAL_PLATFORM_REGISTRY.filter(item => item.supportsQueue);
}

export function socialPlatformStartUrl(platform: SocialPlatformId | SocialQueuePlatform) {
  return getSocialPlatform(platform)?.startUrl || null;
}
