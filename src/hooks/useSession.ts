'use client'

/**
 * useSession Hook
 * Manages CubiQo sessions with AUTH-FIRST approach
 *
 * Logic:
 * 1. Check auth status FIRST
 * 2. If authenticated: find/create session by user_id
 * 3. If not authenticated: use localStorage for guest sessions
 * 4. Auto-convert guest sessions on sign in
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
  const initCalledRef = useRef(false)

  // Ensure profile exists for authenticated user
  const ensureProfile = useCallback(async (userId: string, email?: string): Promise<boolean> => {
    console.log('[useSession] Ensuring profile exists for user:', userId)

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (existingProfile) {
      console.log('[useSession] Profile already exists')
      return true
    }

    // Create profile
    console.log('[useSession] Creating profile...')
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
      })

    if (error) {
      console.error('[useSession] Error creating profile:', error)
      return false
    }

    console.log('[useSession] Profile created successfully')
    return true
  }, [supabase])

  // Create session for authenticated user
  const createAuthenticatedSession = useCallback(async (userId: string, email?: string): Promise<Session | null> => {
    console.log('[useSession] Creating authenticated session for user:', userId)

    // Ensure profile exists first (FK constraint)
    const profileOk = await ensureProfile(userId, email)
    if (!profileOk) {
      console.error('[useSession] Cannot create session without profile')
      return null
    }

    const deviceInfo = getDeviceInfo()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        is_guest: false,
        geo_location: 'US',
        device_info: deviceInfo,
        expires_at: null, // Authenticated sessions don't expire
      })
      .select()
      .single()

    if (error) {
      console.error('[useSession] Error creating authenticated session:', error)
      return null
    }

    storeSessionId(data.id)
    console.log('[useSession] Created authenticated session:', data.id)
    return data
  }, [supabase, ensureProfile])

  // Create guest session
  const createGuestSession = useCallback(async (): Promise<Session | null> => {
    console.log('[useSession] Creating guest session')
    const deviceInfo = getDeviceInfo()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        is_guest: true,
        geo_location: 'US',
        device_info: deviceInfo,
      })
      .select()
      .single()

    if (error) {
      console.error('[useSession] Error creating guest session:', error)
      return null
    }

    storeSessionId(data.id)
    console.log('[useSession] Created guest session:', data.id)
    return data
  }, [supabase])

  // Find existing session for authenticated user
  const findUserSession = useCallback(async (userId: string): Promise<Session | null> => {
    console.log('[useSession] Looking for existing session for user:', userId)

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[useSession] Error finding user session:', error)
      return null
    }

    if (data) {
      console.log('[useSession] Found existing session:', data.id)
      storeSessionId(data.id)
    }

    return data
  }, [supabase])

  // Fetch session by ID (for guests)
  const fetchSession = useCallback(async (sessionId: string): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      return null
    }

    // Check if session is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    return data
  }, [supabase])

  // Convert guest session to authenticated
  const convertSession = useCallback(async (sessionId: string, userId: string): Promise<Session | null> => {
    console.log('[useSession] Converting session to authenticated:', sessionId)

    const { data, error } = await supabase
      .from('sessions')
      .update({
        user_id: userId,
        is_guest: false,
        expires_at: null,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('[useSession] Error converting session:', error)
      return null
    }

    console.log('[useSession] Session converted successfully')
    return data
  }, [supabase])

  // AUTH-FIRST initialization
  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true

    const initSession = async () => {
      console.log('[useSession] Starting AUTH-FIRST initialization...')

      try {
        // STEP 1: Check auth status FIRST
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.log('[useSession] Auth check error (probably not authenticated):', authError.message)
        }

        // STEP 2A: User is AUTHENTICATED
        if (user) {
          console.log('[useSession] User is authenticated:', user.id, user.email)

          // Ensure profile exists first
          await ensureProfile(user.id, user.email ?? undefined)

          // Try to find existing session for this user
          let session = await findUserSession(user.id)

          // Check if we have a guest session in localStorage that needs conversion
          if (!session) {
            const storedSessionId = getStoredSessionId()
            if (storedSessionId) {
              const guestSession = await fetchSession(storedSessionId)
              if (guestSession && guestSession.is_guest) {
                // Convert the guest session
                session = await convertSession(storedSessionId, user.id)
              }
            }
          }

          // If still no session, create new authenticated session
          if (!session) {
            session = await createAuthenticatedSession(user.id, user.email ?? undefined)
          }

          if (session) {
            setState({
              session,
              isLoading: false,
              isGuest: false,
              error: null,
            })
            return
          }
        }

        // STEP 2B: User is NOT authenticated - handle as guest
        console.log('[useSession] User is not authenticated, handling as guest')

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

          // Invalid stored session, clear it
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
        console.error('[useSession] Init error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Session initialization failed',
        }))
      }
    }

    initSession()
  }, [supabase, findUserSession, fetchSession, createAuthenticatedSession, createGuestSession, convertSession, ensureProfile])

  // Listen for auth changes AFTER initialization
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, authSession) => {
        console.log('[useSession] Auth state change:', event)

        if (event === 'SIGNED_IN' && authSession?.user) {
          const { id: userId, email } = authSession.user

          // Ensure profile exists
          await ensureProfile(userId, email ?? undefined)

          // User just signed in - convert guest session if we have one
          if (state.session && state.isGuest) {
            const converted = await convertSession(state.session.id, userId)
            if (converted) {
              setState(prev => ({
                ...prev,
                session: converted,
                isGuest: false,
              }))
            }
          } else if (!state.session) {
            // No session yet, find or create
            let session = await findUserSession(userId)
            if (!session) {
              session = await createAuthenticatedSession(userId, email ?? undefined)
            }
            if (session) {
              setState({
                session,
                isLoading: false,
                isGuest: false,
                error: null,
              })
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out - create new guest session
          clearStoredSessionId()
          const newSession = await createGuestSession()
          setState({
            session: newSession,
            isLoading: false,
            isGuest: true,
            error: null,
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, state.session, state.isGuest, convertSession, findUserSession, createAuthenticatedSession, createGuestSession, ensureProfile])

  // Convert guest session to authenticated (manual call)
  const convertToAuthenticated = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.session) return false

    const converted = await convertSession(state.session.id, userId)

    if (converted) {
      setState(prev => ({
        ...prev,
        session: converted,
        isGuest: false,
      }))
      return true
    }

    return false
  }, [state.session, convertSession])

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
