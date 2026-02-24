/**
 * Database Dependency Tests
 *
 * Validates Supabase client configuration, placeholder detection,
 * admin client setup, and env var fallback logic.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

describe('Supabase Browser Client', () => {
  const clientPath = resolve(__dirname, '../src/lib/supabase/client.ts')
  const clientContent = readFileSync(clientPath, 'utf-8')

  it('should export createClient function', () => {
    expect(clientContent).toContain('export function createClient()')
  })

  it('should export isSupabaseConfigured function', () => {
    expect(clientContent).toContain('export function isSupabaseConfigured()')
  })

  it('should implement singleton pattern for client', () => {
    expect(clientContent).toContain('if (!client)')
  })

  it('should support env var fallback via ENV config', () => {
    const envPath = resolve(__dirname, '../src/lib/config/env.ts')
    const envContent = readFileSync(envPath, 'utf-8')
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL1')
  })

  it('should support anon key fallback via ENV config', () => {
    const envPath = resolve(__dirname, '../src/lib/config/env.ts')
    const envContent = readFileSync(envPath, 'utf-8')
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY1')
  })

  it('should detect placeholder credentials via ENV config', () => {
    expect(clientContent).toContain("url.includes('placeholder')")
  })

  it('should use ENV.supabase for configuration', () => {
    expect(clientContent).toContain('ENV.supabase')
  })

  it('should detect unconfigured state in isSupabaseConfigured', () => {
    expect(clientContent).toContain("!url.includes('placeholder')")
  })

  it('should verify URL is not a placeholder', () => {
    expect(clientContent).toContain("includes('placeholder')")
  })

  it('should use @supabase/ssr createBrowserClient', () => {
    expect(clientContent).toContain("import { createBrowserClient } from '@supabase/ssr'")
  })

  it('should use Database type generic', () => {
    expect(clientContent).toContain('createBrowserClient<Database>')
  })
})

describe('Supabase Server Client', () => {
  const serverPath = resolve(__dirname, '../src/lib/supabase/server.ts')
  const serverContent = readFileSync(serverPath, 'utf-8')

  it('should export async createClient function', () => {
    expect(serverContent).toContain('export async function createClient()')
  })

  it('should export isSupabaseConfigured function', () => {
    expect(serverContent).toContain('export function isSupabaseConfigured()')
  })

  it('should use cookies from next/headers', () => {
    expect(serverContent).toContain("import { cookies } from 'next/headers'")
  })

  it('should use @supabase/ssr createServerClient', () => {
    expect(serverContent).toContain("import { createServerClient } from '@supabase/ssr'")
  })

  it('should handle cookie getAll', () => {
    expect(serverContent).toContain('getAll()')
  })

  it('should handle cookie setAll with error handling', () => {
    expect(serverContent).toContain('setAll(cookiesToSet)')
  })

  it('should gracefully handle Server Component context', () => {
    // Catches errors when called from Server Components where cookies are read-only
    expect(serverContent).toContain('} catch {')
  })

  it('should support env var fallback via ENV config', () => {
    const envPath = resolve(__dirname, '../src/lib/config/env.ts')
    const envContent = readFileSync(envPath, 'utf-8')
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL1')
  })
})

describe('Supabase Admin Client', () => {
  const adminPath = resolve(__dirname, '../src/lib/supabase/admin.ts')
  const adminContent = readFileSync(adminPath, 'utf-8')

  it('should export createAdminClient function', () => {
    expect(adminContent).toContain('export const createAdminClient')
  })

  it('should use service role key via ENV config', () => {
    expect(adminContent).toContain('serviceRoleKey')
  })

  it('should disable auto refresh for admin client', () => {
    expect(adminContent).toContain('autoRefreshToken: false')
  })

  it('should disable session persistence for admin client', () => {
    expect(adminContent).toContain('persistSession: false')
  })

  it('should support legacy env var suffixes via ENV config', () => {
    const envPath = resolve(__dirname, '../src/lib/config/env.ts')
    const envContent = readFileSync(envPath, 'utf-8')
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL1')
    expect(envContent).toContain('SUPABASE_SERVICE_ROLE_KEY1')
  })
})

describe('Supabase Middleware', () => {
  const middlewarePath = resolve(__dirname, '../src/lib/supabase/middleware.ts')

  it('should have middleware configuration file', () => {
    expect(existsSync(middlewarePath)).toBe(true)
  })

  if (existsSync(resolve(__dirname, '../src/lib/supabase/middleware.ts'))) {
    const middlewareContent = readFileSync(
      resolve(__dirname, '../src/lib/supabase/middleware.ts'),
      'utf-8'
    )

    it('should handle Supabase auth in middleware', () => {
      expect(middlewareContent).toContain('supabase')
    })
  }
})

describe('Database Types', () => {
  const typesPath = resolve(__dirname, '../src/types/database.types.ts')

  it('should have database types file', () => {
    expect(existsSync(typesPath)).toBe(true)
  })
})

describe('Database Migrations', () => {
  const migrationsDir = resolve(__dirname, '../supabase/migrations')

  it('should have migrations directory', () => {
    expect(existsSync(migrationsDir)).toBe(true)
  })
})
