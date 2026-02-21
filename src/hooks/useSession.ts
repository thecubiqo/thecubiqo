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



  // Handle authenticated user session via API
  const handleAuthenticatedUser = useCallback(async (user: User) => {
    const storedSessionId = getStoredSessionId()
    const deviceInfo = getDeviceInfo()

    // Try to convert guest session first
    if (storedSessionId) {
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
      setState(prev => ({ ...prev, isLoading: false, error: error.error }))
      return
    }

    const { session } = await res.json()
    storeSessionId(session.id)
    setState({
      session,
      isLoading: false,
      isGuest: false,
      error: null,
    })
  }, [])

  // Handle guest user session via API (bypasses RLS)
  const handleGuestUser = useCallback(async () => {
    const storedSessionId = getStoredSessionId()

    if (storedSessionId) {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_session', sessionId: storedSessionId })
        })

        if (res.ok) {
          const { session: existingSession } = await res.json()
          if (existingSession) {
            if (!existingSession.expires_at || new Date(existingSession.expires_at) > new Date()) {
              setState({
                session: existingSession,
                isLoading: false,
                isGuest: existingSession.is_guest ?? true,
                error: null,
              })
              return
            }
          }
        }
      } catch (err) {
        console.error('[useSession] Error fetching existing session:', err)
      }

      clearStoredSessionId()
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_guest_session',
          deviceInfo: getDeviceInfo(),
        })
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMsg = res.status === 503
          ? `Database setup required: ${error.details || error.error}`
          : (error.error || 'Failed to create guest session')
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }))
        return
      }

      const { session: newSession } = await res.json()
      storeSessionId(newSession.id)
      setState({
        session: newSession,
        isLoading: false,
        isGuest: true,
        error: null,
      })
    } catch (err) {
      console.error('[useSession] Error creating guest session:', err)
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to create guest session' }))
    }
  }, [])

  // Step 1: Get initial auth state and listen for changes
  useEffect(() => {
    // First check for existing session immediately
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setAuthUser(user)
      } catch (error) {
        console.error('[useSession] Error getting user:', error)
        setAuthUser(null)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Step 2: Once we know auth state, handle session
  useEffect(() => {
    if (authUser === undefined) return

    let isMounted = true

    const initSession = async () => {
      // Failsafe: Don't let it hang forever
      const timeout = setTimeout(() => {
        if (!isMounted) return
        setState(prev => {
          if (prev.isLoading) {
            return {
              ...prev,
              isLoading: false,
              isGuest: true, // Fallback to guest
              error: 'Session initialization timeout - defaulting to guest'
            }
          }
          return prev
        })
      }, 5000)

      try {
        if (authUser) {
          await handleAuthenticatedUser(authUser)
        } else {
          await handleGuestUser()
        }
      } catch (error) {
        if (!isMounted) return
        console.error('[useSession] Init error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Session initialization failed',
        }))
      } finally {
        clearTimeout(timeout)
      }
    }

    initSession()

    return () => {
      isMounted = false
    }
  }, [authUser, handleAuthenticatedUser, handleGuestUser])

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

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_session', sessionId: state.session.id })
      })

      if (res.ok) {
        const { session: data } = await res.json()
        if (data) {
          setState(prev => ({ ...prev, session: data, isGuest: data.is_guest ?? true }))
        }
      }
    } catch (err) {
      console.error('[useSession] Error refreshing session:', err)
    }
  }, [state.session])

  const clearSession = useCallback(() => {
    clearStoredSessionId()
    setState({ session: null, isLoading: false, isGuest: true, error: null })
  }, [])

  const createGuestSession = useCallback(async (): Promise<Session | null> => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_guest_session',
          deviceInfo: getDeviceInfo(),
        })
      })

      if (!res.ok) return null

      const { session: data } = await res.json()
      if (!data) return null

      storeSessionId(data.id)
      return data
    } catch (err) {
      console.error('[useSession] Error creating guest session:', err)
      return null
    }
  }, [])

  return {
    ...state,
    createGuestSession,
    convertToAuthenticated,
    refreshSession,
    clearSession,
  }
}
