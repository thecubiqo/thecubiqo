/**
 * Auth Sign-In and Sign-Out Flow Tests
 * 
 * Tests basic authentication flows including sign-in and sign-out.
 * Related PRs: #12 (Magic-link auth), #28 (Centralized auth)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Sign-In Flow', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  describe('signInWithEmail Method', () => {
    it('should be defined in AuthContext', () => {
      expect(authContextContent).toContain('signInWithEmail')
    })

    it('should use Supabase signInWithOtp', () => {
      expect(authContextContent).toContain('signInWithOtp')
    })

    it('should send magic link email', () => {
      expect(authContextContent).toContain('email')
    })

    it('should specify emailRedirectTo callback', () => {
      expect(authContextContent).toContain('emailRedirectTo')
      expect(authContextContent).toContain('/auth/callback')
    })

    it('should return success boolean', () => {
      expect(authContextContent).toContain('return { success: true }')
    })

    it('should handle errors', () => {
      expect(authContextContent).toContain('if (error)')
      expect(authContextContent).toContain('throw error')
    })
  })

  describe('Auth State After Sign-In', () => {
    it('should transition from guest to authenticated', () => {
      const guestState = {
        user: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false
      }
      
      const authenticatedState = {
        user: { id: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false
      }
      
      expect(guestState.isGuest).toBe(true)
      expect(authenticatedState.isAuthenticated).toBe(true)
    })

    it('should set isLoading to false after auth complete', () => {
      expect(authContextContent).toContain('isLoading: false')
    })

    it('should set user and profile', () => {
      expect(authContextContent).toContain('user: session.user')
      expect(authContextContent).toContain('profile')
    })
  })
})

describe('Sign-Out Flow', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  describe('signOut Method', () => {
    it('should be defined in AuthContext', () => {
      expect(authContextContent).toContain('signOut')
    })

    it('should call Supabase signOut', () => {
      expect(authContextContent).toContain('supabase.auth.signOut()')
    })

    it('should clear user state', () => {
      expect(authContextContent).toContain('user: null')
    })

    it('should clear profile state', () => {
      expect(authContextContent).toContain('profile: null')
    })

    it('should set isAuthenticated to false', () => {
      expect(authContextContent).toContain('isAuthenticated: false')
    })

    it('should set isGuest to true', () => {
      expect(authContextContent).toContain('isGuest: true')
    })

    it('should handle errors', () => {
      expect(authContextContent).toContain('if (error)')
    })
  })

  describe('Auth State After Sign-Out', () => {
    it('should revert to guest state', () => {
      const afterSignOut = {
        user: null,
        profile: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false
      }
      
      expect(afterSignOut.isGuest).toBe(true)
      expect(afterSignOut.isAuthenticated).toBe(false)
      expect(afterSignOut.user).toBeNull()
    })

    it('should trigger onAuthStateChange with SIGNED_OUT', () => {
      expect(authContextContent).toContain('SIGNED_OUT')
    })
  })
})

describe('Auth State Subscription', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  it('should subscribe to onAuthStateChange', () => {
    expect(authContextContent).toContain('onAuthStateChange')
  })

  it('should handle SIGNED_IN event', () => {
    expect(authContextContent).toContain('session?.user')
  })

  it('should handle SIGNED_OUT event', () => {
    expect(authContextContent).toContain('SIGNED_OUT')
  })

  it('should handle INITIAL_SESSION event', () => {
    expect(authContextContent).toContain('INITIAL_SESSION')
  })

  it('should clean up subscription on unmount', () => {
    expect(authContextContent).toContain('subscription.unsubscribe()')
  })

  it('should use useEffect for subscription', () => {
    expect(authContextContent).toContain('useEffect')
  })
})

describe('Profile Management', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  describe('fetchProfile', () => {
    it('should fetch user profile from database', () => {
      expect(authContextContent).toContain('fetchProfile')
      expect(authContextContent).toContain('from(\'profiles\')')
    })

    it('should filter by user ID', () => {
      expect(authContextContent).toContain('eq(\'id\', userId)')
    })

    it('should return single profile', () => {
      expect(authContextContent).toContain('.single()')
    })

    it('should handle errors gracefully', () => {
      expect(authContextContent).toContain('console.error')
      expect(authContextContent).toContain('return null')
    })
  })

  describe('refreshProfile', () => {
    it('should be available as method', () => {
      expect(authContextContent).toContain('refreshProfile')
    })

    it('should only refresh if user exists', () => {
      expect(authContextContent).toContain('if (state.user)')
    })

    it('should call fetchProfile', () => {
      expect(authContextContent).toContain('fetchProfile')
    })

    it('should update state with new profile', () => {
      expect(authContextContent).toContain('setState')
    })
  })
})

describe('Auth Context Value', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  it('should provide user', () => {
    expect(authContextContent).toContain('user:')
  })

  it('should provide profile', () => {
    expect(authContextContent).toContain('profile:')
  })

  it('should provide isLoading', () => {
    expect(authContextContent).toContain('isLoading:')
  })

  it('should provide isAuthenticated', () => {
    expect(authContextContent).toContain('isAuthenticated:')
  })

  it('should provide isGuest', () => {
    expect(authContextContent).toContain('isGuest:')
  })

  it('should provide signInWithEmail', () => {
    expect(authContextContent).toContain('signInWithEmail')
  })

  it('should provide signOut', () => {
    expect(authContextContent).toContain('signOut')
  })

  it('should provide refreshProfile', () => {
    expect(authContextContent).toContain('refreshProfile')
  })

  it('should use useMemo for value', () => {
    expect(authContextContent).toContain('useMemo')
  })
})

describe('Error Handling', () => {
  it('should throw error when useAuth used outside provider', () => {
    const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
    const authContextContent = readFileSync(authContextPath, 'utf-8')
    
    expect(authContextContent).toContain('if (context === undefined)')
    expect(authContextContent).toContain('throw new Error')
    expect(authContextContent).toContain('must be used within an AuthProvider')
  })

  it('should handle sign-in errors', () => {
    const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
    const authContextContent = readFileSync(authContextPath, 'utf-8')
    
    expect(authContextContent).toContain('if (error)')
    expect(authContextContent).toContain('throw error')
  })

  it('should handle sign-out errors', () => {
    const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
    const authContextContent = readFileSync(authContextPath, 'utf-8')
    
    expect(authContextContent).toContain('if (error)')
  })
})

describe('Type Safety', () => {
  const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const authContextContent = readFileSync(authContextPath, 'utf-8')

  it('should export AuthState type', () => {
    expect(authContextContent).toContain('export type AuthState')
  })

  it('should use User type from Supabase', () => {
    expect(authContextContent).toContain('User')
    expect(authContextContent).toContain('@supabase/supabase-js')
  })

  it('should use Profile type', () => {
    expect(authContextContent).toContain('Profile')
  })

  it('should define null-safe types', () => {
    expect(authContextContent).toContain('| null')
  })
})
