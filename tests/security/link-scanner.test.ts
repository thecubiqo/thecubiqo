/**
 * Security Tests: Link Scanner and Phishing Detection
 * 
 * Tests for URL scanning and phishing detection
 */

import { describe, it, expect } from 'vitest';
import {
  scanUrl,
  extractUrls,
  scanTextForLinks,
  checkTyposquatting,
} from '@/lib/security/link-scanner';

describe('Link Scanner', () => {
  describe('scanUrl', () => {
    it('should mark trusted domains as safe', async () => {
      const result = await scanUrl('https://google.com');
      
      expect(result.safe).toBe(true);
      expect(result.category).toBe('safe');
      expect(result.threats).toHaveLength(0);
      expect(result.confidence).toBe(100);
    });

    it('should detect IP addresses in URLs', async () => {
      const result = await scanUrl('https://192.168.1.1/login');
      
      expect(result.safe).toBe(false);
      expect(result.category).toBe('suspicious');
      expect(result.threats).toContain('URL uses IP address instead of domain name');
    });

    it('should detect URL shorteners', async () => {
      const result = await scanUrl('https://bit.ly/abc123');
      
      expect(result.safe).toBe(false);
      expect(result.category).toBe('suspicious');
      expect(result.threats).toContain('URL uses a shortening service');
    });

    it('should detect phishing keywords', async () => {
      const result = await scanUrl('https://verify-account-urgent.com');
      
      expect(result.category).toBe('suspicious');
      expect(result.threats).toContain('Contains phishing-related keywords');
    });

    it('should detect @ symbol in URLs', async () => {
      const result = await scanUrl('https://trusted.com@evil.com/');
      
      expect(result.safe).toBe(false);
      expect(result.category).toBe('malicious');
      expect(result.threats).toContain('URL contains @ symbol (potential domain masking)');
    });

    it('should detect suspicious TLDs', async () => {
      const result = await scanUrl('https://example.tk');
      
      expect(result.category).toBe('suspicious');
      expect(result.threats).toContain('Uses suspicious top-level domain');
    });

    it('should detect punycode/unicode domains', async () => {
      // xn--nxasmq6b is a valid punycode domain
      const result = await scanUrl('https://xn--nxasmq6b.com');
      
      // Can be malicious if multiple issues found
      expect(['suspicious', 'malicious']).toContain(result.category);
      expect(result.threats.some(t => t.includes('international characters'))).toBe(true);
    });

    it('should detect excessively long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(200);
      const result = await scanUrl(longUrl);
      
      expect(result.category).toBe('suspicious');
      expect(result.threats).toContain('Unusually long URL');
    });

    it('should reject invalid URLs', async () => {
      const result = await scanUrl('not-a-valid-url');
      
      expect(result.safe).toBe(false);
      expect(result.category).toBe('malicious');
      expect(result.threats).toContain('Invalid URL format');
    });

    it('should provide detailed analysis', async () => {
      const result = await scanUrl('https://test.example.com/path');
      
      expect(result.details).toHaveProperty('protocol');
      expect(result.details).toHaveProperty('domain');
      expect(result.details).toHaveProperty('hasIPAddress');
      expect(result.details).toHaveProperty('hasSubdomains');
      expect(result.details.protocol).toBe('https:');
      expect(result.details.domain).toBe('test.example.com');
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs from text', () => {
      const text = 'Check out https://google.com and http://example.com for more info';
      const urls = extractUrls(text);
      
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://google.com');
      expect(urls).toContain('http://example.com');
    });

    it('should handle text with no URLs', () => {
      const text = 'This text has no URLs in it';
      const urls = extractUrls(text);
      
      expect(urls).toHaveLength(0);
    });

    it('should handle multiple URLs on same line', () => {
      const text = 'Visit https://a.com, https://b.com, and https://c.com';
      const urls = extractUrls(text);
      
      expect(urls).toHaveLength(3);
    });
  });

  describe('scanTextForLinks', () => {
    it('should scan all URLs in text', async () => {
      const text = 'Check https://google.com and https://192.168.1.1';
      const result = await scanTextForLinks(text);
      
      expect(result.urls).toHaveLength(2);
      expect(result.threats).toHaveLength(1); // IP address URL
      expect(result.clean).toBe(false);
    });

    it('should mark text with no URLs as clean', async () => {
      const text = 'This is just plain text';
      const result = await scanTextForLinks(text);
      
      expect(result.clean).toBe(true);
      expect(result.urls).toHaveLength(0);
      expect(result.threats).toHaveLength(0);
    });

    it('should identify all safe URLs', async () => {
      const text = 'Visit https://google.com and https://github.com';
      const result = await scanTextForLinks(text);
      
      expect(result.clean).toBe(true);
      expect(result.urls).toHaveLength(2);
      expect(result.threats).toHaveLength(0);
    });
  });

  describe('checkTyposquatting', () => {
    it('should detect common typosquatting', () => {
      const result = checkTyposquatting('g00gle.com');
      
      expect(result.suspicious).toBe(true);
      expect(result.possibleTarget).toBe('google');
    });

    it('should detect similar brand names', () => {
      const result = checkTyposquatting('paypa1.com');
      
      expect(result.suspicious).toBe(true);
      expect(result.possibleTarget).toBe('paypal');
    });

    it('should not flag legitimate domains', () => {
      const result = checkTyposquatting('example.com');
      
      expect(result.suspicious).toBe(false);
      expect(result.possibleTarget).toBeUndefined();
    });

    it('should detect reversed brand names', () => {
      const result = checkTyposquatting('elppa.com');
      
      expect(result.suspicious).toBe(true);
      expect(result.possibleTarget).toBe('apple');
    });

    it('should detect brands with letter substitution', () => {
      const result = checkTyposquatting('g00gle.com');
      
      expect(result.suspicious).toBe(true);
      expect(result.possibleTarget).toBe('google');
    });
  });
});
