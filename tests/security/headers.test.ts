/**
 * Security Tests: Security Headers
 * 
 * Tests for security headers middleware
 */

import { describe, it, expect } from 'vitest';
import {
  getSecurityHeaders,
  getContentSecurityPolicy,
  getCORSHeaders,
  validateOrigin,
  sanitizeInput,
  validateUrl,
  isBot,
} from '@/lib/security/headers';

describe('Security Headers', () => {
  describe('getSecurityHeaders', () => {
    it('should return all required security headers', () => {
      const headers = getSecurityHeaders();
      
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('Referrer-Policy');
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('Content-Security-Policy');
    });

    it('should include HSTS with preload', () => {
      const headers = getSecurityHeaders();
      
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
      expect(headers['Strict-Transport-Security']).toContain('preload');
    });

    it('should grant camera access to self (not deny all)', () => {
      const headers = getSecurityHeaders();
      expect(headers['Permissions-Policy']).toContain('camera=(self)');
    });

    it('should grant microphone access to self (not wildcard)', () => {
      const headers = getSecurityHeaders();
      expect(headers['Permissions-Policy']).toContain('microphone=(self)');
    });
  });

  describe('getContentSecurityPolicy', () => {
    it('should return comprehensive CSP', () => {
      const csp = getContentSecurityPolicy();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should allow necessary external domains', () => {
      const csp = getContentSecurityPolicy();
      
      expect(csp).toContain('supabase.co');
      expect(csp).toContain('api.openai.com');
      expect(csp).toContain('api.anthropic.com');
    });
  });

  describe('getCORSHeaders', () => {
    it('should allow whitelisted origins', () => {
      const origin = 'https://cubiqo.ai';
      const headers = getCORSHeaders(origin);
      
      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should reject non-whitelisted origins', () => {
      const origin = 'https://evil.com';
      const headers = getCORSHeaders(origin);
      
      expect(headers['Access-Control-Allow-Origin']).not.toBe(origin);
    });

    it('should include allowed methods and headers', () => {
      const headers = getCORSHeaders();
      
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
    });
  });

  describe('validateOrigin', () => {
    it('should validate allowed origins', () => {
      expect(validateOrigin('https://cubiqo.ai', null)).toBe(true);
      expect(validateOrigin('http://localhost:3000', null)).toBe(true);
    });

    it('should reject disallowed origins', () => {
      expect(validateOrigin('https://evil.com', null)).toBe(false);
    });

    it('should validate referer when origin is missing', () => {
      expect(validateOrigin(null, 'https://cubiqo.ai/page')).toBe(true);
    });

    it('should allow requests without origin/referer', () => {
      // Server-to-server requests
      expect(validateOrigin(null, null)).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const input = 'He said "hello" and \'goodbye\'';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toContain('&quot;');
      expect(sanitized).toContain('&#x27;');
    });

    it('should escape forward slashes', () => {
      const input = '</script>';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toContain('&#x2F;');
    });
  });

  describe('validateUrl', () => {
    it('should validate safe URLs', () => {
      const result = validateUrl('https://google.com');
      
      expect(result.valid).toBe(true);
      expect(result.threats).toHaveLength(0);
    });

    it('should detect javascript: protocol', () => {
      const result = validateUrl('javascript:alert("XSS")');
      
      expect(result.valid).toBe(false);
      expect(result.threats).toContain('Invalid protocol');
    });

    it('should detect suspicious patterns', () => {
      const result = validateUrl('https://example.com/<script>alert(1)</script>');
      
      expect(result.valid).toBe(false);
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it('should detect potential phishing URLs', () => {
      const result = validateUrl('https://paypal-verify-account-login.com');
      
      expect(result.threats.length).toBeGreaterThan(0);
    });

    it('should detect IP addresses in hostname', () => {
      const result = validateUrl('https://192.168.1.1/login');
      
      expect(result.threats).toContain('Potential phishing URL');
    });

    it('should reject invalid URLs', () => {
      const result = validateUrl('not-a-url');
      
      expect(result.valid).toBe(false);
      expect(result.threats).toContain('Invalid URL format');
    });
  });

  describe('isBot', () => {
    it('should detect common bot user agents', () => {
      expect(isBot('Googlebot/2.1')).toBe(true);
      expect(isBot('curl/7.68.0')).toBe(true);
      expect(isBot('python-requests/2.25.1')).toBe(true);
    });

    it('should allow normal browser user agents', () => {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      expect(isBot(chromeUA)).toBe(false);
    });

    it('should detect empty user agent', () => {
      expect(isBot('')).toBe(true);
    });
  });
});
