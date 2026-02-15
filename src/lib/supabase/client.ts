import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Create client without singleton to ensure fresh session data
// This fixes the issue where the client doesn't sync with server-set cookies
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
