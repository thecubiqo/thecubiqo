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

// Chainable mock that returns itself for any method call
function createMockQueryBuilder(): Record<string, (...args: unknown[]) => unknown> {
  const mockError = new Error('Supabase not configured')
  const builder: Record<string, (...args: unknown[]) => unknown> = {}
  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'not',
    'or', 'and', 'filter', 'match', 'contains', 'containedBy', 'overlaps',
    'order', 'limit', 'range', 'textSearch',
  ]
  for (const method of chainMethods) {
    builder[method] = () => builder
  }
  builder.single = async () => ({ data: null, error: mockError })
  builder.maybeSingle = async () => ({ data: null, error: null })
  builder.then = (...args: unknown[]) =>
    Promise.resolve({ data: null, error: mockError }).then(args[0] as (value: unknown) => unknown)
  return builder
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
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
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
      from: () => createMockQueryBuilder(),
    } as unknown as ReturnType<typeof createServerClient<Database>>;
  }
}