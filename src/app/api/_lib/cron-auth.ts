import type { NextRequest } from 'next/server';
import { cleanEnv, getBearerToken } from './supabase-admin';

/**
 * Unified cron authentication.
 *
 * Cron routes are triggered two ways and previously each route accepted only ONE
 * of them, so whichever convention a route didn't implement caused a silent 401
 * on every invocation — roughly half the fleet was dead in production:
 *
 *   • Vercel native cron sends `Authorization: Bearer <CRON_SECRET>`.
 *   • Internal fan-out (agent → cron, cron → cron) sends
 *     `x-cubiqo-internal: <CRON_SECRET>` (a few use `x-cron-secret`).
 *
 * isAuthorizedCron() accepts ALL of these so a route works regardless of which
 * scheduler/caller hits it. Comparison is timing-safe to avoid leaking the
 * secret via response-time analysis.
 */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = cleanEnv(process.env.CRON_SECRET);
  if (!secret) return false;

  const bearer = getBearerToken(request);
  if (bearer && timingSafeEqual(bearer, secret)) return true;

  const internal =
    request.headers.get('x-cubiqo-internal') ||
    request.headers.get('x-cron-secret') ||
    '';
  return Boolean(internal) && timingSafeEqual(internal, secret);
}
