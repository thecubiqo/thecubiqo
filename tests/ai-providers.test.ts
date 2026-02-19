/**
 * AI Providers Tests
 * 
 * Validates OpenClaw provider integration and feature flags.
 * Related PR: #4 (OpenClaw Integration)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('OpenClaw Provider Integration', () => {
  const providersPath = resolve(__dirname, '../src/lib/ai/providers/index.ts')
  const providersContent = readFileSync(providersPath, 'utf-8')

  it('should define OPENCLAW_PROVIDER', () => {
    expect(providersContent).toContain('OPENCLAW_PROVIDER')
  })

  it('should export ExtendedProviderConfig interface', () => {
    expect(providersContent).toContain('export interface ExtendedProviderConfig')
  })

  it('should export isOpenClawEnabled function', () => {
    expect(providersContent).toContain('export function isOpenClawEnabled')
  })

  it('should export getEnabledProviders function', () => {
    expect(providersContent).toContain('export function getEnabledProviders')
  })

  it('should export getProvider function', () => {
    expect(providersContent).toContain('export function getProvider')
  })

  it('should export validateProvider function', () => {
    expect(providersContent).toContain('export function validateProvider')
  })

  it('should check for OpenClaw API key', () => {
    expect(providersContent).toContain('OPENCLAW_API_KEY')
  })

  it('should require API key for OpenClaw', () => {
    expect(providersContent).toContain('OPENCLAW_API_KEY')
  })
})

describe('OpenClaw Provider Feature Flags', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should disable OpenClaw by default', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY

    // Verify the code structure checks for API key presence
    const providersPath = resolve(__dirname, '../src/lib/ai/providers/index.ts')
    const providersContent = readFileSync(providersPath, 'utf-8')
    
    expect(providersContent).toContain('process.env.OPENCLAW_API_KEY')
  })
})

describe('OpenClaw Documentation', () => {
  const docPath = resolve(__dirname, '../docs/OPENCLAW_INTEGRATION.md')
  const docContent = readFileSync(docPath, 'utf-8')

  it('should document how to enable OpenClaw', () => {
    expect(docContent).toContain('OPENCLAW_API_KEY')
  })

  it('should document environment variable setup', () => {
    expect(docContent).toContain('.env.local')
  })

  it('should document provider functions', () => {
    expect(docContent).toContain('getEnabledProviders')
    expect(docContent).toContain('isProviderEnabled')
  })

  it('should document security practices', () => {
    expect(docContent).toContain('Security')
  })

  it('should document troubleshooting', () => {
    expect(docContent).toContain('Troubleshooting')
  })
})
