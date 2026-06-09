import crypto from 'crypto';

/**
 * Single source of truth for the app's symmetric encryption secret.
 *
 * Historically three modules each read a DIFFERENT env var name
 * (ENCRYPTION_SECRET / BYOD_ENCRYPTION_KEY / CONNECTOR_ENCRYPTION_KEY), so a
 * deployment had to set all three or connectors silently failed. Resolve them
 * all here: setting ONE var — ENCRYPTION_SECRET (>=16 chars) — unlocks connector
 * OAuth tokens, BYO model keys, and connector secrets.
 *
 * Order: ENCRYPTION_SECRET wins; the others are accepted as back-compat aliases.
 */
const CANDIDATES = [
  'ENCRYPTION_SECRET',
  'BYO_KEY_ENCRYPTION_SECRET',
  'KEY_ENCRYPTION_SECRET',
  'CONNECTOR_ENCRYPTION_KEY',
  'CUBIQO_CONNECTOR_KEY',
];

/** The resolved raw secret (>=16 chars), or null if none is configured. */
export function getEncryptionSecret(): string | null {
  for (const name of CANDIDATES) {
    const v = (process.env[name] || '').trim().replace(/^['"]|['"]$/g, '').trim();
    if (v.length >= 16) return v;
  }
  return null;
}

/** Derive a 32-byte AES-256 key from the resolved secret (sha256), or null. */
export function getEncryptionKey32(): Buffer | null {
  const secret = getEncryptionSecret();
  return secret ? crypto.createHash('sha256').update(secret).digest() : null;
}
