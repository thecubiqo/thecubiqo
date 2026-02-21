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
    client = createBrowserClient<Database>(ENV.supabase.url, ENV.supabase.anonKey)
  }
  return client
}
