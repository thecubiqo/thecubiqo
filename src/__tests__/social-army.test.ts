/**
 * Social Army — unit tests for shared utilities and configuration.
 *
 * These tests validate that the platforms config and GFXToolz module
 * load correctly and that core methods behave as expected, without
 * needing network or Supabase access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// ── Platforms config ──────────────────────────────────────────────

describe('platforms.json', () => {
  it('loads as valid JSON and has 10 entries', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const platforms = require('../../social-army/config/platforms.json');
    expect(Array.isArray(platforms)).toBe(true);
    expect(platforms.length).toBe(10);
  });

  it('every entry has required fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const platforms = require('../../social-army/config/platforms.json');
    for (const p of platforms) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('platform');
      expect(p).toHaveProperty('type');
      expect(p).toHaveProperty('handle');
    }
  });

  it('contains all expected platforms', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const platforms = require('../../social-army/config/platforms.json');
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

  it('constructs with an API key', () => {
    const gfx = new GFXToolz('test-key');
    expect(gfx.apiKey).toBe('test-key');
  });

  it('login() sets authenticated flag', async () => {
    const gfx = new GFXToolz('test-key');
    await gfx.login();
    expect(gfx.authenticated).toBe(true);
  });

  it('login() without key runs in dry-run mode', async () => {
    const gfx = new GFXToolz(undefined);
    await gfx.login();
    expect(gfx.authenticated).toBe(false);
  });

  it('processVideo() returns a download URL string', async () => {
    const gfx = new GFXToolz('test-key');
    const url = await gfx.processVideo('/tmp/test.mp4', 'builder');
    expect(typeof url).toBe('string');
    expect(url).toContain('gfxtoolz.ai');
  });

  it('createProject() returns an object with id', async () => {
    const gfx = new GFXToolz('key');
    const result = await gfx.createProject('test');
    expect(result).toHaveProperty('id');
    expect(result.id).toMatch(/^proj_/);
  });
});
