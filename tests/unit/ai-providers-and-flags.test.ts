import { describe, it, expect } from 'vitest'
import {
  PRIMARY_PROVIDER,
  FALLBACK_PROVIDERS,
  MINIMAX_CONFIG,
  MIXTRAL_CONFIG,
  LLAMA_CONFIG,
  CLAUDE_CONFIG,
} from '@/lib/ai/providers'
import {
  getFeatureFlags,
  getUIFeatureFlags,
  isFeatureEnabled,
  isUIFeatureEnabled,
  getEnabledFlags,
  getEnabledUIFlags,
} from '@/config/feature-flags'

describe('AI Provider Configuration', () => {
  describe('Primary provider', () => {
    it('should be MiniMax', () => {
      expect(PRIMARY_PROVIDER.name).toBe('minimax')
      expect(PRIMARY_PROVIDER.model).toBe('MiniMax-M2')
    })

    it('should have same config as MINIMAX_CONFIG', () => {
      expect(PRIMARY_PROVIDER).toEqual(MINIMAX_CONFIG)
    })
  })

  describe('Fallback providers', () => {
    it('should have exactly 3 fallbacks', () => {
      expect(FALLBACK_PROVIDERS).toHaveLength(3)
    })

    it('should follow correct fallback order: mixtral → llama → claude', () => {
      expect(FALLBACK_PROVIDERS[0].name).toBe('mixtral')
      expect(FALLBACK_PROVIDERS[1].name).toBe('llama')
      expect(FALLBACK_PROVIDERS[2].name).toBe('claude')
    })

    it('should match individual config exports', () => {
      expect(FALLBACK_PROVIDERS[0]).toEqual(MIXTRAL_CONFIG)
      expect(FALLBACK_PROVIDERS[1]).toEqual(LLAMA_CONFIG)
      expect(FALLBACK_PROVIDERS[2]).toEqual(CLAUDE_CONFIG)
    })
  })

  describe('Provider configs', () => {
    const allProviders = [MINIMAX_CONFIG, MIXTRAL_CONFIG, LLAMA_CONFIG, CLAUDE_CONFIG]

    it('should all have required fields', () => {
      allProviders.forEach(provider => {
        expect(provider.name).toBeDefined()
        expect(provider.model).toBeDefined()
        expect(provider.maxTokens).toBeGreaterThan(0)
        expect(provider.apiKeyEnv).toBeDefined()
      })
    })

    it('should all have unique names', () => {
      const names = allProviders.map(p => p.name)
      expect(new Set(names).size).toBe(names.length)
    })

    it('should all have unique API key env vars', () => {
      const envVars = allProviders.map(p => p.apiKeyEnv)
      expect(new Set(envVars).size).toBe(envVars.length)
    })

    it('should have consistent maxTokens', () => {
      allProviders.forEach(provider => {
        expect(provider.maxTokens).toBe(200)
      })
    })
  })
})

describe('Feature Flags Configuration', () => {
  describe('getFeatureFlags', () => {
    it('should return a valid FeatureFlags object', () => {
      const flags = getFeatureFlags()
      expect(flags).toBeDefined()
      expect(typeof flags.ADMIN_ELEVATED_CONTROLS).toBe('boolean')
      expect(typeof flags.ADMIN_AUDIT_LOGGING).toBe('boolean')
    })

    it('should always enable audit logging', () => {
      const flags = getFeatureFlags()
      expect(flags.ADMIN_AUDIT_LOGGING).toBe(true)
    })
  })

  describe('getUIFeatureFlags', () => {
    it('should return a valid UIFeatureFlags object', () => {
      const flags = getUIFeatureFlags()
      expect(flags).toBeDefined()
      expect(typeof flags.showLandingModelFooter).toBe('boolean')
      expect(typeof flags.useParticleLandingAsHome).toBe('boolean')
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return boolean for valid flags', () => {
      expect(typeof isFeatureEnabled('ADMIN_AUDIT_LOGGING')).toBe('boolean')
      expect(typeof isFeatureEnabled('ADMIN_ELEVATED_CONTROLS')).toBe('boolean')
    })

    it('should return true for always-enabled flags', () => {
      expect(isFeatureEnabled('ADMIN_AUDIT_LOGGING')).toBe(true)
    })
  })

  describe('isUIFeatureEnabled', () => {
    it('should return boolean for valid UI flags', () => {
      expect(typeof isUIFeatureEnabled('showLandingModelFooter')).toBe('boolean')
      expect(typeof isUIFeatureEnabled('useParticleLandingAsHome')).toBe('boolean')
    })
  })

  describe('getEnabledFlags', () => {
    it('should return an array', () => {
      const enabled = getEnabledFlags()
      expect(Array.isArray(enabled)).toBe(true)
    })

    it('should always include ADMIN_AUDIT_LOGGING', () => {
      const enabled = getEnabledFlags()
      expect(enabled).toContain('ADMIN_AUDIT_LOGGING')
    })
  })

  describe('getEnabledUIFlags', () => {
    it('should return an array', () => {
      const enabled = getEnabledUIFlags()
      expect(Array.isArray(enabled)).toBe(true)
    })
  })
})
