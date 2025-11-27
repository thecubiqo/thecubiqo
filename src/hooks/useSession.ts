'use client'

/**
 * useSession Hook
 * Manages CubiQo sessions with AUTH-FIRST approach
 * Uses server API for authenticated users (bypasses RLS)
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

  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const supabase = createClient()

  // Step 1: Get initial auth state and listen for changes
  useEffect(() => {
    console.log('[useSession] Setting up auth listener...')

    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('[useSession] Initial auth user:', user?.id ?? 'none')
      setAuthUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useSession] Auth state change:', event)
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Step 2: Once we know auth state, handle session
  useEffect(() => {
    if (authUser === undefined) {
      console.log('[useSession] Waiting for auth state...')
      return
    }

    const initSession = async () => {
      console.log('[useSession] Init session, authUser:', authUser?.id ?? 'guest')

      try {
        if (authUser) {
          await handleAuthenticatedUser(authUser)
        } else {
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
  }, [authUser])

  // Handle authenticated user session via API
  const handleAuthenticatedUser = async (user: User) => {
    console.log('[useSession] Handling authenticated user via API:', user.id)

    const storedSessionId = getStoredSessionId()
    const deviceInfo = getDeviceInfo()

    // Try to convert guest session first
    if (storedSessionId) {
      console.log('[useSession] Trying to convert guest session:', storedSessionId)

      const convertRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_guest_session',
          userId: user.id,
          email: user.email,
          sessionId: storedSessionId,
          deviceInfo
        })
      })

      if (convertRes.ok) {
        const { session } = await convertRes.json()
        if (session) {
          console.log('[useSession] Session ready:', session.id)
          storeSessionId(session.id)
          setState({
            session,
            isLoading: false,
            isGuest: false,
            error: null,
          })
          return
        }
      }
    }

    // Ensure authenticated session via API
    console.log('[useSession] Creating/finding authenticated session...')

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ensure_authenticated_session',
        userId: user.id,
        email: user.email,
        deviceInfo
      })
    })

    if (!res.ok) {
      const error = await res.json()
      console.error('[useSession] API error:', error)
      setState(prev => ({ ...prev, isLoading: false, error: error.error }))
      return
    }

    const { session } = await res.json()
    console.log('[useSession] Session ready:', session.id)
    storeSessionId(session.id)
    setState({
      session,
      isLoading: false,
      isGuest: false,
      error: null,
    })
  }

  // Handle guest user session (direct Supabase - RLS allows anonymous)
  const handleGuestUser = async () => {
    console.log('[useSession] Handling guest user')

    const storedSessionId = getStoredSessionId()

    if (storedSessionId) {
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', storedSessionId)
        .maybeSingle()

      if (existingSession) {
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

      clearStoredSessionId()
    }

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

  const convertToAuthenticated = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.session) return false

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'convert_guest_session',
        userId,
        sessionId: state.session.id,
        deviceInfo: getDeviceInfo()
      })
    })

    if (!res.ok) return false

    const { session } = await res.json()
    if (!session) return false

    setState(prev => ({ ...prev, session, isGuest: false }))
    return true
  }, [state.session])

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

  const clearSession = useCallback(() => {
    clearStoredSessionId()
    setState({ session: null, isLoading: false, isGuest: true, error: null })
  }, [])

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
