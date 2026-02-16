'use client'

/**
 * AuthContext - Centralized Auth State Management
 * 
 * Provides a single source of truth for authentication state across the app.
 * Implements auth state subscription, cleanup, and null-safe types.
 * 
 * Related PRs: #28 (Centralize auth state), #12 (Auth state post magic-link)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export type AuthState = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
}

export type AuthContextType = AuthState & {
  signInWithEmail: (email: string) => Promise<{ success: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: true,
  })

  const supabase = createClient()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('[AuthContext] Exception fetching profile:', error)
      return null
    }
  }, [supabase])

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Setting up auth state listener')
    }

    // Set up auth state listener - handles all auth events including initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Auth state changed:', event, session?.user?.id || 'no user')
        }

        // Handle session presence
        if (session?.user) {
          // Set authenticated state immediately
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthContext] User authenticated, updating state')
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
                console.log('[AuthContext] Profile loaded:', profile.handle)
              }
              setState(prev => ({ ...prev, profile }))
            }
          } catch {
            // Profile fetch may fail for new users - that's ok
            if (process.env.NODE_ENV === 'development') {
              console.log('[AuthContext] Profile fetch failed (may be new user)')
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          // No session - either signed out or initial load with no auth
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthContext] No session, setting guest state')
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

    // Cleanup subscription on unmount
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] Cleaning up auth state listener')
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
      if (profile) {
        setState(prev => ({ ...prev, profile }))
      }
    }
  }, [state.user, fetchProfile])

  const value: AuthContextType = {
    ...state,
    signInWithEmail,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 * Throws error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
