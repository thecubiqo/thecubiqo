import type { PulsePost } from './normalizePulse';

/**
 * Fetch latest Instagram post.
 * Requires INSTAGRAM_ACCESS_TOKEN env var.
 */
export async function fetchInstagram(): Promise<PulsePost | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;
  // TODO: implement Instagram Basic Display API call
  return null;
}
