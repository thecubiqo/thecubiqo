export type SocialPlatform = 'LinkedIn' | 'Facebook' | 'Instagram' | 'X';

export interface PulsePost {
  platform: SocialPlatform;
  title: string;
  excerpt: string;
  date: string;
  href: string;
}

export function normalizePulse(posts: PulsePost[]): PulsePost[] {
  return posts
    .slice(0, 3)
    .map((p) => ({
      ...p,
      excerpt: p.excerpt.length > 160 ? p.excerpt.slice(0, 157) + '…' : p.excerpt,
    }));
}
