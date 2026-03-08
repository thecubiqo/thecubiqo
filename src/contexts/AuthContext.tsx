'use client'

/**
 * AuthContext - Centralized Authentication State Management
 * 
 * Related PRs: #12 (Magic-link auth state fix), #28 (Centralized auth)
 * 
 * Provides a single Supabase client instance and auth state to the entire app.
 * This ensures:
 * - Only one Supabase client instance is created
 * - Auth state is subscribed to once at the app level
 * - All components can access auth state via useAuth() hook
 * - Auth state reflects immediately after magic-link redirect
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export type AuthState = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
}

type AuthContextValue = AuthState & {
  signInWithEmail: (email: string) => Promise<{ success: boolean }>
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean }>
  signInAsDeveloper: (email: string) => Promise<{ success: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: true,
  })

  // Create a single memoized Supabase client instance for the entire app
  // Empty dependency array is intentional - we want one client for the app lifetime
  // Environment variables are set at build time and don't change during runtime
  const supabase = useMemo(() => createClient(), [])

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state using onAuthStateChange - subscribed once at provider level
  useEffect(() => {
    // When Supabase is not configured (no env vars / preview mode), immediately
    // resolve to guest state — no network calls, no 4-second timeout hang.
    if (!isSupabaseConfigured()) {
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: true,
      })
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthProvider] Setting up auth state listener')
    }

    let resolved = false

    // Safety timeout: if onAuthStateChange never fires (e.g. Supabase unreachable),
    // stop showing the loading state and fall back to guest after a short delay
    const AUTH_TIMEOUT_MS = 4000
    const timeout = setTimeout(() => {
      if (!resolved) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthProvider] Auth timeout - falling back to guest state')
        }
        setState(prev => {
          if (prev.isLoading) {
            return {
              user: null,
              profile: null,
              isLoading: false,
              isAuthenticated: false,
              isGuest: true,
            }
          }
          return prev
        })
      }
    }, AUTH_TIMEOUT_MS)

    // Set up auth state listener - this handles all auth events including initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        resolved = true

        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthProvider] Auth state changed:', event, session?.user?.id || 'no user')
        }

        // Handle any event that provides session info
        if (session?.user) {
          // IMPORTANT: Set isAuthenticated immediately, don't wait for profile
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthProvider] User authenticated, updating state')
          }
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuest: false,
          }))

          // Fetch profile in background (may fail due to RLS, that's ok)
          try {
            const profile = await fetchProfile(session.user.id)
            if (profile) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[AuthProvider] Profile loaded:', profile.handle)
              }
              setState(prev => ({ ...prev, profile }))
            }
          } catch (error) {
            // Profile fetch may fail for new users - that's ok
            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthProvider] Profile fetch failed (may be new user)')
            }
          }
        } else {
          // No session - set guest state for any event without a user
          // Handles SIGNED_OUT, INITIAL_SESSION, and any other event (e.g. TOKEN_REFRESHED)
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthProvider] No session, setting guest state')
          }
          setState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            isGuest: true,
          })
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider] Cleaning up auth state listener')
      }
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return { success: true }
  }, [supabase])

  // Sign in with password
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { success: true }
  }, [supabase])

  // Sign up with password
  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return { success: true }
  }, [supabase])

  // Sign in as developer (bypass OTP/magic link) - ONLY IN DEVELOPMENT
  const signInAsDeveloper = useCallback(async (email: string) => {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('signInAsDeveloper is only available in development mode')
    }

    console.log('[AuthProvider] Developer sign-in for:', email)

    // In dev, we can potentially use a fixed session or just mock it for UI testing
    // If they have a real user, we'd need their password, but for UI testing 
    // we can just set the state if we don't care about backend validation for now.

    // However, to actually be authenticated with Supabase, we need a session.
    // For now, let's just mock the state so they can see the UI.
    setState({
      user: { id: 'dev-user-id', email } as any,
      profile: { id: 'dev-user-id', handle: 'dev-user' } as any,
      isLoading: false,
      isAuthenticated: true,
      isGuest: false,
    })

    return { success: true }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      isGuest: true,
    })
  }, [supabase])

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id)
      // Only update state if profile was successfully fetched
      if (profile) {
        setState(prev => ({ ...prev, profile }))
      }
    }
  }, [state.user, fetchProfile])

  const value = useMemo(
    () => ({
      ...state,
      signInWithEmail,
      signInWithPassword,
      signUp,
      signInAsDeveloper,
      signOut,
      refreshProfile,
    }),
    [state, signInWithEmail, signInWithPassword, signUp, signInAsDeveloper, signOut, refreshProfile]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Re-export types for convenience
export type { AuthState as AuthContextState }
