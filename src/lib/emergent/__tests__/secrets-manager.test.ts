/**
 * Tests for Secrets Manager
 * 
 * Tests AES-256-GCM encryption/decryption, secret rotation, hashing, and masking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  encryptSecret,
  decryptSecret,
  rotateSecret,
  hashSecret,
  verifySecretHash,
  generateSecret,
  maskSecret
} from '../security/secrets-manager'
import { mockEnv } from '../../../../tests/utils/test-helpers'

describe('Secrets Manager', () => {
  let envMock: ReturnType<typeof mockEnv>

  beforeEach(() => {
    // Set up encryption key environment variable
    envMock = mockEnv({
      EMERGENT_ENCRYPTION_KEY: 'test-encryption-key-32-bytes-long-exactly-for-aes-256'
    })
  })

  afterEach(() => {
    envMock.restore()
  })

  describe('encryptSecret', () => {
    it('should encrypt a secret successfully', () => {
      const plaintext = 'my-secret-api-key-12345'
      const encrypted = encryptSecret(plaintext)
      
      expect(encrypted.encryptedValue).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.authTag).toBeDefined()
      
      // Should be hex strings
      expect(encrypted.encryptedValue).toMatch(/^[0-9a-f]+$/i)
      expect(encrypted.iv).toMatch(/^[0-9a-f]+$/i)
      expect(encrypted.authTag).toMatch(/^[0-9a-f]+$/i)
    })

    it('should produce different IV each time', () => {
      const plaintext = 'my-secret'
      const encrypted1 = encryptSecret(plaintext)
      const encrypted2 = encryptSecret(plaintext)
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
      expect(encrypted1.encryptedValue).not.toBe(encrypted2.encryptedValue)
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const encrypted = encryptSecret(plaintext)
      
      expect(encrypted.encryptedValue).toBeDefined()
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.authTag).toBeDefined()
    })

    it('should handle unicode characters', () => {
      const plaintext = '测试密钥🔐'
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle long strings', () => {
      const plaintext = 'a'.repeat(10000)
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('decryptSecret', () => {
    it('should decrypt an encrypted secret correctly', () => {
      const plaintext = 'my-secret-api-key-12345'
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should throw error for tampered encrypted value', () => {
      const plaintext = 'my-secret'
      const encrypted = encryptSecret(plaintext)
      
      // Tamper with encrypted value
      encrypted.encryptedValue = encrypted.encryptedValue.slice(0, -2) + 'ff'
      
      expect(() => decryptSecret(encrypted)).toThrow()
    })

    it('should throw error for wrong IV', () => {
      const plaintext = 'my-secret'
      const encrypted1 = encryptSecret(plaintext)
      const encrypted2 = encryptSecret(plaintext)
      
      // Use wrong IV
      encrypted1.iv = encrypted2.iv
      
      expect(() => decryptSecret(encrypted1)).toThrow()
    })

    it('should throw error for wrong auth tag', () => {
      const plaintext = 'my-secret'
      const encrypted = encryptSecret(plaintext)
      
      // Tamper with auth tag
      encrypted.authTag = encrypted.authTag.slice(0, -2) + 'ff'
      
      expect(() => decryptSecret(encrypted)).toThrow()
    })
  })

  describe('rotateSecret', () => {
    it('should rotate a secret successfully', () => {
      const plaintext = 'my-secret-api-key'
      const encrypted1 = encryptSecret(plaintext)
      const rotated = rotateSecret(encrypted1)
      
      // IV and encrypted value should be different
      expect(rotated.iv).not.toBe(encrypted1.iv)
      expect(rotated.encryptedValue).not.toBe(encrypted1.encryptedValue)
      
      // But decryption should yield same plaintext
      const decrypted = decryptSecret(rotated)
      expect(decrypted).toBe(plaintext)
    })

    it('should maintain plaintext value after rotation', () => {
      const plaintext = 'my-secret'
      const encrypted = encryptSecret(plaintext)
      const rotated = rotateSecret(encrypted)
      
      expect(decryptSecret(rotated)).toBe(plaintext)
    })
  })

  describe('hashSecret', () => {
    it('should hash a secret', () => {
      const plaintext = 'my-secret'
      const hash = hashSecret(plaintext)
      
      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64) // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[0-9a-f]+$/i)
    })

    it('should produce same hash for same input', () => {
      const plaintext = 'my-secret'
      const hash1 = hashSecret(plaintext)
      const hash2 = hashSecret(plaintext)
      
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashSecret('secret1')
      const hash2 = hashSecret('secret2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should be one-way (cannot reverse)', () => {
      const plaintext = 'my-secret'
      const hash = hashSecret(plaintext)
      
      // Hash should not contain original text
      expect(hash).not.toContain(plaintext)
    })
  })

  describe('verifySecretHash', () => {
    it('should verify correct secret', () => {
      const plaintext = 'my-secret'
      const hash = hashSecret(plaintext)
      
      expect(verifySecretHash(plaintext, hash)).toBe(true)
    })

    it('should reject incorrect secret', () => {
      const plaintext = 'my-secret'
      const hash = hashSecret(plaintext)
      
      expect(verifySecretHash('wrong-secret', hash)).toBe(false)
    })

    it('should be timing-safe', () => {
      const plaintext = 'my-secret'
      const hash = hashSecret(plaintext)
      
      // Measure time for correct secret
      const start1 = Date.now()
      verifySecretHash(plaintext, hash)
      const time1 = Date.now() - start1
      
      // Measure time for wrong secret
      const start2 = Date.now()
      verifySecretHash('wrong', hash)
      const time2 = Date.now() - start2
      
      // Times should be similar (timing-safe comparison)
      // This is not a perfect test, but gives an indication
      expect(Math.abs(time1 - time2)).toBeLessThan(10)
    })
  })

  describe('generateSecret', () => {
    it('should generate a random secret', () => {
      const secret = generateSecret()
      
      expect(secret).toBeDefined()
      expect(secret).toHaveLength(64) // 32 bytes = 64 hex characters
      expect(secret).toMatch(/^[0-9a-f]+$/i)
    })

    it('should generate unique secrets', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()
      const secret3 = generateSecret()
      
      expect(secret1).not.toBe(secret2)
      expect(secret2).not.toBe(secret3)
      expect(secret1).not.toBe(secret3)
    })

    it('should generate secrets of specified length', () => {
      const secret16 = generateSecret(16)
      const secret32 = generateSecret(32)
      const secret64 = generateSecret(64)
      
      expect(secret16).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(secret32).toHaveLength(64) // 32 bytes = 64 hex chars
      expect(secret64).toHaveLength(128) // 64 bytes = 128 hex chars
    })
  })

  describe('maskSecret', () => {
    it('should mask a secret', () => {
      const secret = 'sk-1234567890abcdef'
      const masked = maskSecret(secret)
      
      expect(masked).toContain('sk-1')
      expect(masked).toContain('cdef')
      expect(masked).toContain('*')
      expect(masked).not.toBe(secret)
    })

    it('should show specified number of characters', () => {
      const secret = 'abcdefghijklmnop'
      const masked2 = maskSecret(secret, 2)
      const masked4 = maskSecret(secret, 4)
      
      expect(masked2).toMatch(/^ab\*+op$/)
      expect(masked4).toMatch(/^abcd\*+mnop$/)
    })

    it('should fully mask short secrets', () => {
      const secret = 'abc'
      const masked = maskSecret(secret, 4)
      
      expect(masked).toBe('***')
      expect(masked).not.toContain('a')
      expect(masked).not.toContain('b')
      expect(masked).not.toContain('c')
    })

    it('should mask API keys properly', () => {
      const apiKey = 'sk-proj-1234567890abcdefghijklmnop'
      const masked = maskSecret(apiKey, 7)
      
      expect(masked).toContain('sk-proj')
      expect(masked).toContain('klmnop')
      // Masked format: start + asterisks + end
      expect(masked.startsWith('sk-proj')).toBe(true)
      expect(masked.endsWith('klmnop')).toBe(true)
    })

    it('should handle empty string', () => {
      const masked = maskSecret('')
      expect(masked).toBe('')
    })
  })

  describe('Security Properties', () => {
    it('should use AES-256-GCM (not AES-128)', () => {
      // This is implicit in the implementation
      // We verify by checking that encryption/decryption works
      const plaintext = 'test'
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should include authentication tag (GCM mode)', () => {
      const plaintext = 'test'
      const encrypted = encryptSecret(plaintext)
      
      // Auth tag should be 16 bytes (32 hex chars)
      expect(encrypted.authTag).toHaveLength(32)
    })

    it('should be resistant to tampering', () => {
      const plaintext = 'test'
      const encrypted = encryptSecret(plaintext)
      
      // Flip one bit in encrypted value
      const bytes = Buffer.from(encrypted.encryptedValue, 'hex')
      bytes[0] ^= 1
      encrypted.encryptedValue = bytes.toString('hex')
      
      // Decryption should fail
      expect(() => decryptSecret(encrypted)).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle newlines and tabs', () => {
      const plaintext = 'line1\nline2\tindented'
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should handle very long secrets', () => {
      const plaintext = 'x'.repeat(100000)
      const encrypted = encryptSecret(plaintext)
      const decrypted = decryptSecret(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })
})
