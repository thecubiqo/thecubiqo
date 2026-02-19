/**
 * AI Provider Registry Tests
 *
 * Validates provider registration, feature-flag gating,
 * environment validation, and provider lookup.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isOpenClawEnabled,
  OPENCLAW_PROVIDER,
  validateOpenClawConfig,
  PROVIDER_REGISTRY,
  getEnabledProviders,
  getProvider,
  validateProvider,
  hasExperimentalProviders,
} from '@/lib/ai/providers/index'

describe('isOpenClawEnabled', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return false when no API keys are set', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    expect(isOpenClawEnabled()).toBe(false)
  })

  it('should return true when OPENCLAW_API_KEY is set', () => {
    process.env.OPENCLAW_API_KEY = 'test-key-123'
    expect(isOpenClawEnabled()).toBe(true)
  })

  it('should return true when OPENROUTER_KEY_CUBIKEY is set', () => {
    delete process.env.OPENCLAW_API_KEY
    process.env.OPENROUTER_KEY_CUBIKEY = 'test-key-456'
    expect(isOpenClawEnabled()).toBe(true)
  })
})

describe('OPENCLAW_PROVIDER config', () => {
  it('should have name "openclaw"', () => {
    expect(OPENCLAW_PROVIDER.name).toBe('openclaw')
  })

  it('should be marked as experimental', () => {
    expect(OPENCLAW_PROVIDER.experimental).toBe(true)
  })

  it('should have a display name', () => {
    expect(OPENCLAW_PROVIDER.displayName).toBeTruthy()
  })

  it('should reference OPENCLAW_API_KEY env var', () => {
    expect(OPENCLAW_PROVIDER.apiKeyEnv).toBe('OPENCLAW_API_KEY')
  })

  it('should have isEnabled function', () => {
    expect(typeof OPENCLAW_PROVIDER.isEnabled).toBe('function')
  })
})

describe('validateOpenClawConfig', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return invalid when OpenClaw is not enabled', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    const result = validateOpenClawConfig()
    expect(result.valid).toBe(false)
    expect(result.message).toContain('not enabled')
  })

  it('should return valid when API key is present', () => {
    process.env.OPENCLAW_API_KEY = 'test-key-789'
    const result = validateOpenClawConfig()
    expect(result.valid).toBe(true)
  })
})

describe('PROVIDER_REGISTRY', () => {
  it('should contain openclaw provider', () => {
    expect(PROVIDER_REGISTRY).toHaveProperty('openclaw')
  })

  it('should have config and validate for each provider', () => {
    for (const [, entry] of Object.entries(PROVIDER_REGISTRY)) {
      expect(entry).toHaveProperty('config')
      expect(entry).toHaveProperty('validate')
      expect(typeof entry.validate).toBe('function')
    }
  })
})

describe('getEnabledProviders', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return empty array when no providers are enabled', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    const enabled = getEnabledProviders()
    expect(enabled).toEqual([])
  })

  it('should return enabled providers when API keys are set', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    const enabled = getEnabledProviders()
    expect(enabled.length).toBeGreaterThan(0)
    expect(enabled[0].name).toBe('openclaw')
  })
})

describe('getProvider', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return undefined for non-existent provider', () => {
    expect(getProvider('nonexistent')).toBeUndefined()
  })

  it('should return undefined for disabled provider', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    expect(getProvider('openclaw')).toBeUndefined()
  })

  it('should return provider config when enabled', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    const provider = getProvider('openclaw')
    expect(provider).toBeDefined()
    expect(provider?.name).toBe('openclaw')
  })
})

describe('validateProvider', () => {
  it('should return invalid for unknown provider', () => {
    const result = validateProvider('unknown_provider')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('not found')
  })

  it('should validate known provider', () => {
    const result = validateProvider('openclaw')
    expect(result).toHaveProperty('valid')
    expect(typeof result.valid).toBe('boolean')
  })
})

describe('hasExperimentalProviders', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return false when no experimental providers are enabled', () => {
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    expect(hasExperimentalProviders()).toBe(false)
  })

  it('should return true when OpenClaw is enabled (experimental)', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    expect(hasExperimentalProviders()).toBe(true)
  })
})
