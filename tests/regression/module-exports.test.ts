/**
 * Regression Tests: Module Exports Consistency
 *
 * Ensures core modules continue to export their expected public API.
 * Catches accidental renames, deletions, or signature changes.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Voice Modulation Module Exports', () => {
  const filePath = resolve(__dirname, '../../src/lib/voice-modulation.ts')
  const content = readFileSync(filePath, 'utf-8')

  it('should export VoiceMood type', () => {
    expect(content).toContain("export type VoiceMood")
  })

  it('should export VoiceSettings interface', () => {
    expect(content).toContain('export interface VoiceSettings')
  })

  it('should export VOICE_MOODS constant', () => {
    expect(content).toContain('export const VOICE_MOODS')
  })

  it('should export detectVoiceMood function', () => {
    expect(content).toContain('export function detectVoiceMood')
  })

  it('should export addNaturalVariation function', () => {
    expect(content).toContain('export function addNaturalVariation')
  })

  it('should export getVoiceSettings function', () => {
    expect(content).toContain('export function getVoiceSettings')
  })

  it('should include all four moods in VOICE_MOODS', () => {
    expect(content).toContain('sincere:')
    expect(content).toContain('candid:')
    expect(content).toContain('intimate:')
    expect(content).toContain('neutral:')
  })
})

describe('Token Counter Module Exports', () => {
  const filePath = resolve(__dirname, '../../src/lib/utils/token-counter.ts')
  const content = readFileSync(filePath, 'utf-8')

  it('should export estimateTokenCount function', () => {
    expect(content).toContain('export function estimateTokenCount')
  })

  it('should export countMessageTokens function', () => {
    expect(content).toContain('export function countMessageTokens')
  })

  it('should export countConversationTokens function', () => {
    expect(content).toContain('export function countConversationTokens')
  })

  it('should export DEFAULT_TOKEN_LIMITS constant', () => {
    expect(content).toContain('export const DEFAULT_TOKEN_LIMITS')
  })

  it('should export getTokenLimit function', () => {
    expect(content).toContain('export function getTokenLimit')
  })

  it('should export shouldCompact function', () => {
    expect(content).toContain('export function shouldCompact')
  })

  it('should include Claude model token limits', () => {
    expect(content).toContain('claude-3-5-sonnet-20241022')
    expect(content).toContain('200000')
  })

  it('should include GPT model token limits', () => {
    expect(content).toContain('gpt-4-turbo')
    expect(content).toContain('gpt-4')
    expect(content).toContain('gpt-3.5-turbo')
  })
})

describe('Spending Caps Module Exports', () => {
  const filePath = resolve(__dirname, '../../src/lib/spending-caps.ts')
  const content = readFileSync(filePath, 'utf-8')

  it('should export SPENDING_CAPS constant', () => {
    expect(content).toContain('export const SPENDING_CAPS')
  })

  it('should export COST_PER_UNIT constant', () => {
    expect(content).toContain('export const COST_PER_UNIT')
  })

  it('should export checkSpendingCap function', () => {
    expect(content).toContain('export function checkSpendingCap')
  })

  it('should export recordSpending function', () => {
    expect(content).toContain('export function recordSpending')
  })

  it('should export estimateAnthropicCost function', () => {
    expect(content).toContain('export function estimateAnthropicCost')
  })

  it('should export estimateElevenLabsCost function', () => {
    expect(content).toContain('export function estimateElevenLabsCost')
  })

  it('should export estimateTokens function', () => {
    expect(content).toContain('export function estimateTokens')
  })

  it('should export getSpendingStatus function', () => {
    expect(content).toContain('export function getSpendingStatus')
  })

  it('should export resetSpending function', () => {
    expect(content).toContain('export function resetSpending')
  })
})

describe('Auth Context Module Exports', () => {
  const filePath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
  const content = readFileSync(filePath, 'utf-8')

  it('should export AuthState type', () => {
    expect(content).toContain('export type AuthState')
  })

  it('should export AuthProvider component', () => {
    expect(content).toContain('export function AuthProvider')
  })

  it('should export useAuth hook', () => {
    expect(content).toContain('export function useAuth')
  })

  it('should define signInWithEmail in context value', () => {
    expect(content).toContain('signInWithEmail')
  })

  it('should define signOut in context value', () => {
    expect(content).toContain('signOut')
  })

  it('should define refreshProfile in context value', () => {
    expect(content).toContain('refreshProfile')
  })

  it('should be a client component', () => {
    expect(content).toContain("'use client'")
  })
})

describe('Proxy Module Structure', () => {
  // Next.js 16 uses proxy.ts instead of middleware.ts
  const filePath = resolve(__dirname, '../../src/proxy.ts')
  const content = readFileSync(filePath, 'utf-8')

  it('should export proxy function', () => {
    expect(content).toContain('export default async function proxy')
  })

  it('should export config object', () => {
    expect(content).toContain('export const config')
  })

  it('should use NextRequest type', () => {
    expect(content).toContain('NextRequest')
  })

  it('should use NextResponse', () => {
    expect(content).toContain('NextResponse')
  })

  it('should import from @supabase/ssr', () => {
    expect(content).toContain("from '@supabase/ssr'")
  })
})

describe('Package.json Structure', () => {
  const filePath = resolve(__dirname, '../../package.json')
  const pkg = JSON.parse(readFileSync(filePath, 'utf-8'))

  it('should have test script configured', () => {
    expect(pkg.scripts.test).toBe('vitest')
  })

  it('should have test:run script configured', () => {
    expect(pkg.scripts['test:run']).toBe('vitest run')
  })

  it('should have vitest as dev dependency', () => {
    expect(pkg.devDependencies.vitest).toBeDefined()
  })

  it('should have @testing-library/react as dev dependency', () => {
    expect(pkg.devDependencies['@testing-library/react']).toBeDefined()
  })

  it('should have @testing-library/jest-dom as dev dependency', () => {
    expect(pkg.devDependencies['@testing-library/jest-dom']).toBeDefined()
  })

  it('should have jsdom for test environment', () => {
    expect(pkg.devDependencies.jsdom).toBeDefined()
  })
})
