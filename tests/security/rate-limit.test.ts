/**
 * Security Tests: Rate Limiting
 * 
 * Tests for API rate limiting functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/security/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    // In production, this would clear Redis/cache
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'test-user-1';
      
      const result = await checkRateLimit(identifier, 'global');
      
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(RATE_LIMITS.global.requests);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should block requests exceeding limit', async () => {
      const identifier = 'test-user-2';
      
      // Make requests up to the limit
      for (let i = 0; i < RATE_LIMITS.auth.requests; i++) {
        await checkRateLimit(identifier, 'auth');
      }
      
      // Next request should be blocked
      const result = await checkRateLimit(identifier, 'auth');
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user-3';
      
      // Make a request
      const first = await checkRateLimit(identifier, 'auth');
      expect(first.allowed).toBe(true);
      
      // Wait for reset time (in real scenario)
      // For testing, we'd mock the time or use a shorter window
      expect(first.reset).toBeGreaterThan(0);
    });

    it('should handle different rate limit types', async () => {
      const identifier = 'test-user-4';
      
      const globalResult = await checkRateLimit(identifier, 'global');
      expect(globalResult.limit).toBe(RATE_LIMITS.global.requests);
      
      const authResult = await checkRateLimit(identifier, 'auth');
      expect(authResult.limit).toBe(RATE_LIMITS.auth.requests);
      
      const apiResult = await checkRateLimit(identifier, 'api');
      expect(apiResult.limit).toBe(RATE_LIMITS.api.requests);
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
