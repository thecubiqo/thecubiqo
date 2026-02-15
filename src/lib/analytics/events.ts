/**
 * Analytics event tracking for magic-link buttons and other user actions
 */

import { createClient } from '@/lib/supabase/client'

export type EventType = 
  | 'magic_link_button_click'
  | 'auth_modal_opened'
  | 'auth_completed'

export interface EventProperties {
  provider?: 'gmail' | 'outlook'
  source?: 'auth_modal' | 'side_panel'
  [key: string]: any
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  type: EventType,
  properties?: EventProperties
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current session and user
    const { data: { session } } = await supabase.auth.getSession()
    
    // Insert event into database
    const { error } = await supabase
      .from('events')
      .insert({
        type,
        properties: properties || {},
        user_id: session?.user?.id || null,
        session_id: null, // Can be enhanced to track session if needed
      })
    
    if (error) {
      console.error('[Analytics] Failed to track event:', error)
    }
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error('[Analytics] Error tracking event:', error)
  }
}

/**
 * Track magic-link button click
 */
export async function trackMagicLinkButtonClick(
  provider: 'gmail' | 'outlook',
  source: 'auth_modal' | 'side_panel'
): Promise<void> {
  await trackEvent('magic_link_button_click', {
    provider,
    source
  })
}
