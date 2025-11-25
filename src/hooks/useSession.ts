'use client'

/**
 * useSession Hook
 * Manages CubiQo sessions (guest and authenticated)
 * Automatically converts guest sessions when user authenticates
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, DeviceInfo } from '@/types'
import type { User } from '@supabase/supabase-js'

const SESSION_STORAGE_KEY = 'cubiqo_session_id'

export type SessionState = {
  session: Session | null
  isLoading: boolean
  isGuest: boolean
  error: string | null
}

/**
 * Get device info from browser
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') return {}

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

/**
 * Get stored session ID from localStorage
 */
function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

/**
 * Store session ID in localStorage
 */
function storeSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
}

/**
 * Clear stored session ID
 */
function clearStoredSessionId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    isGuest: true,
    error: null,
  })

  const supabase = createClient()

  // Create new guest session
  const createGuestSession = useCallback(async (): Promise<Session | null> => {
    const deviceInfo = getDeviceInfo()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        is_guest: true,
        geo_location: 'US', // Will be set by middleware in production
        device_info: deviceInfo,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating guest session:', error)
      setState(prev => ({ ...prev, error: error.message }))
      return null
    }

    // Store session ID
    storeSessionId(data.id)

    return data
  }, [supabase])

  // Fetch session by ID
  const fetchSession = useCallback(async (sessionId: string): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      // Session not found or expired
      return null
    }

    // Check if session is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    return data
  }, [supabase])

  // Track if we've already converted session for current user
  const convertedForUserRef = useRef<string | null>(null)

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for stored session
        const storedSessionId = getStoredSessionId()

        if (storedSessionId) {
          const existingSession = await fetchSession(storedSessionId)

          if (existingSession) {
            setState({
              session: existingSession,
              isLoading: false,
              isGuest: existingSession.is_guest ?? true,
              error: null,
            })
            return
          }

          // Stored session invalid, clear it
          clearStoredSessionId()
        }

        // Create new guest session
        const newSession = await createGuestSession()

        if (newSession) {
          setState({
            session: newSession,
            isLoading: false,
            isGuest: true,
            error: null,
          })
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to create session',
          }))
        }
      } catch (error) {
        console.error('Session init error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Session initialization failed',
        }))
      }
    }

    initSession()
  }, [fetchSession, createGuestSession])

  // Listen for auth changes and auto-convert guest sessions
  useEffect(() => {
    const handleAuthChange = async (user: User | null) => {
      // Skip if no session yet, not a guest, or already converted for this user
      if (!state.session || !state.isGuest || !user) return
      if (convertedForUserRef.current === user.id) return

      // Mark as converting for this user to prevent duplicate conversions
      convertedForUserRef.current = user.id

      // Convert guest session to authenticated
      const { data, error } = await supabase
        .from('sessions')
        .update({
          user_id: user.id,
          is_guest: false,
          expires_at: null,
        })
        .eq('id', state.session.id)
        .select()
        .single()

      if (!error && data) {
        setState(prev => ({
          ...prev,
          session: data,
          isGuest: false,
        }))
      }
    }

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await handleAuthChange(session.user)
        } else if (event === 'SIGNED_OUT') {
          convertedForUserRef.current = null
        }
      }
    )

    // Also check current auth state on mount (for page refreshes)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && state.session && state.isGuest) {
        handleAuthChange(user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, state.session, state.isGuest])

  // Convert guest session to authenticated
  const convertToAuthenticated = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.session) return false

    const { data, error } = await supabase
      .from('sessions')
      .update({
        user_id: userId,
        is_guest: false,
        expires_at: null,
      })
      .eq('id', state.session.id)
      .select()
      .single()

    if (error) {
      console.error('Error converting session:', error)
      return false
    }

    setState(prev => ({
      ...prev,
      session: data,
      isGuest: false,
    }))

    return true
  }, [supabase, state.session])

  // Refresh session data
  const refreshSession = useCallback(async () => {
    if (!state.session) return

    const session = await fetchSession(state.session.id)

    if (session) {
      setState(prev => ({
        ...prev,
        session,
        isGuest: session.is_guest ?? true,
      }))
    }
  }, [state.session, fetchSession])

  // Clear session (for sign out)
  const clearSession = useCallback(() => {
    clearStoredSessionId()
    setState({
      session: null,
      isLoading: false,
      isGuest: true,
      error: null,
    })
  }, [])

  return {
    ...state,
    createGuestSession,
    convertToAuthenticated,
    refreshSession,
    clearSession,
  }
}
