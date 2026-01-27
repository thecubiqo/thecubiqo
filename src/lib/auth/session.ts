/**
 * Session Management
 * Handles guest sessions and authenticated user sessions
 */

import { createClient } from '@/lib/supabase/server'
import type { Session, SessionInsert, DeviceInfo, GeoLocation } from '@/types'

const GUEST_SESSION_COOKIE = 'cubiqo_guest_session'

/**
 * Get or create a guest session
 * Called on first visit to establish session tracking
 */
export async function getOrCreateGuestSession(
  deviceInfo?: DeviceInfo,
  geoLocation?: GeoLocation
): Promise<Session | null> {
  const supabase = await createClient()

  // Try to get existing session from cookie/storage
  // For now, always create new session - will add cookie logic later

  const sessionData: SessionInsert = {
    is_guest: true,
    geo_location: geoLocation || 'US',
    device_info: deviceInfo || {},
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) {
    console.error('Error creating guest session:', error)
    return null
  }

  return data
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching session:', error)
    return null
  }

  return data
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(session: Session): boolean {
  if (!session.expires_at) return true // Authenticated sessions don't expire

  const expiresAt = new Date(session.expires_at)
  return expiresAt > new Date()
}

/**
 * Convert guest session to authenticated session
 * Called after successful auth
 */
export async function convertGuestToAuthenticated(
  sessionId: string,
  userId: string
): Promise<Session | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .update({
      user_id: userId,
      is_guest: false,
      expires_at: null, // Authenticated sessions don't expire
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error converting session:', error)
    return null
  }

  return data
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user sessions:', error)
    return []
  }

  return data || []
}

/**
 * Update session activity (last seen)
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const supabase = await createClient()

  // Note: We don't have last_activity column yet
  // For now, just verify session exists
  await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .single()
}

/**
 * Delete expired sessions (cleanup)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .eq('is_guest', true)
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('Error cleaning up sessions:', error)
    return 0
  }

  return data?.length || 0
}
