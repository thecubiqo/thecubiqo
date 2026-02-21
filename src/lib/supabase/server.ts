import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { ENV } from '@/lib/config/env'

/**
 * Check if Supabase is configured with real credentials
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = ENV.supabase
  return !!(url && anonKey && !url.includes('placeholder'))
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = ENV.supabase;

  // Only create client if we have real credentials
  if (url && anonKey && !url.includes('placeholder')) {
    return createServerClient<Database>(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Called from Server Component - ignore
            }
          },
        },
      }
    )
  } else {
    // Return a mock client that won't crash but will fail gracefully
    console.warn('Supabase not properly configured - using mock server client');
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithOtp: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null })
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