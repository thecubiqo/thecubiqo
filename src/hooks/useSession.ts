'use client'

/**
 * useSession Hook
 * Manages CubiQo sessions with AUTH-FIRST approach
 * Uses RPC functions to bypass RLS issues
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

  // Handle authenticated user session using RPC
  const handleAuthenticatedUser = async (user: User) => {
    console.log('[useSession] Handling authenticated user:', user.id)

    // Check if we have a guest session to convert first
    const storedSessionId = getStoredSessionId()

    if (storedSessionId) {
      // Try to convert existing guest session
      console.log('[useSession] Trying to convert guest session:', storedSessionId)

      const { data: convertedId, error: convertError } = await supabase
        .rpc('convert_guest_session', {
          p_session_id: storedSessionId,
          p_user_id: user.id,
          p_email: user.email
        })

      if (convertedId && !convertError) {
        console.log('[useSession] Converted guest session:', convertedId)
        // Fetch the full session data
        const { data: session } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', convertedId)
          .single()

        if (session) {
          setState({
            session,
            isLoading: false,
            isGuest: false,
            error: null,
          })
          return
        }
      } else {
        console.log('[useSession] Convert failed or no guest session:', convertError?.message)
      }
    }

    // Use RPC to ensure profile and get/create session
    console.log('[useSession] Calling ensure_profile_and_session RPC...')

    const { data, error } = await supabase
      .rpc('ensure_profile_and_session', {
        p_user_id: user.id,
        p_email: user.email,
        p_device_info: getDeviceInfo(),
        p_geo_location: 'US'
      })

    if (error) {
      console.error('[useSession] RPC error:', error)
      setState(prev => ({ ...prev, isLoading: false, error: error.message }))
      return
    }

    const result = data?.[0]
    if (!result?.session_id) {
      console.error('[useSession] No session_id in RPC result')
      setState(prev => ({ ...prev, isLoading: false, error: 'Failed to create session' }))
      return
    }

    console.log('[useSession] RPC result:', result)
    storeSessionId(result.session_id)

    // Fetch full session data
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', result.session_id)
      .single()

    if (session) {
      setState({
        session,
        isLoading: false,
        isGuest: false,
        error: null,
      })
    }
  }

  // Handle guest user session (no auth, so direct table access works)
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
