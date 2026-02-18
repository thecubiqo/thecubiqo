/**
 * Test: Cubiqo Email and Phone Generation
 * Verifies that cubiqo_email and cubiqo_phone are auto-generated for new profiles
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Skip tests if Supabase credentials are not available
const skipTests = !supabaseUrl || !supabaseKey

describe('Cubiqo Communication Fields', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  const testUserId = '00000000-0000-0000-0000-000000000001' // Test UUID

  beforeAll(() => {
    if (skipTests) {
      console.warn('⚠️  Skipping Cubiqo communication tests - Supabase credentials not available')
      return
    }

    supabase = createClient<Database>(supabaseUrl!, supabaseKey!)
  })

  afterAll(async () => {
    if (skipTests) return

    // Clean up test profile
    try {
      await supabase.from('profiles').delete().eq('id', testUserId)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  it.skipIf(skipTests)('should auto-generate cubiqo_email when creating a profile', async () => {
    // Create a test profile without specifying cubiqo_email
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        display_name: 'TestUser',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.cubiqo_email).toBeDefined()
    expect(data?.cubiqo_email).toMatch(/@yourcubiqo\.com$/)
  })

  it.skipIf(skipTests)('should auto-generate cubiqo_phone when creating a profile', async () => {
    // Fetch the created profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.cubiqo_phone).toBeDefined()
    expect(data?.cubiqo_phone).toMatch(/^\+1-CUBIQO-\d{5}$/)
  })

  it.skipIf(skipTests)('should generate email based on display_name', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    expect(data?.cubiqo_email).toMatch(/^testuser/)
  })

  it.skipIf(skipTests)('should generate phone based on handle', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single()

    // Handle is auto-generated in format CQ#XXXXX
    // Phone should be +1-CUBIQO-XXXXX where XXXXX matches the handle number
    expect(data?.handle).toMatch(/^CQ#\d+$/)
    
    const handleNumber = data?.handle?.replace('CQ#', '')
    const phoneNumber = data?.cubiqo_phone?.replace('+1-CUBIQO-', '')
    
    // Phone number should be padded to 5 digits
    expect(phoneNumber).toBe(handleNumber?.padStart(5, '0'))
  })

  it.skipIf(skipTests)('should ensure uniqueness of cubiqo_email', async () => {
    // Try to manually set a duplicate cubiqo_email
    const secondUserId = '00000000-0000-0000-0000-000000000002'
    
    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('cubiqo_email')
      .eq('id', testUserId)
      .single()

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: secondUserId,
        email: 'test2@example.com',
        cubiqo_email: firstProfile?.cubiqo_email, // Try to use same cubiqo_email
      })

    expect(error).toBeDefined()
    expect(error?.message).toContain('duplicate')

    // Clean up
    await supabase.from('profiles').delete().eq('id', secondUserId)
  })

  it('should have correct TypeScript types for new fields', () => {
    // Type checking test - will fail at compile time if types are wrong
    type ProfileRow = Database['public']['Tables']['profiles']['Row']
    type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
    
    const profileRow: ProfileRow = {
      id: 'test',
      avatar_url: null,
      created_at: null,
      cubiqo_email: 'test@yourcubiqo.com',
      cubiqo_phone: '+1-CUBIQO-12345',
      display_name: null,
      email: null,
      handle: null,
      is_admin: null,
      phone: null,
      preferences: null,
      updated_at: null,
    }

    const profileInsert: ProfileInsert = {
      id: 'test',
      cubiqo_email: 'test@yourcubiqo.com',
      cubiqo_phone: '+1-CUBIQO-12345',
    }

    expect(profileRow.cubiqo_email).toBe('test@yourcubiqo.com')
    expect(profileInsert.cubiqo_phone).toBe('+1-CUBIQO-12345')
  })
})
