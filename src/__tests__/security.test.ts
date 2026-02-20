/**
 * Security Integration Tests
 * 
 * Tests for Phase 1 Critical Security Fixes:
 * - Admin authentication
 * - Rate limiting
 * - Input validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, clearAllRateLimits, RateLimits } from '@/lib/security/rate-limit'
import { validateRequest, journalEntrySchema, emailSchema, uuidSchema } from '@/lib/validation/schemas'

describe('Security - Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limits before each test
    clearAllRateLimits()
  })

  it('should allow requests within limit', () => {
    const identifier = 'test-user-1'
    
    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(identifier, 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5 - i - 1)
    }
  })

  it('should block requests exceeding limit', () => {
    const identifier = 'test-user-2'
    
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, 5, 60000)
    }
    
    // Next request should be blocked
    const result = checkRateLimit(identifier, 5, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('should reset after time window', () => {
    const identifier = 'test-user-3'
    
    // Use up the limit with a 100ms window
    for (let i = 0; i < 3; i++) {
      checkRateLimit(identifier, 3, 100)
    }
    
    // Should be blocked
    let result = checkRateLimit(identifier, 3, 100)
    expect(result.allowed).toBe(false)
    
    // Wait for window to pass
    return new Promise(resolve => {
      setTimeout(() => {
        // Should be allowed again
        result = checkRateLimit(identifier, 3, 100)
        expect(result.allowed).toBe(true)
        resolve(undefined)
      }, 150)
    })
  })

  it('should track different identifiers separately', () => {
    checkRateLimit('user-1', 5, 60000)
    checkRateLimit('user-1', 5, 60000)
    checkRateLimit('user-2', 5, 60000)
    
    const result1 = checkRateLimit('user-1', 5, 60000)
    expect(result1.remaining).toBe(2) // 3rd request
    
    const result2 = checkRateLimit('user-2', 5, 60000)
    expect(result2.remaining).toBe(3) // 2nd request
  })

  it('should use preset configurations correctly', () => {
    const identifier = 'test-user-4'
    
    // Test STRICT preset (5 per minute)
    for (let i = 0; i < RateLimits.STRICT.limit; i++) {
      const result = checkRateLimit(
        identifier,
        RateLimits.STRICT.limit,
        RateLimits.STRICT.windowMs
      )
      expect(result.allowed).toBe(true)
    }
    
    // Should be blocked on next request
    const result = checkRateLimit(
      identifier,
      RateLimits.STRICT.limit,
      RateLimits.STRICT.windowMs
    )
    expect(result.allowed).toBe(false)
  })
})

describe('Security - Input Validation', () => {
  describe('Journal Entry Validation', () => {
    it('should validate correct journal entry', () => {
      const validEntry = {
        content: 'Today was a great day!',
        mood: 'happy',
        tags: ['personal', 'reflection'],
        isPrivate: true
      }
      
      const result = validateRequest(journalEntrySchema, validEntry)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).toBe('Today was a great day!')
        expect(result.data.mood).toBe('happy')
      }
    })

    it('should reject empty content', () => {
      const invalidEntry = {
        content: '',
        mood: 'happy'
      }
      
      const result = validateRequest(journalEntrySchema, invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject content that is too long', () => {
      const invalidEntry = {
        content: 'x'.repeat(50001) // Exceeds 50000 char limit
      }
      
      const result = validateRequest(journalEntrySchema, invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should reject invalid mood', () => {
      const invalidEntry = {
        content: 'Test entry',
        mood: 'invalid_mood'
      }
      
      const result = validateRequest(journalEntrySchema, invalidEntry)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields to be omitted', () => {
      const minimalEntry = {
        content: 'Minimal entry'
      }
      
      const result = validateRequest(journalEntrySchema, minimalEntry)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPrivate).toBe(true) // Default value
      }
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email', () => {
      const result = validateRequest(emailSchema, 'user@example.com')
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = validateRequest(emailSchema, 'not-an-email')
      expect(result.success).toBe(false)
    })
  })

  describe('UUID Validation', () => {
    it('should validate correct UUID', () => {
      const result = validateRequest(uuidSchema, '123e4567-e89b-12d3-a456-426614174000')
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = validateRequest(uuidSchema, 'not-a-uuid')
      expect(result.success).toBe(false)
    })
  })
})

describe('Security - Admin Authentication (Unit Tests)', () => {
  // Note: Full integration tests require Supabase setup
  // These are basic unit tests for the helper functions
  
  it('should have isAdmin function available', async () => {
    // This is a smoke test to ensure the module can be imported
    const { isAdmin } = await import('@/lib/auth/admin')
    expect(typeof isAdmin).toBe('function')
  })

  it('should have requireAdmin function available', async () => {
    const { requireAdmin } = await import('@/lib/auth/admin')
    expect(typeof requireAdmin).toBe('function')
  })

  it('should have checkAdminAuth function available', async () => {
    const { checkAdminAuth } = await import('@/lib/auth/admin')
    expect(typeof checkAdminAuth).toBe('function')
  })
})
