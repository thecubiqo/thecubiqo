'use client'

/**
 * Auth Context
 *
 * Provides reactive Supabase authentication state to all components.
 * Wraps the app root to ensure auth state changes (e.g. after magic-link
 * redirect) are reflected immediately without a full page refresh.
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  signInWithEmail: (email: string) => Promise<{ success: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: true,
  signInWithEmail: async () => ({ success: false }),
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // createClient returns a singleton, but useMemo makes the stable reference explicit
  const supabase = useMemo(() => createClient(), [])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[AuthProvider] Error fetching profile:', error)
      return null
    }

    return data
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          setIsLoading(false)

          try {
            const profileData = await fetchProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
            }
          } catch {
            // Profile fetch may fail for new users
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        } else if (event === 'INITIAL_SESSION') {
          // No session on initial load — just mark loading as complete
          setIsLoading(false)
        }
      }
    )

    return () => {
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

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    setUser(null)
    setProfile(null)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isGuest: !user,
    signInWithEmail,
    signOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
