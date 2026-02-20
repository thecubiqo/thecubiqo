/**
 * Rate Limiting Middleware
 * 
 * Implements request rate limiting to prevent abuse and DDoS attacks.
 * Uses in-memory store for rate limiting (for serverless environments).
 */

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  global: { requests: 100, window: 60 }, // 100 requests per minute
  authenticated: { requests: 1000, window: 60 }, // 1000 requests per minute
  api: { requests: 50, window: 60 }, // 50 AI API calls per minute
  auth: { requests: 10, window: 300 }, // 10 auth attempts per 5 minutes
  export: { requests: 5, window: 3600 }, // 5 data exports per hour
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'global'
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + (config.window * 1000),
    };
    rateLimitStore.set(key, entry);
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  const allowed = entry.count <= config.requests;
  const remaining = Math.max(0, config.requests - entry.count);
  
  return {
    allowed,
    limit: config.requests,
    remaining,
    reset: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(
  headers: Headers,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get real IP from various headers
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
