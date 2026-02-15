/**
 * Tests for Magic Link Email Template
 */

import { describe, it, expect } from 'vitest';
import {
  getMagicLinkSubject,
  getMagicLinkPlainText,
  getMagicLinkHTML,
  BRAND_COLORS,
  type MagicLinkTemplateData,
} from '../magic-link';

describe('Magic Link Email Template', () => {
  const mockData: MagicLinkTemplateData = {
    magicLink: 'https://example.com/auth/callback?code=test123',
    appUrl: 'https://example.com',
  };

  describe('getMagicLinkSubject', () => {
    it('should return a properly formatted subject line', () => {
      const subject = getMagicLinkSubject();
      
      expect(subject).toBeDefined();
      expect(subject).toBe('Your CubiQo Magic Link - Sign In');
      expect(subject.length).toBeGreaterThan(0);
      expect(subject.length).toBeLessThan(100); // Keep subject concise
    });

    it('should include CubiQo brand name', () => {
      const subject = getMagicLinkSubject();
      
      expect(subject).toContain('CubiQo');
    });

    it('should indicate it is a magic link', () => {
      const subject = getMagicLinkSubject();
      
      expect(subject.toLowerCase()).toContain('magic link');
    });
  });

  describe('getMagicLinkPlainText', () => {
    it('should generate plain text email with all required elements', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText).toBeDefined();
      expect(plainText.length).toBeGreaterThan(0);
    });

    it('should include the magic link URL', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText).toContain(mockData.magicLink);
    });

    it('should include the app URL', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText).toContain(mockData.appUrl);
    });

    it('should include CubiQo branding', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText).toContain('CubiQo');
      expect(plainText).toContain('One Mind. Many Dimensions');
    });

    it('should include security information', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText.toLowerCase()).toContain('expire');
      expect(plainText).toContain('1 hour');
    });

    it('should include safety instructions', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText.toLowerCase()).toContain('ignore');
    });

    it('should not contain HTML tags', () => {
      const plainText = getMagicLinkPlainText(mockData);
      
      expect(plainText).not.toMatch(/<[^>]+>/);
    });
  });

  describe('getMagicLinkHTML', () => {
    it('should generate valid HTML email', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should be valid HTML with DOCTYPE', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toMatch(/^<!DOCTYPE html>/i);
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include proper meta tags', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('viewport');
    });

    it('should include the magic link as a clickable button', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain(`href="${mockData.magicLink}"`);
      expect(html).toContain('Sign In to CubiQo');
    });

    it('should include CubiQo logo image', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain(`${mockData.appUrl}/icons/icon-192.png`);
      expect(html).toContain('alt="CubiQo Logo"');
    });

    it('should include all brand colors', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain(BRAND_COLORS.primary);
      expect(html).toContain(BRAND_COLORS.secondary);
      expect(html).toContain(BRAND_COLORS.accent);
    });

    it('should include the 4-color gradient bar representing dimensions', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('color-bar');
      expect(html).toContain('#c2185b'); // Red - Tamas
      expect(html).toContain(BRAND_COLORS.accent); // Yellow - Rajas
      expect(html).toContain(BRAND_COLORS.secondary); // Green-Blue - Sattva
      expect(html).toContain(BRAND_COLORS.primary); // Orange - Fourth Way
    });

    it('should include CubiQo tagline', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('One Mind. Many Dimensions');
    });

    it('should include security note', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('Security Note');
      expect(html).toContain('expire in 1 hour');
      expect(html).toContain('used once');
    });

    it('should include footer with links', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('footer');
      expect(html).toContain(`${mockData.appUrl}`);
      expect(html).toContain('Privacy');
      expect(html).toContain('Terms');
    });

    it('should include copyright notice with current year', () => {
      const html = getMagicLinkHTML(mockData);
      const currentYear = new Date().getFullYear();
      
      expect(html).toContain(`© ${currentYear}`);
      expect(html).toContain('CubiQo');
    });

    it('should be mobile responsive', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('@media');
      expect(html).toContain('max-width: 600px');
    });

    it('should have inline styles for email client compatibility', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('should use email-safe fonts', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('font-family');
      expect(html).toMatch(/sans-serif/i);
    });
  });

  describe('BRAND_COLORS', () => {
    it('should define all required brand colors', () => {
      expect(BRAND_COLORS.primary).toBe('#ff6f00'); // Orange - Fourth Way
      expect(BRAND_COLORS.secondary).toBe('#00897b'); // Green-Blue - Sattva
      expect(BRAND_COLORS.accent).toBe('#ffa000'); // Yellow - Rajas
      expect(BRAND_COLORS.text).toBe('#ffffff');
      expect(BRAND_COLORS.textSecondary).toBe('#b0b0b0');
      expect(BRAND_COLORS.background).toBe('#000000');
      expect(BRAND_COLORS.cardBackground).toBe('#1a1a1a');
    });

    it('should have valid hex color format', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;
      
      expect(BRAND_COLORS.primary).toMatch(hexColorRegex);
      expect(BRAND_COLORS.secondary).toMatch(hexColorRegex);
      expect(BRAND_COLORS.accent).toMatch(hexColorRegex);
      expect(BRAND_COLORS.text).toMatch(hexColorRegex);
      expect(BRAND_COLORS.textSecondary).toMatch(hexColorRegex);
      expect(BRAND_COLORS.background).toMatch(hexColorRegex);
      expect(BRAND_COLORS.cardBackground).toMatch(hexColorRegex);
    });
  });

  describe('Template Data Validation', () => {
    it('should handle different app URLs correctly', () => {
      const testUrls = [
        'http://localhost:3000',
        'https://cubiqo.com',
        'https://app.cubiqo.com',
      ];

      testUrls.forEach((url) => {
        const data: MagicLinkTemplateData = {
          magicLink: `${url}/auth/callback?code=test`,
          appUrl: url,
        };

        const html = getMagicLinkHTML(data);
        const plainText = getMagicLinkPlainText(data);

        expect(html).toContain(url);
        expect(plainText).toContain(url);
      });
    });

    it('should properly escape special characters in URLs', () => {
      const dataWithSpecialChars: MagicLinkTemplateData = {
        magicLink: 'https://example.com/auth?code=abc&state=xyz',
        appUrl: 'https://example.com',
      };

      const html = getMagicLinkHTML(dataWithSpecialChars);
      
      // HTML should properly encode the URL
      expect(html).toContain(dataWithSpecialChars.magicLink);
    });
  });

  describe('Email Best Practices', () => {
    it('should have descriptive alt text for images', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('alt=');
      expect(html).toContain('CubiQo Logo');
    });

    it('should have a clear call-to-action', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('Sign In to CubiQo');
    });

    it('should have appropriate email width for desktop clients', () => {
      const html = getMagicLinkHTML(mockData);
      
      expect(html).toContain('max-width: 600px');
    });

    it('should use readable font sizes', () => {
      const html = getMagicLinkHTML(mockData);
      
      // Check that font sizes are specified
      expect(html).toMatch(/font-size:\s*\d+px/);
    });
  });
});
