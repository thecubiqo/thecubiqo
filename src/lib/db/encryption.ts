import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getEncryptionKey32 } from '../crypto/encryption-secret';

const ALGORITHM = 'aes-256-gcm';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

function getKey(): Buffer {
  // Prefer an explicit 64-hex BYOD key; otherwise derive from the shared
  // ENCRYPTION_SECRET so setting one var unlocks BYO key storage too.
  const keyHex = process.env.BYOD_ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64 && /^[a-f0-9]+$/i.test(keyHex)) {
    return Buffer.from(keyHex, 'hex');
  }
  const derived = getEncryptionKey32();
  if (derived) return derived;
  throw new Error('Set ENCRYPTION_SECRET (>=16 chars) or BYOD_ENCRYPTION_KEY (64 hex) for BYO key storage');
}

export function encryptKey(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptKey(payload: EncryptedPayload): string {
  const key = getKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'hex')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
