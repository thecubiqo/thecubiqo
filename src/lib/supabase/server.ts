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

  return createServerClient<Database>(
    ENV.supabase.url,
    ENV.supabase.anonKey,
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
}
