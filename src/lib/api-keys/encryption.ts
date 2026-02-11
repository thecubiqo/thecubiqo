/**
 * API Key Encryption
 * Uses Web Crypto API for client-side encryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

/**
 * Derive encryption key from user password + device fingerprint
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('cubiqo-api-keys-v1'), // Static salt for deterministic key
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Get device fingerprint for encryption key
 */
function getDeviceFingerprint(): string {
  // Simple fingerprint based on available browser data
  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
  ].join('|')
  
  // Simple hash
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

/**
 * Get or create master password
 * In production, this should be user-provided
 * For now, using device fingerprint as automatic encryption
 */
async function getMasterPassword(): Promise<string> {
  let password = localStorage.getItem('cubiqo_key_password')
  
  if (!password) {
    // Generate from device fingerprint
    password = `cubiqo_${getDeviceFingerprint()}_${Date.now()}`
    localStorage.setItem('cubiqo_key_password', password)
  }
  
  return password
}

/**
 * Encrypt data
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const password = await getMasterPassword()
    const key = await deriveKey(password)
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    )

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Convert to base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data
 */
export async function decryptData(ciphertext: string): Promise<string> {
  try {
    const password = await getMasterPassword()
    const key = await deriveKey(password)

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    // Split IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    )

    // Convert to string
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Test encryption/decryption
 */
export async function testEncryption(): Promise<boolean> {
  try {
    const testData = 'test-api-key-12345'
    const encrypted = await encryptData(testData)
    const decrypted = await decryptData(encrypted)
    return decrypted === testData
  } catch {
    return false
  }
}
