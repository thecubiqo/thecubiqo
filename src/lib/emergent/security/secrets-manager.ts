/**
 * Secrets Manager - AES-256-GCM Encryption
 * 
 * Provides secure encryption/decryption for project secrets using AES-256-GCM.
 * All secrets are encrypted before storage and only decrypted server-side.
 * 
 * @module emergent/security/secrets-manager
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encryptedValue: string
  iv: string
  authTag: string
}

/**
 * Get encryption key from environment
 * Must be a 32-byte (256-bit) hex string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.EMERGENT_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!key) {
    throw new Error('EMERGENT_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY not set')
  }

  // Use first 32 bytes of the key (for service role key compatibility)
  const keyBuffer = Buffer.from(key.slice(0, 64), 'utf-8')
  return crypto.createHash('sha256').update(keyBuffer).digest()
}

/**
 * Encrypt a secret value using AES-256-GCM
 * 
 * @param plaintext - The secret value to encrypt
 * @returns Encrypted data with IV and auth tag
 * 
 * @example
 * ```typescript
 * const encrypted = encryptSecret('my-api-key-12345')
 * // Store encrypted.encryptedValue, encrypted.iv, encrypted.authTag in database
 * ```
 */
export function encryptSecret(plaintext: string): EncryptedData {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encryptedValue: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt a secret value using AES-256-GCM
 * 
 * @param encryptedData - The encrypted data from database
 * @returns Decrypted plaintext value
 * @throws {Error} If decryption fails (wrong key, tampered data)
 * 
 * @example
 * ```typescript
 * const plaintext = decryptSecret({
 *   encryptedValue: row.encrypted_value,
 *   iv: row.iv,
 *   authTag: row.auth_tag
 * })
 * ```
 */
export function decryptSecret(encryptedData: EncryptedData): string {
  const key = getEncryptionKey()
  const iv = Buffer.from(encryptedData.iv, 'hex')
  const authTag = Buffer.from(encryptedData.authTag, 'hex')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Rotate a secret by re-encrypting with a new IV
 * 
 * @param encryptedData - Current encrypted data
 * @returns New encrypted data with different IV
 */
export function rotateSecret(encryptedData: EncryptedData): EncryptedData {
  // Decrypt with old key/IV
  const plaintext = decryptSecret(encryptedData)
  
  // Re-encrypt with new IV
  return encryptSecret(plaintext)
}

/**
 * Hash a secret for comparison (one-way)
 * Useful for secret verification without storing plaintext
 * 
 * @param plaintext - The secret value
 * @returns SHA-256 hash (hex)
 */
export function hashSecret(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

/**
 * Validate that a plaintext matches a hash
 * 
 * @param plaintext - The secret value to validate
 * @param hash - The expected hash
 * @returns True if match
 */
export function verifySecretHash(plaintext: string, hash: string): boolean {
  const computedHash = hashSecret(plaintext)
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  )
}

/**
 * Generate a secure random secret
 * 
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random string
 * 
 * @example
 * ```typescript
 * const apiKey = generateSecret(32) // 64 hex characters
 * ```
 */
export function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Mask a secret for display (show only first/last chars)
 * 
 * @param secret - The secret value
 * @param visibleChars - Number of chars to show at start/end (default: 4)
 * @returns Masked string like "sk-1234...7890"
 */
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (secret.length <= visibleChars * 2) {
    return '*'.repeat(secret.length)
  }
  
  const start = secret.slice(0, visibleChars)
  const end = secret.slice(-visibleChars)
  const masked = '*'.repeat(Math.max(8, secret.length - visibleChars * 2))
  
  return `${start}${masked}${end}`
}
