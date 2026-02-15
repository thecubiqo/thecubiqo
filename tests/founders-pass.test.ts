// Founders Pass: Unit tests for feature flag logic and preview helpers

import {
  parsePreviewParams,
  buildPreviewUrl,
  applyPreviewOverrides,
  serializePreviewCookie,
} from '../src/lib/founders-pass/preview';
import {
  encryptToken,
  decryptToken,
} from '../src/lib/founders-pass/oauth';
import {
  OAUTH_PROVIDERS,
} from '../src/lib/founders-pass/types';
import crypto from 'crypto';

// ─── Preview helpers ──────────────────────────────────────────────

describe('Preview helpers', () => {
  test('parsePreviewParams parses flag overrides from URL', () => {
    const params = new URLSearchParams('fp_preview=gmail_read:1,shopify:0,stripe:1');
    const result = parsePreviewParams(params);
    expect(result).toEqual({
      gmail_read: true,
      shopify: false,
      stripe: true,
    });
  });

  test('parsePreviewParams returns empty for missing param', () => {
    const params = new URLSearchParams('');
    expect(parsePreviewParams(params)).toEqual({});
  });

  test('buildPreviewUrl generates correct URL', () => {
    const url = buildPreviewUrl('https://example.com/sites/test', {
      gmail_read: true,
      shopify: false,
    });
    expect(url).toContain('fp_preview=');
    expect(url).toContain('gmail_read%3A1');
    expect(url).toContain('shopify%3A0');
  });

  test('applyPreviewOverrides merges overrides onto resolved flags', () => {
    const resolved = { gmail_read: false, shopify: true, stripe: false };
    const preview = { gmail_read: true };
    const result = applyPreviewOverrides(resolved, preview);
    expect(result).toEqual({ gmail_read: true, shopify: true, stripe: false });
  });

  test('serializePreviewCookie produces valid JSON', () => {
    const overrides = { gmail_read: true, shopify: false };
    const cookie = serializePreviewCookie(overrides);
    expect(JSON.parse(cookie)).toEqual(overrides);
  });
});

// ─── OAuth token encryption ──────────────────────────────────────

describe('OAuth token encryption', () => {
  const originalEnv = process.env.OAUTH_ENCRYPTION_KEY;

  beforeAll(() => {
    // Generate a valid 32-byte key for AES-256
    process.env.OAUTH_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.OAUTH_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.OAUTH_ENCRYPTION_KEY;
    }
  });

  test('encrypts and decrypts a token correctly', () => {
    const plaintext = 'ya29.test-access-token-12345';
    const encrypted = encryptToken(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('different encryptions produce different ciphertexts', () => {
    const plaintext = 'test-token';
    const enc1 = encryptToken(plaintext);
    const enc2 = encryptToken(plaintext);
    expect(enc1).not.toBe(enc2); // Different IVs
    expect(decryptToken(enc1)).toBe(plaintext);
    expect(decryptToken(enc2)).toBe(plaintext);
  });

  test('throws with invalid ciphertext', () => {
    expect(() => decryptToken('invalid:data:here')).toThrow();
  });
});

// ─── OAuth provider configs ─────────────────────────────────────

describe('OAuth provider configs', () => {
  test('all providers have required fields', () => {
    const providers = Object.values(OAUTH_PROVIDERS);
    expect(providers.length).toBe(6);

    for (const p of providers) {
      expect(p.provider).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(Array.isArray(p.scopes)).toBe(true);
      expect(p.scopes.length).toBeGreaterThan(0);
      expect(p.icon).toBeTruthy();
    }
  });

  test('gmail provider has correct scopes', () => {
    const gmail = OAUTH_PROVIDERS.gmail;
    expect(gmail.scopes).toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(gmail.scopes).toContain('https://www.googleapis.com/auth/gmail.send');
  });

  test('all providers are enumerated', () => {
    const keys = Object.keys(OAUTH_PROVIDERS);
    expect(keys).toContain('gmail');
    expect(keys).toContain('shopify');
    expect(keys).toContain('printify');
    expect(keys).toContain('printful');
    expect(keys).toContain('stripe');
    expect(keys).toContain('uber');
  });
});

// ─── Type validation ──────────────────────────────────────────────

describe('Type exports', () => {
  test('EventType values are defined', () => {
    // Just verify the module exports correctly
    const types = require('../src/lib/founders-pass/types');
    expect(types.OAUTH_PROVIDERS).toBeDefined();
  });
});
