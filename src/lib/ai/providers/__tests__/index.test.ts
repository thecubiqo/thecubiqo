/**
 * Provider Abstraction Integration Test
 * 
 * This test verifies that the provider abstraction:
 * 1. Exports correctly from the AI module
 * 2. Has correct default behavior (OpenClaw disabled)
 * 3. Can be enabled with environment variables
 * 4. Validates configuration properly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  OPENCLAW_PROVIDER,
  PROVIDER_REGISTRY,
  isOpenClawEnabled,
  getEnabledProviders,
  getProvider,
  validateProvider,
  validateOpenClawConfig
} from '../index'

describe('Provider Abstraction', () => {
  // Store original env var values
  const originalOpenClawKey = process.env.OPENCLAW_API_KEY
  const originalOpenRouterKey = process.env.OPENROUTER_KEY_CUBIKEY
  const originalBaseUrl = process.env.OPENCLAW_BASE_URL

  beforeEach(() => {
    // Clear OpenClaw env vars before each test
    delete process.env.OPENCLAW_API_KEY
    delete process.env.OPENROUTER_KEY_CUBIKEY
    delete process.env.OPENCLAW_BASE_URL
  })

  afterEach(() => {
    // Restore original env vars
    if (originalOpenClawKey !== undefined) {
      process.env.OPENCLAW_API_KEY = originalOpenClawKey
    } else {
      delete process.env.OPENCLAW_API_KEY
    }
    if (originalOpenRouterKey !== undefined) {
      process.env.OPENROUTER_KEY_CUBIKEY = originalOpenRouterKey
    } else {
      delete process.env.OPENROUTER_KEY_CUBIKEY
    }
    if (originalBaseUrl !== undefined) {
      process.env.OPENCLAW_BASE_URL = originalBaseUrl
    } else {
      delete process.env.OPENCLAW_BASE_URL
    }
  })

  describe('OpenClaw Provider Configuration', () => {
    it('should have correct provider configuration', () => {
      expect(OPENCLAW_PROVIDER).toBeDefined()
      expect(OPENCLAW_PROVIDER.displayName).toBe('OpenClaw (via Clawdbot)')
      expect(OPENCLAW_PROVIDER.experimental).toBe(true)
      expect(OPENCLAW_PROVIDER.model).toBe('claude-3-5-sonnet-20241022')
      expect(OPENCLAW_PROVIDER.maxTokens).toBe(4000)
    })

    it('should be registered in PROVIDER_REGISTRY', () => {
      expect(PROVIDER_REGISTRY.openclaw).toBeDefined()
      expect(PROVIDER_REGISTRY.openclaw.config).toBe(OPENCLAW_PROVIDER)
      expect(typeof PROVIDER_REGISTRY.openclaw.validate).toBe('function')
    })
  })

  describe('Feature Flag - Default Behavior', () => {
    it('should be disabled by default (no env vars)', () => {
      expect(isOpenClawEnabled()).toBe(false)
    })

    it('should not appear in enabled providers by default', () => {
      const enabledProviders = getEnabledProviders()
      expect(enabledProviders).toHaveLength(0)
    })

    it('should return undefined when getting disabled provider', () => {
      const provider = getProvider('openclaw')
      expect(provider).toBeUndefined()
    })

    it('should fail validation when disabled', () => {
      const result = validateProvider('openclaw')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('not enabled')
    })

    it('should fail OpenClaw config validation when disabled', () => {
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(false)
      expect(result.message).toContain('not enabled')
    })
  })

  describe('Feature Flag - Enabled with OPENCLAW_API_KEY', () => {
    beforeEach(() => {
      process.env.OPENCLAW_API_KEY = 'test_api_key'
    })

    it('should be enabled when OPENCLAW_API_KEY is set', () => {
      expect(isOpenClawEnabled()).toBe(true)
    })

    it('should appear in enabled providers', () => {
      const enabledProviders = getEnabledProviders()
      expect(enabledProviders.length).toBeGreaterThan(0)
      expect(enabledProviders.some(p => p.name === 'openclaw')).toBe(true)
    })

    it('should return provider when getting enabled provider', () => {
      const provider = getProvider('openclaw')
      expect(provider).toBeDefined()
      expect(provider?.displayName).toBe('OpenClaw (via Clawdbot)')
    })

    it('should pass validation when enabled', () => {
      const result = validateProvider('openclaw')
      expect(result.valid).toBe(true)
    })

    it('should pass OpenClaw config validation', () => {
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(true)
    })
  })

  describe('Feature Flag - Enabled with OPENROUTER_KEY_CUBIKEY', () => {
    beforeEach(() => {
      process.env.OPENROUTER_KEY_CUBIKEY = 'test_api_key'
    })

    it('should be enabled when OPENROUTER_KEY_CUBIKEY is set', () => {
      expect(isOpenClawEnabled()).toBe(true)
    })

    it('should pass validation when enabled with alternative key', () => {
      const result = validateProvider('openclaw')
      expect(result.valid).toBe(true)
    })
  })

  describe('URL Validation', () => {
    beforeEach(() => {
      process.env.OPENCLAW_API_KEY = 'test_api_key'
    })

    it('should accept valid http URL', () => {
      process.env.OPENCLAW_BASE_URL = 'http://localhost:18789'
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(true)
    })

    it('should accept valid https URL', () => {
      process.env.OPENCLAW_BASE_URL = 'https://example.com'
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(true)
    })

    it('should reject invalid URL format', () => {
      process.env.OPENCLAW_BASE_URL = 'invalid-url'
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(false)
      expect(result.message).toContain('Invalid OPENCLAW_BASE_URL')
    })

    it('should reject URL without protocol', () => {
      process.env.OPENCLAW_BASE_URL = 'localhost:18789'
      const result = validateOpenClawConfig()
      expect(result.valid).toBe(false)
    })
  })

  describe('Provider Registry', () => {
    it('should return error for non-existent provider', () => {
      const result = validateProvider('nonexistent')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('not found in registry')
    })

    it('should return undefined for non-existent provider get', () => {
      const provider = getProvider('nonexistent')
      expect(provider).toBeUndefined()
    })
  })
})
