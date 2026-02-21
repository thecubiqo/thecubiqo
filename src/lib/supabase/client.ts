import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { ENV } from '@/lib/config/env'

// Singleton client instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Check if Supabase is configured with real credentials
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = ENV.supabase
  return !!(url && anonKey && !url.includes('placeholder'))
}

export function createClient() {
  if (!client) {
    const { url, anonKey } = ENV.supabase;
    
    // Only create client if we have real credentials
    if (url && anonKey && !url.includes('placeholder')) {
      client = createBrowserClient<Database>(url, anonKey)
    } else {
      // Return a mock client that won't crash but will fail gracefully
      console.warn('Supabase not properly configured - using mock client');
      client = {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithOtp: async () => ({ error: new Error('Supabase not configured') }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: new Error('Supabase not configured') })
            })
          })
        })
      } as any;
    }
  }
  return client
}