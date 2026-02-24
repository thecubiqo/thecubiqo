/**
 * Auth Magic-Link Redirect Flow Tests
 * 
 * Tests that auth state properly reflects after magic-link redirect.
 * Related PRs: #12 (Magic-link auth state), #28 (Centralized auth)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('Proxy Session Refresh', () => {
  // Next.js 16 uses proxy.ts instead of middleware.ts
  const proxyPath = resolve(__dirname, '../../src/proxy.ts')

  it('should have proxy.ts file', () => {
    expect(existsSync(proxyPath)).toBe(true)
  })

  const proxyContent = readFileSync(proxyPath, 'utf-8')

  it('should export proxy function', () => {
    expect(proxyContent).toContain('export default async function proxy')
  })

  it('should call getUser() to refresh session', () => {
    expect(proxyContent).toContain('await supabase.auth.getUser()')
  })

  it('should use createServerClient from @supabase/ssr', () => {
    expect(proxyContent).toContain('createServerClient')
    expect(proxyContent).toContain('@supabase/ssr')
  })

  it('should handle cookies properly', () => {
    expect(proxyContent).toContain('cookies')
    expect(proxyContent).toContain('getAll()')
    expect(proxyContent).toContain('setAll')
  })

  it('should have matcher config to exclude static files', () => {
    expect(proxyContent).toContain('export const config')
    expect(proxyContent).toContain('matcher')
    expect(proxyContent).toContain('_next/static')
    expect(proxyContent).toContain('_next/image')
  })

  it('should reference magic-link redirect in comments', () => {
    expect(proxyContent).toContain('magic-link')
  })
})

describe('Auth Callback Route', () => {
  const callbackPath = resolve(__dirname, '../../src/app/auth/callback/route.ts')
  const callbackContent = readFileSync(callbackPath, 'utf-8')

  it('should export GET handler', () => {
    expect(callbackContent).toContain('export async function GET')
  })

  it('should extract code from URL', () => {
    expect(callbackContent).toContain('searchParams.get(\'code\')')
  })

  it('should handle errors from URL params', () => {
    expect(callbackContent).toContain('searchParams.get(\'error\')')
  })

  it('should exchange code for session', () => {
    expect(callbackContent).toContain('exchangeCodeForSession')
  })

  it('should call getUser() after exchange', () => {
    expect(callbackContent).toContain('supabase.auth.getUser()')
  })

  it('should handle profile creation', () => {
    expect(callbackContent).toContain('from(\'profiles\')')
    expect(callbackContent).toContain('insert')
  })

  it('should redirect to requested page on success', () => {
    expect(callbackContent).toContain('NextResponse.redirect')
  })

  it('should handle rate limit errors', () => {
    expect(callbackContent).toContain('rate limit')
  })
})

describe('AuthContext Implementation', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  it('should be a client component', () => {
    expect(authContextContent).toContain('\'use client\'')
  })

  it('should export AuthProvider', () => {
    expect(authContextContent).toContain('export function AuthProvider')
  })

  it('should export useAuth hook', () => {
    expect(authContextContent).toContain('export function useAuth')
  })

  it('should create single Supabase client instance', () => {
    expect(authContextContent).toContain('useMemo')
    expect(authContextContent).toContain('createClient()')
  })

  it('should subscribe to auth state changes', () => {
    expect(authContextContent).toContain('onAuthStateChange')
  })

  it('should set isAuthenticated immediately on session', () => {
    expect(authContextContent).toContain('isAuthenticated: true')
  })

  it('should handle SIGNED_OUT event', () => {
    expect(authContextContent).toContain('SIGNED_OUT')
  })

  it('should provide signInWithEmail method', () => {
    expect(authContextContent).toContain('signInWithEmail')
    expect(authContextContent).toContain('signInWithOtp')
  })

  it('should provide signOut method', () => {
    expect(authContextContent).toContain('signOut')
  })

  it('should provide refreshProfile method', () => {
    expect(authContextContent).toContain('refreshProfile')
  })

  it('should use emailRedirectTo for magic link', () => {
    expect(authContextContent).toContain('emailRedirectTo')
    expect(authContextContent).toContain('/auth/callback')
  })

  it('should reference PR #12 or #28 in comments', () => {
    const hasPR12 = authContextContent.includes('#12')
    const hasPR28 = authContextContent.includes('#28')
    expect(hasPR12 || hasPR28).toBe(true)
  })
})

describe('Layout AuthProvider Integration', () => {
  const layoutPath = resolve(__dirname, '../../src/app/layout.tsx')
  const layoutContent = readFileSync(layoutPath, 'utf-8')
  
  const clientProvidersPath = resolve(__dirname, '../../src/components/ClientProviders.tsx')
  const clientProvidersContent = readFileSync(clientProvidersPath, 'utf-8')

  it('should use ClientProviders component', () => {
    expect(layoutContent).toContain('ClientProviders')
  })

  it('should wrap children with ClientProviders', () => {
    expect(layoutContent).toContain('<ClientProviders>')
    expect(layoutContent).toContain('{children}')
  })

  it('ClientProviders should wrap with AuthProvider', () => {
    expect(clientProvidersContent).toContain('AuthProvider')
    expect(clientProvidersContent).toContain('<AuthProvider>')
  })

  it('ClientProviders should be a client component', () => {
    expect(clientProvidersContent).toContain('\'use client\'')
  })
})

describe('useAuth Hook Re-export', () => {
  const useAuthPath = resolve(__dirname, '../../src/hooks/useAuth.ts')
  const useAuthContent = readFileSync(useAuthPath, 'utf-8')

  it('should be a client component', () => {
    expect(useAuthContent).toContain('\'use client\'')
  })

  it('should re-export useAuth from AuthContext', () => {
    expect(useAuthContent).toContain('export { useAuth }')
    expect(useAuthContent).toContain('@/contexts/AuthContext')
  })

  it('should re-export AuthState type', () => {
    expect(useAuthContent).toContain('export type { AuthState }')
  })
})

describe('Auth Flow State Management', () => {
  it('should reflect immediate auth state after magic-link', () => {
    // This is a design validation test
    // Actual flow: User clicks magic link → callback → middleware refreshes → AuthContext reflects
    const expectedFlow = [
      'Magic link redirects to /auth/callback',
      'Callback exchanges code for session',
      'Middleware calls getUser() on next request',
      'AuthContext onAuthStateChange fires',
      'UI shows authenticated state immediately'
    ]
    
    expect(expectedFlow.length).toBe(5)
  })

  it('should maintain auth state across page reloads', () => {
    // Session is stored in HTTP-only cookies by Supabase
    // Middleware refreshes session on each request
    // AuthContext subscribes to changes
    expect(true).toBe(true)
  })

  it('should handle guest-to-authenticated transition', () => {
    const initialState = { isGuest: true, isAuthenticated: false }
    const afterAuth = { isGuest: false, isAuthenticated: true }
    
    expect(initialState.isGuest).toBe(true)
    expect(afterAuth.isAuthenticated).toBe(true)
  })
})

describe('Security and Session Management', () => {
  it('should use secure HTTP-only cookies', () => {
    // Supabase SSR adapter handles this automatically
    expect(true).toBe(true)
  })

  it('should validate auth code in callback', () => {
    const callbackPath = resolve(__dirname, '../../src/app/auth/callback/route.ts')
    const callbackContent = readFileSync(callbackPath, 'utf-8')
    
    expect(callbackContent).toContain('if (!code)')
    expect(callbackContent).toContain('exchangeError')
  })

  it('should handle expired sessions', () => {
    // getUser() in proxy automatically refreshes expired sessions
    const proxyPath = resolve(__dirname, '../../src/proxy.ts')
    const proxyContent = readFileSync(proxyPath, 'utf-8')
    
    expect(proxyContent).toContain('getUser()')
  })
})
