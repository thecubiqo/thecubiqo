/**
 * AuthContext Tests
 * 
 * Validates centralized auth state management.
 * Related PRs: #28 (Centralize auth state), #12 (Auth state post magic-link)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('AuthContext Integration', () => {
  const authContextPath = resolve(__dirname, '../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  it('should export AuthProvider component', () => {
    expect(authContextContent).toContain('export function AuthProvider')
  })

  it('should export useAuth hook', () => {
    expect(authContextContent).toContain('export function useAuth')
  })

  it('should create auth context', () => {
    expect(authContextContent).toContain('createContext')
  })

  it('should subscribe to auth state changes', () => {
    expect(authContextContent).toContain('onAuthStateChange')
  })

  it('should clean up subscriptions', () => {
    expect(authContextContent).toContain('subscription.unsubscribe()')
  })

  it('should provide signInWithEmail method', () => {
    expect(authContextContent).toContain('signInWithEmail')
  })

  it('should provide signOut method', () => {
    expect(authContextContent).toContain('signOut')
  })

  it('should provide refreshProfile method', () => {
    expect(authContextContent).toContain('refreshProfile')
  })

  it('should handle null-safe types', () => {
    expect(authContextContent).toContain('User | null')
    expect(authContextContent).toContain('Profile | null')
  })

  it('should throw error when used outside provider', () => {
    expect(authContextContent).toContain('must be used within an AuthProvider')
  })
})

describe('Layout AuthProvider Integration', () => {
  const layoutPath = resolve(__dirname, '../src/app/layout.tsx')
  const layoutContent = readFileSync(layoutPath, 'utf-8')
  
  const clientProvidersPath = resolve(__dirname, '../src/components/ClientProviders.tsx')
  const clientProvidersContent = readFileSync(clientProvidersPath, 'utf-8')

  it('should use ClientProviders component in layout', () => {
    expect(layoutContent).toContain('ClientProviders')
  })

  it('should wrap children with ClientProviders', () => {
    expect(layoutContent).toContain('<ClientProviders>')
    expect(layoutContent).toContain('</ClientProviders>')
  })

  it('should import AuthProvider in ClientProviders', () => {
    expect(clientProvidersContent).toContain('from \'@/contexts/AuthContext\'')
  })

  it('should wrap with AuthProvider in ClientProviders', () => {
    expect(clientProvidersContent).toContain('<AuthProvider>')
    expect(clientProvidersContent).toContain('</AuthProvider>')
  })
})

describe('useAuth Hook Re-export', () => {
  const useAuthPath = resolve(__dirname, '../src/hooks/useAuth.ts')
  const useAuthContent = readFileSync(useAuthPath, 'utf-8')

  it('should re-export useAuth from context', () => {
    expect(useAuthContent).toContain("from '@/contexts/AuthContext'")
  })

  it('should export AuthState type', () => {
    expect(useAuthContent).toContain('AuthState')
  })
})
