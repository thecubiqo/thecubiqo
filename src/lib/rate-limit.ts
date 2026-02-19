/**
 * Rate Limiting Utility
 *
 * Provides a reusable, in-memory sliding-window rate limiter for API routes.
 * Keyed by an arbitrary identifier (IP, session ID, user ID, etc.).
 *
 * For production at scale, swap the backing store for Redis or Supabase.
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number
  /** Window duration in milliseconds. */
  windowMs: number
}

interface TokenBucket {
  count: number
  resetTime: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Create a rate limiter instance with the given configuration.
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 })
 *
 * export async function POST(req: NextRequest) {
 *   const key = req.headers.get('x-session-id') ?? req.ip ?? 'anon'
 *   const { allowed, remaining } = limiter.check(key)
 *   if (!allowed) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 *   }
 *   // …handle request
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowMs } = config
  const buckets = new Map<string, TokenBucket>()

  // Periodic cleanup to avoid memory leaks from stale keys
  const CLEANUP_INTERVAL = Math.max(windowMs * 2, 60_000)
  let lastCleanup = Date.now()

  function cleanup() {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now

    for (const [key, bucket] of buckets) {
      if (now > bucket.resetTime) {
        buckets.delete(key)
      }
    }
  }

  function check(key: string): RateLimitResult {
    cleanup()

    const now = Date.now()
    const bucket = buckets.get(key)

    // Window expired or first request — start fresh
    if (!bucket || now > bucket.resetTime) {
      const resetTime = now + windowMs
      buckets.set(key, { count: 1, resetTime })
      return { allowed: true, remaining: maxRequests - 1, resetAt: resetTime }
    }

    if (bucket.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetTime }
    }

    bucket.count++
    return {
      allowed: true,
      remaining: maxRequests - bucket.count,
      resetAt: bucket.resetTime,
    }
  }

  function reset(key: string): void {
    buckets.delete(key)
  }

  return { check, reset }
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for common API tiers
// ---------------------------------------------------------------------------

/** General API rate limiter: 60 req / min */
export const apiRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
})

/** Code-execution / terminal rate limiter: 20 req / min */
export const terminalRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60_000,
})
