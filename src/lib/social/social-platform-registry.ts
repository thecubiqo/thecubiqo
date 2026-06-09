export type SocialPlatformId =
  | 'linkedin'
  | 'x'
  | 'instagram'
  | 'threads'
  | 'tiktok'
  | 'facebook'
  | 'pinterest'
  | 'youtube'
  | 'reddit'
  | 'bluesky';

export type SocialQueuePlatform = 'linkedin' | 'x' | 'twitter' | 'instagram' | 'threads';

export type SocialPlatformRegistryEntry = {
  id: SocialPlatformId;
  label: string;
  aliases: string[];
  browserStartUrl: string;
  startUrl: string;
  composerSelector: string | null;
  maxPostLength: number | null;
  supportsQueue: boolean;
  supportsScheduling: boolean;
  apiAvailable: boolean;
  supportsDirectApi: boolean;
  requiresMedia: boolean;
  requiresBusinessAccount: boolean;
};

export const SOCIAL_PLATFORM_REGISTRY: readonly SocialPlatformRegistryEntry[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    aliases: ['linkedin', 'linkedin.com'],
    browserStartUrl: 'https://www.linkedin.com/feed/',
    startUrl: 'https://www.linkedin.com/feed/',
    composerSelector: 'Start a post',
    maxPostLength: 3000,
    supportsQueue: true,
    supportsScheduling: true,
    apiAvailable: true,
    supportsDirectApi: true,
    requiresMedia: false,
    requiresBusinessAccount: false
  },
  {
    id: 'x',
    label: 'X/Twitter',
    aliases: ['x', 'twitter', 'x.com', 'twitter.com'],
    browserStartUrl: 'https://x.com/compose/post',
    startUrl: 'https://x.com/compose/post',
    composerSelector: 'Post composer',
    maxPostLength: 280,
    supportsQueue: true,
    supportsScheduling: true,
    apiAvailable: true,
    supportsDirectApi: true,
    requiresMedia: false,
    requiresBusinessAccount: false
  },
  {
    id: 'instagram',
    label: 'Instagram',
    aliases: ['instagram', 'instagram.com'],
    browserStartUrl: 'https://www.instagram.com/',
    startUrl: 'https://www.instagram.com/',
    composerSelector: 'Create post',
    maxPostLength: 2200,
    supportsQueue: true,
    supportsScheduling: true,
    apiAvailable: true,
    supportsDirectApi: true,
    requiresMedia: true,
    requiresBusinessAccount: true
  },
  {
    id: 'threads',
    label: 'Threads',
    aliases: ['threads', 'threads.net'],
    browserStartUrl: 'https://www.threads.net/',
    startUrl: 'https://www.threads.net/',
    composerSelector: 'New thread',
    maxPostLength: 500,
    supportsQueue: true,
    supportsScheduling: true,
    apiAvailable: true,
    supportsDirectApi: true,
    requiresMedia: false,
    requiresBusinessAccount: false
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    aliases: ['tiktok', 'tiktok.com'],
    browserStartUrl: 'https://www.tiktok.com/',
    startUrl: 'https://www.tiktok.com/',
    composerSelector: null,
    maxPostLength: 2200,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: true,
    requiresBusinessAccount: true
  },
  {
    id: 'facebook',
    label: 'Facebook',
    aliases: ['facebook', 'fb', 'facebook.com'],
    browserStartUrl: 'https://www.facebook.com/',
    startUrl: 'https://www.facebook.com/',
    composerSelector: null,
    maxPostLength: 63206,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: false,
    requiresBusinessAccount: true
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    aliases: ['pinterest', 'pinterest.com'],
    browserStartUrl: 'https://www.pinterest.com/',
    startUrl: 'https://www.pinterest.com/',
    composerSelector: null,
    maxPostLength: 500,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: true,
    requiresBusinessAccount: true
  },
  {
    id: 'youtube',
    label: 'YouTube',
    aliases: ['youtube', 'youtube.com', 'yt'],
    browserStartUrl: 'https://studio.youtube.com/',
    startUrl: 'https://studio.youtube.com/',
    composerSelector: null,
    maxPostLength: 5000,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: true,
    requiresBusinessAccount: false
  },
  {
    id: 'reddit',
    label: 'Reddit',
    aliases: ['reddit', 'reddit.com'],
    browserStartUrl: 'https://www.reddit.com/submit/',
    startUrl: 'https://www.reddit.com/submit/',
    composerSelector: null,
    maxPostLength: 40000,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: false,
    requiresBusinessAccount: false
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    aliases: ['bluesky', 'bsky', 'bsky.app'],
    browserStartUrl: 'https://bsky.app/',
    startUrl: 'https://bsky.app/',
    composerSelector: null,
    maxPostLength: 300,
    supportsQueue: false,
    supportsScheduling: true,
    apiAvailable: false,
    supportsDirectApi: false,
    requiresMedia: false,
    requiresBusinessAccount: false
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
  const entry = getSocialPlatform(platform);
  return entry?.browserStartUrl || entry?.startUrl || null;
}
