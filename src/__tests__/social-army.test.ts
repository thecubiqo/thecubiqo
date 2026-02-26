/**
 * Social Army — unit tests for shared utilities and configuration.
 *
 * These tests validate that the platforms config and GFXToolz module
 * load correctly and that core methods behave as expected, without
 * needing network or Supabase access.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import path from 'path';

// ── Platforms config ──────────────────────────────────────────────

describe('platforms.json', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const platforms = require('../../social-army/config/platforms.json');

  it('loads as valid JSON and has 10 entries', () => {
    expect(Array.isArray(platforms)).toBe(true);
    expect(platforms.length).toBe(10);
  });

  it('every entry has required fields', () => {
    for (const p of platforms) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('platform');
      expect(p).toHaveProperty('type');
      expect(p).toHaveProperty('handle');
    }
  });

  it('every entry has a valid persona type', () => {
    const VALID_PERSONAS = ['builder', 'guru', 'philosopher', 'artist', 'memer'];
    for (const p of platforms) {
      expect(VALID_PERSONAS).toContain(p.type);
    }
  });

  it('contains all expected platforms', () => {
    const names = platforms.map((p: { platform: string }) => p.platform);
    const expected = ['twitter', 'linkedin', 'instagram', 'tiktok', 'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord'];
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });
});

// ── GFXToolz ──────────────────────────────────────────────────────

describe('GFXToolz', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const GFXToolz = require('../../social-army/src/gfxtoolz');

  it('constructs with user and pass', () => {
    const gfx = new GFXToolz('test-user', 'test-pass');
    expect(gfx.user).toBe('test-user');
    expect(gfx.pass).toBe('test-pass');
    // legacy accessor
    expect(gfx.apiKey).toBe('test-user');
  });

  it('login() without credentials returns false (dry-run)', async () => {
    const gfx = new GFXToolz(undefined, undefined);
    const result = await gfx.login();
    expect(result).toBe(false);
    expect(gfx.authenticated).toBe(false);
  });

  it('login() with invalid credentials returns false gracefully', async () => {
    const gfx = new GFXToolz('bad-user', 'bad-pass');
    // Will fail to connect to the API but should not throw
    const result = await gfx.login();
    expect(result).toBe(false);
    expect(gfx.authenticated).toBe(false);
  });

  it('createProject() returns an object with id', async () => {
    const gfx = new GFXToolz('key', 'pass');
    const result = await gfx.createProject('test');
    expect(result).toHaveProperty('id');
    expect(result.id).toMatch(/^proj_/);
  });

  it('processVideo() returns null in dry-run (unauthenticated)', async () => {
    const gfx = new GFXToolz(undefined, undefined);
    const url = await gfx.processVideo('/tmp/test.mp4', 'builder');
    expect(url).toBeNull();
  });

  it('generateCaption() returns null in dry-run', async () => {
    const gfx = new GFXToolz(undefined, undefined);
    const result = await gfx.generateCaption('AI Topic', 'twitter');
    expect(result).toBeNull();
  });

  it('generateImage() returns null in dry-run', async () => {
    const gfx = new GFXToolz(undefined, undefined);
    const result = await gfx.generateImage('A futuristic AI');
    expect(result).toBeNull();
  });

  it('generateVideo() returns null in dry-run', async () => {
    const gfx = new GFXToolz(undefined, undefined);
    const result = await gfx.generateVideo('AI assistant demo');
    expect(result).toBeNull();
  });
});
