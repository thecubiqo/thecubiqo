import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Singleton client instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Check if Supabase configuration exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase configuration missing. Using mock client.')
    
    // Return a mock client that won't crash
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: (callback: (event: string, session: any) => void) => ({ 
          data: { subscription: { unsubscribe: () => {} } } 
        }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            single: () => Promise.resolve({ data: null, error: null })
          }),
          insert: (data: any) => ({
            select: (columns?: string) => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
            })
          })
        })
      })
    } as any
  }
  
  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return client
}
