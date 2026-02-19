/**
 * Feature Flags Configuration Tests
 *
 * Validates runtime feature flag logic: default values,
 * env-var overrides, and helper functions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getFeatureFlags,
  getUIFeatureFlags,
  isFeatureEnabled,
  isUIFeatureEnabled,
  getEnabledFlags,
  getEnabledUIFlags,
} from '@/config/feature-flags'

describe('getFeatureFlags', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return FeatureFlags object', () => {
    const flags = getFeatureFlags()
    expect(flags).toHaveProperty('ADMIN_ELEVATED_CONTROLS')
    expect(flags).toHaveProperty('ADMIN_AUDIT_LOGGING')
  })

  it('should always enable audit logging', () => {
    const flags = getFeatureFlags()
    expect(flags.ADMIN_AUDIT_LOGGING).toBe(true)
  })

  it('should enable admin controls in development', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS
    const flags = getFeatureFlags()
    expect(flags.ADMIN_ELEVATED_CONTROLS).toBe(true)
  })

  it('should enable admin controls via env var', () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS = 'true'
    const flags = getFeatureFlags()
    expect(flags.ADMIN_ELEVATED_CONTROLS).toBe(true)
  })
})

describe('getUIFeatureFlags', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return UIFeatureFlags object', () => {
    const flags = getUIFeatureFlags()
    expect(flags).toHaveProperty('showLandingModelFooter')
    expect(flags).toHaveProperty('useParticleLandingAsHome')
  })

  it('should default showLandingModelFooter to false', () => {
    delete process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER
    const flags = getUIFeatureFlags()
    expect(flags.showLandingModelFooter).toBe(false)
  })

  it('should enable showLandingModelFooter via env var', () => {
    process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER = 'true'
    const flags = getUIFeatureFlags()
    expect(flags.showLandingModelFooter).toBe(true)
  })

  it('should default useParticleLandingAsHome to false', () => {
    delete process.env.NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME
    const flags = getUIFeatureFlags()
    expect(flags.useParticleLandingAsHome).toBe(false)
  })

  it('should enable useParticleLandingAsHome via env var', () => {
    process.env.NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME = 'true'
    const flags = getUIFeatureFlags()
    expect(flags.useParticleLandingAsHome).toBe(true)
  })
})

describe('isFeatureEnabled', () => {
  it('should return boolean for valid flag', () => {
    const result = isFeatureEnabled('ADMIN_AUDIT_LOGGING')
    expect(typeof result).toBe('boolean')
  })

  it('should return true for always-on flags', () => {
    expect(isFeatureEnabled('ADMIN_AUDIT_LOGGING')).toBe(true)
  })
})

describe('isUIFeatureEnabled', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return boolean for valid flag', () => {
    const result = isUIFeatureEnabled('showLandingModelFooter')
    expect(typeof result).toBe('boolean')
  })

  it('should reflect env var changes', () => {
    process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER = 'true'
    expect(isUIFeatureEnabled('showLandingModelFooter')).toBe(true)
  })
})

describe('getEnabledFlags', () => {
  it('should return array of enabled flag names', () => {
    const enabled = getEnabledFlags()
    expect(Array.isArray(enabled)).toBe(true)
    // ADMIN_AUDIT_LOGGING is always on
    expect(enabled).toContain('ADMIN_AUDIT_LOGGING')
  })
})

describe('getEnabledUIFlags', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return array of enabled UI flag names', () => {
    const enabled = getEnabledUIFlags()
    expect(Array.isArray(enabled)).toBe(true)
  })

  it('should include flags that are enabled via env vars', () => {
    process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER = 'true'
    process.env.NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME = 'true'
    const enabled = getEnabledUIFlags()
    expect(enabled).toContain('showLandingModelFooter')
    expect(enabled).toContain('useParticleLandingAsHome')
  })

  it('should return empty when no UI flags are enabled', () => {
    delete process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER
    delete process.env.NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME
    const enabled = getEnabledUIFlags()
    expect(enabled.length).toBe(0)
  })
})
