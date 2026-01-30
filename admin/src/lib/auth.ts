/**
 * Simple authentication system
 */

export const ADMIN_EMAIL = 'admin@cubiqo.ai'
export const ADMIN_PASSWORD = 'abc123'

export interface AuthSession {
  email: string
  authenticated: boolean
}

/**
 * Verify login credentials
 */
export function verifyCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

/**
 * Create session token (simple implementation)
 */
export function createSessionToken(email: string): string {
  // In production, use proper JWT or session management
  const timestamp = Date.now()
  return Buffer.from(`${email}:${timestamp}`).toString('base64')
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): AuthSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [email] = decoded.split(':')
    if (email === ADMIN_EMAIL) {
      return { email, authenticated: true }
    }
  } catch {
    // Invalid token
  }
  return null
}

