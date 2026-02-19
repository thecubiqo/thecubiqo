/**
 * Rate Limiter Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests within the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })

    const r1 = limiter.check('user-1')
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('user-1')
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = limiter.check('user-1')
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 })

    limiter.check('user-1')
    limiter.check('user-1')

    const r3 = limiter.check('user-1')
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('tracks different keys independently', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

    const r1 = limiter.check('user-a')
    expect(r1.allowed).toBe(true)

    // user-a is now exhausted
    expect(limiter.check('user-a').allowed).toBe(false)

    // user-b should still be fine
    const r2 = limiter.check('user-b')
    expect(r2.allowed).toBe(true)
  })

  it('resets after the window expires', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 10_000 })

    limiter.check('user-1')
    expect(limiter.check('user-1').allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(10_001)

    const after = limiter.check('user-1')
    expect(after.allowed).toBe(true)
    expect(after.remaining).toBe(0) // used the one allowed
  })

  it('manual reset clears the bucket', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

    limiter.check('user-1')
    expect(limiter.check('user-1').allowed).toBe(false)

    limiter.reset('user-1')
    expect(limiter.check('user-1').allowed).toBe(true)
  })

  it('returns correct resetAt timestamp', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 30_000 })

    const result = limiter.check('user-1')
    expect(result.resetAt).toBe(Date.now() + 30_000)
  })
})
