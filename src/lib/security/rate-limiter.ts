import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import type { RateLimitResult } from '@/next/types/security';

interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

const RATE_CONFIGS: Record<string, RateLimitConfig> = {
  'api:chat': { windowSeconds: 60, maxRequests: 30 },
  'api:auth': { windowSeconds: 300, maxRequests: 10 },
  'api:media': { windowSeconds: 3600, maxRequests: 20 },
  'api:default': { windowSeconds: 60, maxRequests: 60 },
};

function windowFloor(now: number, seconds: number) {
  return Math.floor(now / (seconds * 1000)) * seconds * 1000;
}

function identifierType(identifier: string) {
  if (identifier.startsWith('user:')) return 'user';
  if (identifier.startsWith('ip:')) return 'ip';
  if (identifier.startsWith('route:')) return 'route';
  return 'composite';
}

export async function checkRateLimit(
  identifier: string,
  configKey = 'api:default',
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };

  const config = RATE_CONFIGS[configKey] ?? RATE_CONFIGS['api:default'];
  const now = Date.now();
  const windowStartMs = windowFloor(now, config.windowSeconds);
  const windowStart = new Date(windowStartMs).toISOString();
  const windowEndMs = windowStartMs + config.windowSeconds * 1000;
  const windowEnd = new Date(windowEndMs).toISOString();

  const ipValue = identifier.startsWith('ip:') ? identifier.slice(3) : '';
  if (ipValue) {
    const { data: blocked } = await supabase
      .from('security_ip_blocklist')
      .select('expires_at')
      .eq('ip_address', ipValue)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: blocked.expires_at ? new Date(blocked.expires_at).getTime() : windowEndMs,
      };
    }
  }

  const { data: existing } = await supabase
    .from('security_rate_limits')
    .select('id,count')
    .eq('identifier', identifier)
    .eq('window_start', windowStart)
    .maybeSingle();

  const count = Number(existing?.count ?? 0);
  if (count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: windowEndMs };
  }

  if (existing?.id) {
    try {
      await supabase
        .from('security_rate_limits')
        .update({ count: count + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } catch {
      // Rate-limit persistence must never block the protected route.
    }
  } else {
    try {
      await supabase
        .from('security_rate_limits')
        .insert({
          identifier,
          identifier_type: identifierType(identifier),
          window_start: windowStart,
          window_end: windowEnd,
          count: 1,
          limit_value: config.maxRequests,
        });
    } catch {
      // Rate-limit persistence must never block the protected route.
    }
  }

  return {
    allowed: true,
    remaining: Math.max(config.maxRequests - count - 1, 0),
    resetAt: windowEndMs,
  };
}
