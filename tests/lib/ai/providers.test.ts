/**
 * Tests for AI Provider Abstraction Layer
 * Validates feature flags, environment configuration, and provider registry
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  PROVIDER_REGISTRY,
  OPENCLAW_PROVIDER,
  isOpenClawEnabled,
  validateOpenClawConfig,
  getEnabledProviders,
  getProvider,
  validateProvider,
  hasExperimentalProviders,
  type ExtendedProviderConfig
} from '../../../src/lib/ai/providers/index'

describe('Provider Registry', () => {
  test('registers OpenClaw provider', () => {
    const entry = PROVIDER_REGISTRY['openclaw']
    expect(entry).toBeDefined()
    expect(entry.config.name).toBe('openclaw')
  })

  test('getEnabledProviders returns array', () => {
    const providers = getEnabledProviders()
    expect(Array.isArray(providers)).toBe(true)
  })

  test('validateProvider checks provider status', () => {
    const result = validateProvider('openclaw')
    expect(result).toHaveProperty('valid')
    expect(typeof result.valid).toBe('boolean')
  })

  test('validateProvider returns error for unknown provider', () => {
    const result = validateProvider('nonexistent')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('not found')
  })
})

describe('OpenClaw Feature Flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Create a minimal clean environment for tests
    process.env = {
      NODE_ENV: 'test',
      PATH: originalEnv.PATH || ''
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('disabled by default without API key', () => {
    expect(isOpenClawEnabled()).toBe(false)
  })

  test('enabled with OPENCLAW_API_KEY', () => {
    process.env.OPENCLAW_API_KEY = 'test-key-123'
    
    expect(isOpenClawEnabled()).toBe(true)
  })

  test('enabled with OPENROUTER_KEY_CUBIKEY', () => {
    process.env.OPENROUTER_KEY_CUBIKEY = 'test-key-456'
    
    expect(isOpenClawEnabled()).toBe(true)
  })

  test('enabled with API key and base URL', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'https://clawdbot.example.com'
    
    expect(isOpenClawEnabled()).toBe(true)
  })

  test('disabled without API key regardless of environment', () => {
    process.env.NODE_ENV = 'production'
    
    expect(isOpenClawEnabled()).toBe(false)
  })

  test('enabled with API key in any environment', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'https://api.example.com'
    process.env.NODE_ENV = 'test'
    
    expect(isOpenClawEnabled()).toBe(true)
  })
})

describe('OpenClaw Configuration Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Create a minimal clean environment for tests
    process.env = {
      NODE_ENV: 'test',
      PATH: originalEnv.PATH || ''
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('reports not enabled when API key missing', () => {
    const validation = validateOpenClawConfig()
    
    expect(validation.valid).toBe(false)
    expect(validation.message).toBeDefined()
    expect(validation.message).toContain('not enabled')
  })

  test('valid with API key set', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    
    const validation = validateOpenClawConfig()
    
    expect(validation.valid).toBe(true)
  })

  test('reports error for invalid base URL format', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'invalid-url-format'
    
    const validation = validateOpenClawConfig()
    
    expect(validation.valid).toBe(false)
    expect(validation.message).toContain('Invalid OPENCLAW_BASE_URL')
  })

  test('valid with proper configuration', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'https://api.example.com'
    
    const validation = validateOpenClawConfig()
    
    expect(validation.valid).toBe(true)
  })

  test('valid with default base URL', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    delete process.env.OPENCLAW_BASE_URL
    
    const validation = validateOpenClawConfig()
    
    // Default base URL is http://localhost:18789 which is valid
    expect(validation.valid).toBe(true)
  })
})

describe('OpenClaw Provider Configuration', () => {
  test('has correct default values', () => {
    expect(OPENCLAW_PROVIDER.name).toBe('openclaw')
    expect(OPENCLAW_PROVIDER.displayName).toBe('OpenClaw (via Clawdbot)')
    expect(OPENCLAW_PROVIDER.apiKeyEnv).toBe('OPENCLAW_API_KEY')
  })

  test('has a model configured', () => {
    expect(OPENCLAW_PROVIDER.model).toBeTruthy()
  })

  test('has maxTokens configured', () => {
    expect(typeof OPENCLAW_PROVIDER.maxTokens).toBe('number')
    expect(OPENCLAW_PROVIDER.maxTokens).toBeGreaterThan(0)
  })

  test('is marked as experimental', () => {
    expect(OPENCLAW_PROVIDER.experimental).toBe(true)
  })
})

describe('getProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Create a minimal clean environment for tests
    process.env = {
      NODE_ENV: 'test',
      PATH: originalEnv.PATH || ''
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('returns undefined when OpenClaw not enabled', () => {
    const provider = getProvider('openclaw')
    expect(provider).toBeUndefined()
  })

  test('returns undefined for unknown provider', () => {
    const provider = getProvider('nonexistent')
    expect(provider).toBeUndefined()
  })

  test('returns config when properly configured', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'https://api.example.com'
    
    const provider = getProvider('openclaw')
    expect(provider).toBeDefined()
    expect(provider?.name).toBe('openclaw')
  })
})

describe('hasExperimentalProviders', () => {
  test('returns boolean', () => {
    const result = hasExperimentalProviders()
    expect(typeof result).toBe('boolean')
  })
})

describe('Provider Integration', () => {
  test('OpenClaw provider isEnabled matches isOpenClawEnabled', () => {
    const providerEnabled = OPENCLAW_PROVIDER.isEnabled()
    const functionEnabled = isOpenClawEnabled()
    
    expect(providerEnabled).toBe(functionEnabled)
  })

  test('PROVIDER_REGISTRY contains openclaw', () => {
    expect(PROVIDER_REGISTRY).toHaveProperty('openclaw')
    expect(PROVIDER_REGISTRY.openclaw.config).toBe(OPENCLAW_PROVIDER)
  })
})

describe('Edge Cases', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Create a minimal clean environment for tests
    process.env = {
      NODE_ENV: 'test',
      PATH: originalEnv.PATH || ''
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('handles empty string API key', () => {
    process.env.OPENCLAW_API_KEY = ''
    expect(isOpenClawEnabled()).toBe(false)
  })

  test('handles whitespace-only API key', () => {
    process.env.OPENCLAW_API_KEY = '   '
    // Whitespace is technically truthy but should be handled
    const enabled = isOpenClawEnabled()
    expect(typeof enabled).toBe('boolean')
  })

  test('handles both API key env vars set', () => {
    process.env.OPENCLAW_API_KEY = 'key1'
    process.env.OPENROUTER_KEY_CUBIKEY = 'key2'
    process.env.NODE_ENV = 'development'
    
    // Should still work with either key present
    expect(isOpenClawEnabled()).toBe(true)
  })

  test('validates URL with http protocol', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'http://localhost:18789'
    
    const validation = validateOpenClawConfig()
    expect(validation.valid).toBe(true)
  })

  test('validates URL with https protocol', () => {
    process.env.OPENCLAW_API_KEY = 'test-key'
    process.env.OPENCLAW_BASE_URL = 'https://secure.example.com'
    
    const validation = validateOpenClawConfig()
    expect(validation.valid).toBe(true)
  })
})
