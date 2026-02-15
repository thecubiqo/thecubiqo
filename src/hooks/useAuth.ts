'use client'

/**
 * useAuth Hook
 * Client-side authentication state management
 */

import { useEffect, useState, useCallback } from 'react'
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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: true,
  })

  const supabase = createClient()

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
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
  }, [supabase])

  // Initialize auth state using onAuthStateChange only
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useAuth] Setting up auth state listener')
    }
    
    // First, check for existing session immediately (critical for magic-link redirects)
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setState(prev => ({
          ...prev,
          user: session.user,
          isLoading: false,
          isAuthenticated: true,
          isGuest: false,
        }))

        // Fetch profile in background
        try {
          const profile = await fetchProfile(session.user.id)
          if (profile) {
            setState(prev => ({ ...prev, profile }))
          }
        } catch {
          // Profile fetch may fail for new users - that's ok
        }
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          isGuest: true,
        }))
      }
    }

    initializeSession()
    
    // Set up auth state listener - this handles all auth events including initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useAuth] Auth state changed:', event, session?.user?.id || 'no user')
        }
        // Handle any event that provides session info
        if (session?.user) {
          // IMPORTANT: Set isAuthenticated immediately, don't wait for profile
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAuth] User authenticated, updating state')
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
                console.log('[useAuth] Profile loaded:', profile.handle)
              }
              setState(prev => ({ ...prev, profile }))
            }
          } catch {
            // Profile fetch may fail for new users - that's ok
            if (process.env.NODE_ENV === 'development') {
              console.log('[useAuth] Profile fetch failed (may be new user)')
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          // No session - either signed out or initial load with no auth
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAuth] No session, setting guest state')
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
        console.log('[useAuth] Cleaning up auth state listener')
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
      setState(prev => ({ ...prev, profile }))
    }
  }, [state.user, fetchProfile])

  return {
    ...state,
    signInWithEmail,
    signOut,
    refreshProfile,
  }
}
