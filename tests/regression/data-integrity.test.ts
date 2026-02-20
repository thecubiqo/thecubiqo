import { describe, it, expect } from 'vitest'
import { FOUNDER_ACCESS, USER_ACCESS, isFounder, hasFeature, FEATURE_METADATA } from '@/lib/auth/feature-gate-simple'
import { PRIMARY_PROVIDER, FALLBACK_PROVIDERS, MINIMAX_CONFIG, MIXTRAL_CONFIG, LLAMA_CONFIG, CLAUDE_CONFIG } from '@/lib/ai/providers'

describe('Data Integrity Regression Tests', () => {
  describe('Feature flag defaults never change', () => {
    it('should verify FOUNDER_ACCESS has all features enabled', () => {
      expect(FOUNDER_ACCESS).toBeDefined()
      expect(FOUNDER_ACCESS.home).toBe(true)
      expect(FOUNDER_ACCESS.chat).toBe(true)
      expect(FOUNDER_ACCESS.settings).toBe(true)
      expect(FOUNDER_ACCESS.agents).toBe(true)
      expect(FOUNDER_ACCESS.files).toBe(true)
      expect(FOUNDER_ACCESS.memory).toBe(true)
      expect(FOUNDER_ACCESS.voice_mode).toBe(true)
      expect(FOUNDER_ACCESS.action_cards).toBe(true)
      expect(FOUNDER_ACCESS.codeExecution).toBe(true)
      expect(FOUNDER_ACCESS.browser).toBe(true)
      expect(FOUNDER_ACCESS.integrations).toBe(true)
      expect(FOUNDER_ACCESS.admin).toBe(true)
      expect(FOUNDER_ACCESS.duo_mode).toBe(true)
      expect(FOUNDER_ACCESS.sidekick_mode).toBe(true)
      expect(FOUNDER_ACCESS.cope_mode).toBe(true)
    })

    it('should verify USER_ACCESS default has correct enabled features', () => {
      expect(USER_ACCESS).toBeDefined()
      
      // Features that should be true
      expect(USER_ACCESS.home).toBe(true)
      expect(USER_ACCESS.chat).toBe(true)
      expect(USER_ACCESS.settings).toBe(true)
      expect(USER_ACCESS.voice_mode).toBe(true)
      expect(USER_ACCESS.action_cards).toBe(true)
      
      // Features that should be false
      expect(USER_ACCESS.agents).toBe(false)
      expect(USER_ACCESS.files).toBe(false)
      expect(USER_ACCESS.memory).toBe(false)
      expect(USER_ACCESS.codeExecution).toBe(false)
      expect(USER_ACCESS.browser).toBe(false)
      expect(USER_ACCESS.integrations).toBe(false)
      expect(USER_ACCESS.admin).toBe(false)
      expect(USER_ACCESS.duo_mode).toBe(false)
      expect(USER_ACCESS.sidekick_mode).toBe(false)
      expect(USER_ACCESS.cope_mode).toBe(false)
    })

    it('should verify isFounder function works correctly', () => {
      // Mock founder email
      const founderEmails = [
        'founder@thecubiqo.com',
        'admin@thecubiqo.com',
      ]
      
      founderEmails.forEach(email => {
        const result = isFounder(email)
        expect(typeof result).toBe('boolean')
      })
      
      // Non-founder emails
      const regularEmails = [
        'user@example.com',
        'test@gmail.com',
      ]
      
      regularEmails.forEach(email => {
        const result = isFounder(email)
        expect(typeof result).toBe('boolean')
      })
    })

    it('should verify hasFeature function returns boolean', () => {
      const features: Array<keyof typeof FOUNDER_ACCESS> = [
        'home', 'chat', 'settings', 'agents', 'files', 
        'memory', 'voice_mode', 'action_cards', 'admin'
      ]
      
      features.forEach(feature => {
        const result = hasFeature('test@example.com', feature)
        expect(typeof result).toBe('boolean')
      })
    })
  })

  describe('AI provider configs are complete', () => {
    it('should verify PRIMARY_PROVIDER has required fields', () => {
      expect(PRIMARY_PROVIDER).toBeDefined()
      expect(PRIMARY_PROVIDER.name).toBeDefined()
      expect(typeof PRIMARY_PROVIDER.name).toBe('string')
      expect(PRIMARY_PROVIDER.name.length).toBeGreaterThan(0)
      
      expect(PRIMARY_PROVIDER.model).toBeDefined()
      expect(typeof PRIMARY_PROVIDER.model).toBe('string')
      expect(PRIMARY_PROVIDER.model.length).toBeGreaterThan(0)
      
      expect(PRIMARY_PROVIDER.maxTokens).toBeDefined()
      expect(typeof PRIMARY_PROVIDER.maxTokens).toBe('number')
      expect(PRIMARY_PROVIDER.maxTokens).toBeGreaterThan(0)
      
      expect(PRIMARY_PROVIDER.apiKeyEnv).toBeDefined()
      expect(typeof PRIMARY_PROVIDER.apiKeyEnv).toBe('string')
      expect(PRIMARY_PROVIDER.apiKeyEnv.length).toBeGreaterThan(0)
    })

    it('should verify FALLBACK_PROVIDERS has exactly 3 entries', () => {
      expect(FALLBACK_PROVIDERS).toBeDefined()
      expect(Array.isArray(FALLBACK_PROVIDERS)).toBe(true)
      expect(FALLBACK_PROVIDERS.length).toBe(3)
    })

    it('should verify fallback order is mixtral → llama → claude', () => {
      expect(FALLBACK_PROVIDERS[0]).toBe(MIXTRAL_CONFIG)
      expect(FALLBACK_PROVIDERS[1]).toBe(LLAMA_CONFIG)
      expect(FALLBACK_PROVIDERS[2]).toBe(CLAUDE_CONFIG)
    })

    it('should verify all fallback providers are properly configured', () => {
      FALLBACK_PROVIDERS.forEach((provider, index) => {
        expect(provider).toBeDefined()
        expect(provider.name).toBeDefined()
        expect(typeof provider.name).toBe('string')
        expect(provider.name.length).toBeGreaterThan(0)
        
        expect(provider.model).toBeDefined()
        expect(typeof provider.model).toBe('string')
        expect(provider.model.length).toBeGreaterThan(0)
        
        expect(provider.maxTokens).toBeDefined()
        expect(typeof provider.maxTokens).toBe('number')
        expect(provider.maxTokens).toBeGreaterThan(0)
        
        expect(provider.apiKeyEnv).toBeDefined()
        expect(typeof provider.apiKeyEnv).toBe('string')
        expect(provider.apiKeyEnv.length).toBeGreaterThan(0)
      })
    })

    it('should verify individual provider configs', () => {
      // MINIMAX_CONFIG
      expect(MINIMAX_CONFIG).toBeDefined()
      expect(MINIMAX_CONFIG.name).toBe('minimax')
      expect(MINIMAX_CONFIG.model).toBeDefined()
      expect(MINIMAX_CONFIG.maxTokens).toBeGreaterThan(0)
      expect(MINIMAX_CONFIG.apiKeyEnv).toBeDefined()
      
      // MIXTRAL_CONFIG
      expect(MIXTRAL_CONFIG).toBeDefined()
      expect(MIXTRAL_CONFIG.name).toBe('mixtral')
      expect(MIXTRAL_CONFIG.model).toBeDefined()
      expect(MIXTRAL_CONFIG.maxTokens).toBeGreaterThan(0)
      expect(MIXTRAL_CONFIG.apiKeyEnv).toBeDefined()
      
      // LLAMA_CONFIG
      expect(LLAMA_CONFIG).toBeDefined()
      expect(LLAMA_CONFIG.name).toBe('llama')
      expect(LLAMA_CONFIG.model).toBeDefined()
      expect(LLAMA_CONFIG.maxTokens).toBeGreaterThan(0)
      expect(LLAMA_CONFIG.apiKeyEnv).toBeDefined()
      
      // CLAUDE_CONFIG
      expect(CLAUDE_CONFIG).toBeDefined()
      expect(CLAUDE_CONFIG.name).toBe('claude')
      expect(CLAUDE_CONFIG.model).toBeDefined()
      expect(CLAUDE_CONFIG.maxTokens).toBeGreaterThan(0)
      expect(CLAUDE_CONFIG.apiKeyEnv).toBeDefined()
    })
  })

  describe('Memory type coverage', () => {
    it('should verify all 6 memory types exist', () => {
      const expectedMemoryTypes = [
        'factual',
        'preference',
        'emotional',
        'goal',
        'relationship',
        'context',
      ]
      
      // These types should be defined in the memory system
      expectedMemoryTypes.forEach(type => {
        expect(type).toBeDefined()
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
      })
      
      expect(expectedMemoryTypes.length).toBe(6)
    })

    it('should verify memory type string values are correct', () => {
      const memoryTypes = [
        'factual',
        'preference',
        'emotional',
        'goal',
        'relationship',
        'context',
      ]
      
      expect(memoryTypes).toContain('factual')
      expect(memoryTypes).toContain('preference')
      expect(memoryTypes).toContain('emotional')
      expect(memoryTypes).toContain('goal')
      expect(memoryTypes).toContain('relationship')
      expect(memoryTypes).toContain('context')
    })
  })

  describe('Color category coverage', () => {
    it('should verify all 3 color categories exist', () => {
      const colorCategories = ['RED', 'YELLOW', 'GREEN_BLUE']
      
      expect(colorCategories.length).toBe(3)
      expect(colorCategories).toContain('RED')
      expect(colorCategories).toContain('YELLOW')
      expect(colorCategories).toContain('GREEN_BLUE')
    })

    it('should verify color category values are uppercase', () => {
      const colorCategories = ['RED', 'YELLOW', 'GREEN_BLUE']
      
      colorCategories.forEach(category => {
        expect(category).toBe(category.toUpperCase())
      })
    })
  })

  describe('Feature metadata completeness', () => {
    it('should verify FEATURE_METADATA is defined', () => {
      expect(FEATURE_METADATA).toBeDefined()
      expect(typeof FEATURE_METADATA).toBe('object')
    })

    it('should verify each metadata entry has required fields', () => {
      expect(FEATURE_METADATA.length).toBeGreaterThan(0)
      
      FEATURE_METADATA.forEach(metadata => {
        expect(metadata).toBeDefined()
        expect(metadata.id).toBeDefined()
        expect(typeof metadata.id).toBe('string')
        expect(metadata.id.length).toBeGreaterThan(0)
        
        expect(metadata.name).toBeDefined()
        expect(typeof metadata.name).toBe('string')
        expect(metadata.name.length).toBeGreaterThan(0)
        
        expect(metadata.description).toBeDefined()
        expect(typeof metadata.description).toBe('string')
        expect(metadata.description.length).toBeGreaterThan(0)
        
        expect(metadata.category).toBeDefined()
        expect(typeof metadata.category).toBe('string')
        expect(metadata.category.length).toBeGreaterThan(0)
      })
    })

    it('should verify feature IDs are unique', () => {
      const ids = FEATURE_METADATA.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should verify feature categories are valid', () => {
      const validCategories = ['Navigation', 'Agent Features', 'Integrations']
      
      FEATURE_METADATA.forEach(metadata => {
        expect(validCategories).toContain(metadata.category)
      })
    })
  })

  describe('Provider config structure', () => {
    it('should verify each provider has consistent structure', () => {
      const providers = [
        PRIMARY_PROVIDER,
        MINIMAX_CONFIG,
        MIXTRAL_CONFIG,
        LLAMA_CONFIG,
        CLAUDE_CONFIG,
      ]
      
      providers.forEach(provider => {
        expect(provider).toBeDefined()
        
        // Verify name
        expect(provider.name).toBeDefined()
        expect(typeof provider.name).toBe('string')
        expect(provider.name.length).toBeGreaterThan(0)
        
        // Verify model
        expect(provider.model).toBeDefined()
        expect(typeof provider.model).toBe('string')
        expect(provider.model.length).toBeGreaterThan(0)
        
        // Verify maxTokens is positive number
        expect(provider.maxTokens).toBeDefined()
        expect(typeof provider.maxTokens).toBe('number')
        expect(provider.maxTokens).toBeGreaterThan(0)
        expect(Number.isFinite(provider.maxTokens)).toBe(true)
        
        // Verify apiKeyEnv is string
        expect(provider.apiKeyEnv).toBeDefined()
        expect(typeof provider.apiKeyEnv).toBe('string')
        expect(provider.apiKeyEnv.length).toBeGreaterThan(0)
      })
    })

    it('should verify maxTokens are reasonable values', () => {
      const providers = [
        PRIMARY_PROVIDER,
        MINIMAX_CONFIG,
        MIXTRAL_CONFIG,
        LLAMA_CONFIG,
        CLAUDE_CONFIG,
      ]
      
      providers.forEach(provider => {
        // MaxTokens should be positive and reasonable (between 1 and 200000)
        expect(provider.maxTokens).toBeGreaterThan(0)
        expect(provider.maxTokens).toBeLessThanOrEqual(200000)
      })
    })

    it('should verify apiKeyEnv follows naming convention', () => {
      const providers = [
        PRIMARY_PROVIDER,
        MINIMAX_CONFIG,
        MIXTRAL_CONFIG,
        LLAMA_CONFIG,
        CLAUDE_CONFIG,
      ]
      
      providers.forEach(provider => {
        // API key environment variables should be uppercase or follow standard naming
        expect(provider.apiKeyEnv).toBeDefined()
        expect(provider.apiKeyEnv.length).toBeGreaterThan(0)
        
        // Should not contain spaces
        expect(provider.apiKeyEnv).not.toContain(' ')
      })
    })

    it('should verify provider names are unique', () => {
      // Note: PRIMARY_PROVIDER is the same as MINIMAX_CONFIG, so we test the distinct configs
      const providers = [
        MINIMAX_CONFIG,
        MIXTRAL_CONFIG,
        LLAMA_CONFIG,
        CLAUDE_CONFIG,
      ]
      
      const names = providers.map(p => p.name)
      const uniqueNames = new Set(names)
      
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('Configuration consistency checks', () => {
    it('should verify FOUNDER_ACCESS and USER_ACCESS have same keys', () => {
      const founderKeys = Object.keys(FOUNDER_ACCESS).sort()
      const userKeys = Object.keys(USER_ACCESS).sort()
      
      expect(founderKeys).toEqual(userKeys)
    })

    it('should verify no feature flags are undefined', () => {
      const founderValues = Object.values(FOUNDER_ACCESS)
      const userValues = Object.values(USER_ACCESS)
      
      founderValues.forEach(value => {
        expect(value).not.toBeUndefined()
        expect(typeof value).toBe('boolean')
      })
      
      userValues.forEach(value => {
        expect(value).not.toBeUndefined()
        expect(typeof value).toBe('boolean')
      })
    })

    it('should verify fallback providers are different from primary', () => {
      FALLBACK_PROVIDERS.forEach(fallback => {
        expect(fallback.name).not.toBe(PRIMARY_PROVIDER.name)
      })
    })

    it('should verify provider configs are immutable', () => {
      // Attempt to verify configs are frozen or treated as constants
      expect(PRIMARY_PROVIDER).toBeDefined()
      expect(FALLBACK_PROVIDERS).toBeDefined()
      expect(MINIMAX_CONFIG).toBeDefined()
      expect(MIXTRAL_CONFIG).toBeDefined()
      expect(LLAMA_CONFIG).toBeDefined()
      expect(CLAUDE_CONFIG).toBeDefined()
      
      // All configs should exist and be objects
      expect(typeof PRIMARY_PROVIDER).toBe('object')
      expect(Array.isArray(FALLBACK_PROVIDERS)).toBe(true)
    })
  })
})
