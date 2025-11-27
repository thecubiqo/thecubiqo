'use client'

/**
 * useSession Hook
 * Manages CubiQo sessions with AUTH-FIRST approach
 *
 * Simplified flow:
 * 1. Wait for auth to be ready
 * 2. Then handle session based on auth state
 */

import { useEffect, useState, useCallback } from 'react'
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

function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

function storeSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
}

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

  // Track auth user separately
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined) // undefined = loading

  const supabase = createClient()

  // Step 1: Get initial auth state and listen for changes
  useEffect(() => {
    console.log('[useSession] Setting up auth listener...')

    // Get initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('[useSession] Initial auth user:', user?.id ?? 'none')
      setAuthUser(user)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useSession] Auth state change:', event)
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Step 2: Once we know auth state, handle session
  useEffect(() => {
    // Still loading auth state
    if (authUser === undefined) {
      console.log('[useSession] Waiting for auth state...')
      return
    }

    const initSession = async () => {
      console.log('[useSession] Init session, authUser:', authUser?.id ?? 'guest')

      try {
        if (authUser) {
          // USER IS AUTHENTICATED
          await handleAuthenticatedUser(authUser)
        } else {
          // USER IS GUEST
          await handleGuestUser()
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
  }, [authUser]) // Re-run when auth state changes

  // Handle authenticated user session
  const handleAuthenticatedUser = async (user: User) => {
    console.log('[useSession] Handling authenticated user:', user.id)

    // 1. Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!existingProfile) {
      console.log('[useSession] Creating profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })

      if (profileError) {
        console.error('[useSession] Profile creation error:', profileError)
        // Continue anyway - might already exist
      }
    }

    // 2. Look for existing session for this user
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSession) {
      console.log('[useSession] Found existing session:', existingSession.id)
      storeSessionId(existingSession.id)
      setState({
        session: existingSession,
        isLoading: false,
        isGuest: false,
        error: null,
      })
      return
    }

    // 3. Check if we have a guest session to convert
    const storedSessionId = getStoredSessionId()
    if (storedSessionId) {
      const { data: guestSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', storedSessionId)
        .eq('is_guest', true)
        .maybeSingle()

      if (guestSession) {
        console.log('[useSession] Converting guest session:', storedSessionId)
        const { data: converted, error: convertError } = await supabase
          .from('sessions')
          .update({ user_id: user.id, is_guest: false, expires_at: null })
          .eq('id', storedSessionId)
          .select()
          .single()

        if (converted && !convertError) {
          setState({
            session: converted,
            isLoading: false,
            isGuest: false,
            error: null,
          })
          return
        }
      }
    }

    // 4. Create new authenticated session
    console.log('[useSession] Creating new authenticated session...')
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        is_guest: false,
        geo_location: 'US',
        device_info: getDeviceInfo(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[useSession] Session creation error:', sessionError)
      setState(prev => ({ ...prev, isLoading: false, error: sessionError.message }))
      return
    }

    console.log('[useSession] Created session:', newSession.id)
    storeSessionId(newSession.id)
    setState({
      session: newSession,
      isLoading: false,
      isGuest: false,
      error: null,
    })
  }

  // Handle guest user session
  const handleGuestUser = async () => {
    console.log('[useSession] Handling guest user')

    // Check for existing session in localStorage
    const storedSessionId = getStoredSessionId()

    if (storedSessionId) {
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', storedSessionId)
        .maybeSingle()

      if (existingSession) {
        // Check expiry
        if (!existingSession.expires_at || new Date(existingSession.expires_at) > new Date()) {
          console.log('[useSession] Using existing guest session:', existingSession.id)
          setState({
            session: existingSession,
            isLoading: false,
            isGuest: existingSession.is_guest ?? true,
            error: null,
          })
          return
        }
      }

      // Invalid/expired session
      clearStoredSessionId()
    }

    // Create new guest session
    console.log('[useSession] Creating new guest session...')
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        is_guest: true,
        geo_location: 'US',
        device_info: getDeviceInfo(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error('[useSession] Guest session creation error:', sessionError)
      setState(prev => ({ ...prev, isLoading: false, error: sessionError.message }))
      return
    }

    console.log('[useSession] Created guest session:', newSession.id)
    storeSessionId(newSession.id)
    setState({
      session: newSession,
      isLoading: false,
      isGuest: true,
      error: null,
    })
  }

  // Manual session conversion
  const convertToAuthenticated = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.session) return false

    const { data, error } = await supabase
      .from('sessions')
      .update({ user_id: userId, is_guest: false, expires_at: null })
      .eq('id', state.session.id)
      .select()
      .single()

    if (error || !data) return false

    setState(prev => ({ ...prev, session: data, isGuest: false }))
    return true
  }, [supabase, state.session])

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (!state.session) return

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', state.session.id)
      .single()

    if (data) {
      setState(prev => ({ ...prev, session: data, isGuest: data.is_guest ?? true }))
    }
  }, [supabase, state.session])

  // Clear session
  const clearSession = useCallback(() => {
    clearStoredSessionId()
    setState({ session: null, isLoading: false, isGuest: true, error: null })
  }, [])

  // Create guest session (exposed for external use)
  const createGuestSession = useCallback(async (): Promise<Session | null> => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        is_guest: true,
        geo_location: 'US',
        device_info: getDeviceInfo(),
      })
      .select()
      .single()

    if (error || !data) return null

    storeSessionId(data.id)
    return data
  }, [supabase])

  return {
    ...state,
    createGuestSession,
    convertToAuthenticated,
    refreshSession,
    clearSession,
  }
}
