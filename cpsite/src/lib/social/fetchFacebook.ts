import type { PulsePost } from './normalizePulse';

/**
 * Fetch latest Facebook post.
 * Requires FACEBOOK_PAGE_TOKEN env var.
 */
export async function fetchFacebook(): Promise<PulsePost | null> {
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!token) return null;
  // TODO: implement Facebook Graph API call
  return null;
}
