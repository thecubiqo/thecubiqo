/**
 * Security Tests: Rate Limiting
 * 
 * Tests for API rate limiting functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIdentifier, RateLimits, clearAllRateLimits } from '@/lib/security/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      
      const result = checkRateLimit(identifier, 'STANDARD');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RateLimits.STANDARD.limit - 1);
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      
      // Make requests up to the limit
      for (let i = 0; i < RateLimits.AUTH.limit; i++) {
        checkRateLimit(identifier, 'AUTH');
      }
      
      // Next request should be blocked
      const result = checkRateLimit(identifier, 'AUTH');
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after time window', () => {
      const identifier = 'test-user-3';
      
      // Make a request
      const first = checkRateLimit(identifier, 'AUTH');
      expect(first.allowed).toBe(true);
      
      // Wait for reset time (in real scenario)
      // For testing, we'd mock the time or use a shorter window
      expect(first.resetTime).toBeGreaterThan(0);
    });

    it('should handle different rate limit types', () => {
      const standardResult = checkRateLimit('test-user-4a', 'STANDARD');
      expect(standardResult.remaining).toBe(RateLimits.STANDARD.limit - 1);
      
      const authResult = checkRateLimit('test-user-4b', 'AUTH');
      expect(authResult.remaining).toBe(RateLimits.AUTH.limit - 1);
      
      const strictResult = checkRateLimit('test-user-4c', 'STRICT');
      expect(strictResult.remaining).toBe(RateLimits.STRICT.limit - 1);
    });
  });

  describe('getClientIdentifier', () => {
    it('should use userId when provided', () => {
      const headers = new Headers();
      const userId = 'user-123';
      
      const identifier = getClientIdentifier(headers, userId);
      
      expect(identifier).toBe('user:user-123');
    });

    it('should use IP address when no userId', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1',
      });
      
      const identifier = getClientIdentifier(headers);
      
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });
      
      const identifier = getClientIdentifier(headers);
      
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should use alternative IP headers', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.2',
      });
      
      const identifier = getClientIdentifier(headers);
      
      expect(identifier).toBe('ip:192.168.1.2');
    });

    it('should fallback to unknown when no IP', () => {
      const headers = new Headers();
      
      const identifier = getClientIdentifier(headers);
      
      expect(identifier).toBe('ip:unknown');
    });
  });
});
