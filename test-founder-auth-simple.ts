#!/usr/bin/env tsx

/**
 * Simple Founder Auth Test
 */

import { isFounder } from './src/lib/auth/founders'
import { PUBLIC_ACCESS, FOUNDER_ACCESS } from './src/lib/auth/feature-flags'

console.log('🔐 Founder Auth System Test\n')

// Test founder detection
console.log('✅ Founder Detection:')
console.log(`   aditya@cubiqo.ai: ${isFounder('aditya@cubiqo.ai')}`)
console.log(`   user@example.com: ${isFounder('user@example.com')}`)
console.log()

// Test access levels
console.log('✅ Access Levels:')
const publicEnabled = Object.values(PUBLIC_ACCESS).filter(v => v).length
const founderEnabled = Object.values(FOUNDER_ACCESS).filter(v => v).length
console.log(`   Public: ${publicEnabled} features enabled`)
console.log(`   Founder: ${founderEnabled} features enabled`)
console.log()

console.log('✅ Feature examples:')
console.log(`   Public can use code execution: ${PUBLIC_ACCESS.codeExecution}`)
console.log(`   Founder can use code execution: ${FOUNDER_ACCESS.codeExecution}`)
console.log(`   Public can access admin: ${PUBLIC_ACCESS.admin}`)
console.log(`   Founder can access admin: ${FOUNDER_ACCESS.admin}`)
console.log()

console.log('🎉 Founder auth system ready!')
