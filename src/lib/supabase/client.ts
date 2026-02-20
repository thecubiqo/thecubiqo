import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Singleton client instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Check if Supabase is configured with real credentials
 * Returns false when running in preview mode with placeholder values
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return !!(
    url &&
    key &&
    url !== 'https://placeholder.supabase.co' &&
    key !== 'placeholder-anon-key' &&
    url.includes('supabase.co')
  )
}

export function createClient() {
  if (!client) {
    // Support both old and new env var names with fallback
    // Note: The "1" suffix is per legacy naming convention for backward compatibility
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return client
}

