/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API endpoints.
 * Can be upgraded to Redis for distributed systems.
 * 
 * Usage:
 * ```typescript
 * import { checkRateLimit } from '@/lib/security/rate-limit'
 * 
 * export async function POST(request: NextRequest) {
 *   const identifier = request.ip || 'anonymous'
 *   const rateLimitResult = checkRateLimit(identifier, 10, 60000) // 10 requests per minute
 *   
 *   if (!rateLimitResult.allowed) {
 *     return NextResponse.json(
 *       { error: 'Too many requests. Please try again later.' },
 *       { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
 *     )
 *   }
 *   
 *   // Process request
 * }
 * ```
 */

import { NextResponse } from 'next/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Key format: `${identifier}:${window}`
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval to prevent memory leaks
const CLEANUP_INTERVAL = 60000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

/**
 * Start cleanup timer if not already running
 */
function startCleanupTimer() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`)
    }
  }, CLEANUP_INTERVAL)
}

// Start cleanup on module load
startCleanupTimer()

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (IP, user ID, API key, etc.)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  limitOrPreset: number | keyof typeof RateLimits,
  windowMs?: number
): RateLimitResult {
  const now = Date.now()

  let limit: number
  let actualWindowMs: number

  if (typeof limitOrPreset === 'string') {
    const preset = RateLimits[limitOrPreset as keyof typeof RateLimits]
    limit = preset.limit
    actualWindowMs = preset.windowMs
  } else {
    limit = limitOrPreset
    actualWindowMs = windowMs || 60000
  }

  const key = `${identifier}:${actualWindowMs}`

  // Get existing entry or create new one
  let entry = rateLimitStore.get(key)

  // If entry doesn't exist or window has passed, reset
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + actualWindowMs
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: entry.resetTime
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000) // seconds

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    }
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Rate limit middleware helper
 * Returns NextResponse with 429 status if rate limit exceeded
 * 
 * @param identifier - Unique identifier
 * @param limit - Maximum requests
 * @param windowMs - Time window in milliseconds
 * @returns null if allowed, NextResponse with 429 if rate limited
 */
export function enforceRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const result = checkRateLimit(identifier, limit, windowMs)

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000))
        }
      }
    )
  }

  return null
}

/**
 * Get headers for rate limit response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {})
  }
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  // Very strict - for sensitive operations
  STRICT: { limit: 5, windowMs: 60000 }, // 5 per minute

  // Standard - for most API endpoints
  STANDARD: { limit: 30, windowMs: 60000 }, // 30 per minute

  // Lenient - for public read endpoints
  LENIENT: { limit: 100, windowMs: 60000 }, // 100 per minute

  // Authentication attempts - prevent brute force
  AUTH: { limit: 5, windowMs: 300000 }, // 5 per 5 minutes

  // Admin operations - extra strict
  ADMIN: { limit: 10, windowMs: 60000 }, // 10 per minute

  // Export - specialized for privacy
  EXPORT: { limit: 2, windowMs: 86400000 }, // 2 per day
} as const

/**
 * Get identifier from request
 * Compatibility helper for older routes
 */
export function getClientIdentifier(headers: Headers, userId?: string): string {
  return getRequestIdentifier({ headers }, userId)
}

/**
 * Get identifier from request
 * Prioritizes user ID, falls back to IP
 */
export function getRequestIdentifier(
  request: { headers: { get: (key: string) => string | null } },
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get real IP from headers (for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Clear rate limit for an identifier
 * Useful for testing or after successful auth
 */
export function clearRateLimit(identifier: string, windowMs: number): void {
  const key = `${identifier}:${windowMs}`
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  limit: number,
  windowMs: number
): {
  count: number
  remaining: number
  resetTime: number | null
} {
  const key = `${identifier}:${windowMs}`
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < Date.now()) {
    return {
      count: 0,
      remaining: limit,
      resetTime: null
    }
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetTime: entry.resetTime
  }
}

/**
 * Export store for testing/debugging
 */
export function getRateLimitStore(): Map<string, RateLimitEntry> {
  return rateLimitStore
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}
