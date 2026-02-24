import type { PulsePost } from './normalizePulse';

/**
 * Fetch latest X/Twitter post.
 * Requires TWITTER_BEARER_TOKEN env var.
 */
export async function fetchTwitter(): Promise<PulsePost | null> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return null;
  // TODO: implement X API v2 call
  return null;
}
