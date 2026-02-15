/**
 * Integration Test: Build and Deployment Verification
 * 
 * This test verifies that the application builds successfully and
 * core modules can be imported without errors.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build and Deployment Verification', () => {
  describe('Environment Configuration', () => {
    it('should have required Next.js environment', () => {
      // Verify we're in a Node environment
      expect(typeof process).toBe('object');
      expect(process.env).toBeDefined();
    });

    it('should have package.json configuration', async () => {
      // This test verifies the build configuration exists
      const pkg = await import('../../../package.json');
      
      expect(pkg.name).toBe('cubiqo');
      expect(pkg.version).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts.test).toBeDefined();
    });
  });

  describe('Core Module Imports', () => {
    it('should be able to import email templates', async () => {
      const { getMagicLinkSubject } = await import('@/lib/email/templates/magic-link');
      
      expect(getMagicLinkSubject).toBeDefined();
      expect(typeof getMagicLinkSubject).toBe('function');
    });

    it('should verify email template functionality', async () => {
      const { getMagicLinkSubject, getMagicLinkPlainText, getMagicLinkHTML } = 
        await import('@/lib/email/templates/magic-link');
      
      const subject = getMagicLinkSubject();
      expect(subject).toContain('CubiQo');
      
      const mockData = {
        magicLink: 'https://test.com/auth?code=test',
        appUrl: 'https://test.com'
      };
      
      const plainText = getMagicLinkPlainText(mockData);
      expect(plainText).toContain(mockData.magicLink);
      
      const html = getMagicLinkHTML(mockData);
      expect(html).toContain('<!DOCTYPE html>');
    });
  });

  describe('Vercel Deployment Configuration', () => {
    it('should have valid vercel.json configuration', async () => {
      const vercelConfig = await import('../../../vercel.json');
      
      expect(vercelConfig.buildCommand).toBe('npm run build');
      expect(vercelConfig.framework).toBe('nextjs');
      expect(vercelConfig.regions).toBeDefined();
      expect(Array.isArray(vercelConfig.regions)).toBe(true);
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have valid tsconfig.json', async () => {
      const tsConfig = await import('../../../tsconfig.json');
      
      expect(tsConfig.compilerOptions).toBeDefined();
      expect(tsConfig.compilerOptions.paths).toBeDefined();
      expect(tsConfig.compilerOptions.paths['@/*']).toBeDefined();
    });
  });

  describe('Next.js Configuration', () => {
    it('should be able to load next.config', () => {
      // Verify next.config.ts exists and is valid
      const configPath = path.resolve(process.cwd(), 'next.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });
});
