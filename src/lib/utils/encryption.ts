/**
 * Token Encryption Utilities
 * 
 * Uses AES-256-GCM encryption for OAuth tokens
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY1?.slice(0, 32) || ''
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.warn('⚠️  ENCRYPTION_KEY not set or too short. Using fallback from SUPABASE_SERVICE_ROLE_KEY1.')
}

/**
 * Encrypt a token using AES-256-GCM
 */
export function encryptToken(token: string): string {
  try {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
    
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('❌ Encryption failed:', error)
    throw new Error('Failed to encrypt token')
  }
}

/**
 * Decrypt a token using AES-256-GCM
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const parts = encryptedToken.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format')
    }
    
    const [ivHex, authTagHex, encryptedData] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('❌ Decryption failed:', error)
    throw new Error('Failed to decrypt token')
  }
}
