/**
 * BYO API Key Encryption/Decryption
 * 
 * Uses Web Crypto API to encrypt API keys at rest
 * Security: AES-GCM with PBKDF2 key derivation
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Days 1-2: BYO AI Router Integration
 */

// Algorithm configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100000; // PBKDF2 iterations
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a random salt for PBKDF2
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random initialization vector for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive encryption key from passphrase using PBKDF2
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt API key using passphrase
 * 
 * @param apiKey - The API key to encrypt
 * @param passphrase - User's passphrase (typically user ID + secret)
 * @returns Base64-encoded encrypted data (salt + iv + ciphertext)
 */
export async function encryptKey(
  apiKey: string,
  passphrase: string
): Promise<string> {
  try {
    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key
    const key = await deriveKey(passphrase, salt);

    // Encrypt the API key
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      data
    );

    // Combine salt + iv + ciphertext
    const combined = new Uint8Array(
      salt.length + iv.length + ciphertext.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[BYO Encryption] Failed to encrypt key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt API key using passphrase
 * 
 * @param encryptedKey - Base64-encoded encrypted data
 * @param passphrase - User's passphrase (must match encryption passphrase)
 * @returns Decrypted API key
 */
export async function decryptKey(
  encryptedKey: string,
  passphrase: string
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedKey), (c) =>
      c.charCodeAt(0)
    );

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive decryption key
    const key = await deriveKey(passphrase, salt);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      ciphertext
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[BYO Encryption] Failed to decrypt key:', error);
    throw new Error('Failed to decrypt API key - invalid passphrase or corrupted data');
  }
}

/**
 * Validate that a key can be encrypted and decrypted
 * Used for testing encryption integrity
 */
export async function validateEncryption(
  apiKey: string,
  passphrase: string
): Promise<boolean> {
  try {
    const encrypted = await encryptKey(apiKey, passphrase);
    const decrypted = await decryptKey(encrypted, passphrase);
    return decrypted === apiKey;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a secure passphrase from user ID and environment secret
 * This ensures keys are tied to specific users and environments
 */
export function generatePassphrase(userId: string): string {
  // Use user ID + app secret for passphrase
  // In production, use process.env.BYO_ENCRYPTION_SECRET
  const secret = process.env.BYO_ENCRYPTION_SECRET || 'default-secret-change-in-production';
  return `${userId}-${secret}`;
}

/**
 * Hash a passphrase for verification (without storing the actual passphrase)
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
