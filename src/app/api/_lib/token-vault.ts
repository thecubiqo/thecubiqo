import crypto from 'crypto';
import { cleanEnv } from './supabase-admin';

const TOKEN_VERSION = 'v1';

function getEncryptionKey() {
  const secret = cleanEnv(process.env.ENCRYPTION_SECRET);
  if (!secret || secret.length < 16) {
    throw new Error('ENCRYPTION_SECRET is required for connector token storage');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function maskToken(token: string) {
  if (!token) return '';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function encryptToken(token: string): string {
  if (!token) throw new Error('Token is required');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

export function decryptToken(encrypted: string): string {
  const [version, iv, tag, ciphertext] = String(encrypted || '').split(':');
  if (version !== TOKEN_VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Stored connector token is invalid');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

export function tokenHint(token: string) {
  return maskToken(token);
}
