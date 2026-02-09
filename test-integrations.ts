#!/usr/bin/env tsx
/**
 * Integration Toggles Test Suite
 * Tests the complete integration system
 */

import { createClient } from '@supabase/supabase-js'
import { isToolEnabled, isServiceEnabled, getEnabledServices } from './src/lib/integrations/tool-filter'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testIntegrationToggles() {
  console.log('🧪 Testing Integration Toggles System\n')
  
  try {
    // Create a test user
    console.log('1. Creating test user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'testpass123',
    })
    
    if (authError) throw authError
    const userId = authData.user!.id
    console.log('✓ Test user created:', userId, '\n')

    // Test 1: Create integration with toggles off
    console.log('2. Creating Gmail integration (disconnected)...')
    const { error: insert1Error } = await supabase
      .from('user_integrations')
      .insert({
        user_id: userId,
        service: 'gmail',
        is_connected: false,
        read_enabled: false,
        write_enabled: false
      })
    
    if (insert1Error) throw insert1Error
    console.log('✓ Integration created\n')

    // Test 2: Verify tool is disabled
    console.log('3. Testing tool filter (should be disabled)...')
    const enabled1 = await isToolEnabled(userId, 'gmail_send')
    console.log('gmail_send enabled:', enabled1)
    if (enabled1) throw new Error('Tool should be disabled!')
    console.log('✓ Tool correctly disabled\n')

    // Test 3: Connect and enable read
    console.log('4. Connecting Gmail with read access...')
    const { error: update1Error } = await supabase
      .from('user_integrations')
      .update({
        is_connected: true,
        read_enabled: true,
        write_enabled: false
      })
      .eq('user_id', userId)
      .eq('service', 'gmail')
    
    if (update1Error) throw update1Error
    console.log('✓ Integration connected\n')

    // Test 4: Verify read tool enabled, write disabled
    console.log('5. Testing tool permissions...')
    const readEnabled = await isToolEnabled(userId, 'gmail_read')
    const writeEnabled = await isToolEnabled(userId, 'gmail_send')
    console.log('gmail_read enabled:', readEnabled)
    console.log('gmail_send enabled:', writeEnabled)
    
    if (!readEnabled) throw new Error('Read tool should be enabled!')
    if (writeEnabled) throw new Error('Write tool should be disabled!')
    console.log('✓ Read/Write permissions working correctly\n')

    // Test 5: Enable write access
    console.log('6. Enabling write access...')
    const { error: update2Error } = await supabase
      .from('user_integrations')
      .update({ write_enabled: true })
      .eq('user_id', userId)
      .eq('service', 'gmail')
    
    if (update2Error) throw update2Error
    
    const writeEnabled2 = await isToolEnabled(userId, 'gmail_send')
    console.log('gmail_send enabled:', writeEnabled2)
    if (!writeEnabled2) throw new Error('Write tool should be enabled!')
    console.log('✓ Write access enabled\n')

    // Test 6: Add multiple services
    console.log('7. Adding multiple services...')
    const services = ['calendar', 'slack', 'notion', 'github']
    for (const service of services) {
      const { error } = await supabase
        .from('user_integrations')
        .insert({
          user_id: userId,
          service,
          is_connected: true,
          read_enabled: true,
          write_enabled: service === 'calendar' // Only calendar has write
        })
      if (error) throw error
    }
    console.log('✓ Multiple services added\n')

    // Test 7: Get enabled services
    console.log('8. Getting enabled services...')
    const readServices = await getEnabledServices(userId, 'read')
    const writeServices = await getEnabledServices(userId, 'write')
    
    console.log('Read-enabled services:', readServices)
    console.log('Write-enabled services:', writeServices)
    
    if (readServices.length !== 5) throw new Error('Should have 5 read-enabled services!')
    if (writeServices.length !== 2) throw new Error('Should have 2 write-enabled services!')
    console.log('✓ Service listing working\n')

    // Test 8: Test service check
    console.log('9. Testing service checks...')
    const calendarRead = await isServiceEnabled(userId, 'calendar', 'read')
    const calendarWrite = await isServiceEnabled(userId, 'calendar', 'write')
    const slackWrite = await isServiceEnabled(userId, 'slack', 'write')
    
    console.log('calendar read:', calendarRead)
    console.log('calendar write:', calendarWrite)
    console.log('slack write:', slackWrite)
    
    if (!calendarRead) throw new Error('Calendar read should be enabled!')
    if (!calendarWrite) throw new Error('Calendar write should be enabled!')
    if (slackWrite) throw new Error('Slack write should be disabled!')
    console.log('✓ Service checks working\n')

    // Test 9: Disconnect service
    console.log('10. Disconnecting Gmail...')
    const { error: disconnectError } = await supabase
      .from('user_integrations')
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null
      })
      .eq('user_id', userId)
      .eq('service', 'gmail')
    
    if (disconnectError) throw disconnectError
    
    const gmailEnabled = await isServiceEnabled(userId, 'gmail', 'read')
    console.log('gmail read enabled after disconnect:', gmailEnabled)
    if (gmailEnabled) throw new Error('Gmail should be disabled after disconnect!')
    console.log('✓ Disconnect working\n')

    // Cleanup
    console.log('11. Cleaning up...')
    await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
    
    await supabase.auth.admin.deleteUser(userId)
    console.log('✓ Cleanup complete\n')

    console.log('✅ ALL TESTS PASSED!\n')
    console.log('Integration toggles system is working correctly.')
    console.log('- Services connect/disconnect properly')
    console.log('- Read/Write toggles control tool availability')
    console.log('- Tool filter enforces permissions')
    console.log('- Multiple services can be managed')

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  }
}

// Run tests
testIntegrationToggles()
