import { decryptToken, encryptToken, tokenHint } from '@/next/app/api/_lib/token-vault';

export function encrypt(text: string): string {
  return encryptToken(text);
}

export function decrypt(data: string): string {
  return decryptToken(data);
}

export function hint(text: string): string {
  return tokenHint(text);
}
