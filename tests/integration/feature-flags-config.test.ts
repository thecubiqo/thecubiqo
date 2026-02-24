/**
 * Integration Tests: Feature Flags + Config
 *
 * Tests that feature flag functions interact correctly with each other
 * and that the config module exports are consistent.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Feature Flags Integration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should export getFeatureFlags function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.getFeatureFlags).toBe('function')
  })

  it('should export getUIFeatureFlags function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.getUIFeatureFlags).toBe('function')
  })

  it('should export isFeatureEnabled function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.isFeatureEnabled).toBe('function')
  })

  it('should export isUIFeatureEnabled function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.isUIFeatureEnabled).toBe('function')
  })

  it('should export getEnabledFlags function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.getEnabledFlags).toBe('function')
  })

  it('should export getEnabledUIFlags function', async () => {
    const mod = await import('@/config/feature-flags')
    expect(typeof mod.getEnabledUIFlags).toBe('function')
  })

  it('should always enable audit logging', async () => {
    const mod = await import('@/config/feature-flags')
    const flags = mod.getFeatureFlags()
    expect(flags.ADMIN_AUDIT_LOGGING).toBe(true)
  })

  it('should have consistent flag keys between getFeatureFlags and isFeatureEnabled', async () => {
    const mod = await import('@/config/feature-flags')
    const flags = mod.getFeatureFlags()
    for (const key of Object.keys(flags)) {
      const isEnabled = mod.isFeatureEnabled(key as keyof typeof flags)
      expect(isEnabled).toBe(flags[key as keyof typeof flags])
    }
  })

  it('should return enabled flags as array from getEnabledFlags', async () => {
    const mod = await import('@/config/feature-flags')
    const enabledFlags = mod.getEnabledFlags()
    expect(Array.isArray(enabledFlags)).toBe(true)
    // Audit logging is always enabled
    expect(enabledFlags).toContain('ADMIN_AUDIT_LOGGING')
  })
})

describe('Feature Flags Source File Structure', () => {
  const filePath = resolve(__dirname, '../../src/config/feature-flags.ts')
  const content = readFileSync(filePath, 'utf-8')

  it('should define FeatureFlags interface', () => {
    expect(content).toContain('export interface FeatureFlags')
  })

  it('should define UIFeatureFlags interface', () => {
    expect(content).toContain('export interface UIFeatureFlags')
  })

  it('should reference environment variables for admin controls', () => {
    expect(content).toContain('NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS')
  })

  it('should reference environment variables for UI flags', () => {
    expect(content).toContain('NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER')
    expect(content).toContain('NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME')
  })

  it('should check NODE_ENV for dev defaults', () => {
    expect(content).toContain("process.env.NODE_ENV === 'development'")
  })
})

describe('Proxy Config Integration', () => {
  // Next.js 16 uses proxy.ts instead of middleware.ts
  const proxyPath = resolve(__dirname, '../../src/proxy.ts')
  const proxyContent = readFileSync(proxyPath, 'utf-8')

  it('should export proxy function', () => {
    expect(proxyContent).toContain('export default async function proxy')
  })

  it('should export config with matcher', () => {
    expect(proxyContent).toContain('export const config')
    expect(proxyContent).toContain('matcher')
  })

  it('should exclude static files from matcher', () => {
    expect(proxyContent).toContain('_next/static')
    expect(proxyContent).toContain('_next/image')
    expect(proxyContent).toContain('favicon.ico')
  })

  it('should exclude image file extensions', () => {
    expect(proxyContent).toContain('svg')
    expect(proxyContent).toContain('png')
    expect(proxyContent).toContain('jpg')
  })

  it('should use Supabase SSR for session management', () => {
    expect(proxyContent).toContain('createServerClient')
    expect(proxyContent).toContain('@supabase/ssr')
  })

  it('should call getUser to refresh session', () => {
    expect(proxyContent).toContain('supabase.auth.getUser()')
  })
})
