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
    // Set up auth state listener - this handles all auth events including initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth Event:', event, 'HasSession:', !!session)

        if (session?.user) {
          console.log('[useAuth] Session detected for:', session.user.email)
          // IMPORTANT: Set isAuthenticated immediately
          setState(prev => ({
            ...prev,
            user: session.user,
            isLoading: false,
            isAuthenticated: true,
            isGuest: false,
          }))

          try {
            const profile = await fetchProfile(session.user.id)
            if (profile) {
              setState(prev => ({ ...prev, profile }))
            }
          } catch (e) {
            console.error('[useAuth] Profile fetch background error:', e)
          }
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          console.log('[useAuth] No session state')
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
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Sign in with magic link
  const signInWithEmail = useCallback(async (email: string, redirectTo?: string) => {
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
    if (redirectTo) callbackUrl.searchParams.set('next', redirectTo)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    if (error) throw error
    return { success: true }
  }, [supabase])

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

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
