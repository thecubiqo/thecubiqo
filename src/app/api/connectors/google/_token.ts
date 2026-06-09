/**
 * Google OAuth token at-rest encryption helpers.
 *
 * Google access/refresh tokens are high-privilege (Gmail read+send, Calendar
 * read+write) and were previously stored in PLAINTEXT — inconsistent with every
 * other connector, which encrypts via the AES-256-GCM token vault. These helpers
 * bring Google in line: encrypt on write, decrypt on read, with a legacy
 * fallback so rows written before encryption (no `v1:` prefix) still work until
 * they are naturally rewritten on the next token refresh.
 */

import { encryptToken, decryptToken } from '@/next/app/api/_lib/token-vault';

/** Encrypt a Google token for storage. Returns null for empty input. */
export function encGoogleToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return encryptToken(token);
}

/** Decrypt a stored Google token. Legacy plaintext rows (no `v1:` prefix) are
 *  returned as-is so existing connections keep working through the transition. */
export function decGoogleToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith('v1:')) return stored; // legacy plaintext
  try {
    return decryptToken(stored);
  } catch {
    return null; // tampered / unreadable ciphertext → force reconnect
  }
}
