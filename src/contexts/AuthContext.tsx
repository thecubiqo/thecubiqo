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
import { createClient } from '@/lib/supabase/client'
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
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthProvider] Setting up auth state listener')
    }

    // Set up auth state listener - this handles all auth events including initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          // No session - either signed out or initial load with no auth
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
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider] Cleaning up auth state listener')
      }
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Sign in with magic link
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
      signOut,
      refreshProfile,
    }),
    [state, signInWithEmail, signOut, refreshProfile]
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
