import type { PulsePost } from './normalizePulse';

/**
 * Fetch latest LinkedIn post.
 * Requires LINKEDIN_ACCESS_TOKEN env var.
 * Returns null if not configured.
 */
export async function fetchLinkedIn(): Promise<PulsePost | null> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) return null;
  // TODO: implement LinkedIn API call
  return null;
}
