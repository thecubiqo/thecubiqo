/**
 * Region Configuration Tests
 *
 * Validates region config system: types, prompt building, greeting logic.
 * Relevant to multi-region support used by chat API.
 */

import { describe, it, expect } from 'vitest'
import {
  buildRegionalPrompt,
  getGreeting,
  type RegionConfig,
} from '@/lib/config/regions'

// Mock region config for testing
const mockUKConfig: RegionConfig = {
  id: 'uk',
  countryCode: 'GB',
  name: 'United Kingdom',
  locale: 'en-GB',
  routing: {
    path: '/uk',
    domain: null,
    defaultRoute: 'main',
    mainEnabled: true,
    regionalEnabled: true,
  },
  localization: {
    timezone: 'Europe/London',
    currency: 'GBP',
    dateFormat: 'DD/MM/YYYY',
    dialects: ['British English'],
  },
  cultural: {
    festivals: [
      { name: 'Christmas', date: '12-25', type: 'cultural' },
      { name: 'Easter', date: 'variable', type: 'religious' },
    ],
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    references: ['tea', 'football'],
  },
  appearance: {
    defaultColor: 'ORANGE',
    performanceMode: 'full',
    theme: 'dark',
  },
  features: {
    voice: true,
    chat: true,
    memory: true,
    auth: true,
  },
  ai: {
    systemPromptAdditions: 'Use British spelling.',
    toneModifiers: ['warm', 'polite'],
  },
}

describe('buildRegionalPrompt', () => {
  it('should include country name', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('United Kingdom')
  })

  it('should include country code', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('GB')
  })

  it('should include timezone', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('Europe/London')
  })

  it('should include dialect instruction', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('British English')
  })

  it('should include AI system prompt additions', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('Use British spelling.')
  })

  it('should include tone modifiers', () => {
    const prompt = buildRegionalPrompt(mockUKConfig)
    expect(prompt).toContain('warm')
    expect(prompt).toContain('polite')
  })

  it('should handle empty dialects', () => {
    const noDialect = {
      ...mockUKConfig,
      localization: { ...mockUKConfig.localization, dialects: [] },
    }
    const prompt = buildRegionalPrompt(noDialect)
    expect(prompt).not.toContain('dialect')
  })

  it('should handle empty tone modifiers', () => {
    const noTone = {
      ...mockUKConfig,
      ai: { ...mockUKConfig.ai, toneModifiers: [] },
    }
    const prompt = buildRegionalPrompt(noTone)
    expect(prompt).not.toContain('Tone:')
  })

  it('should handle empty system prompt additions', () => {
    const noAdditions = {
      ...mockUKConfig,
      ai: { ...mockUKConfig.ai, systemPromptAdditions: '' },
    }
    const prompt = buildRegionalPrompt(noAdditions)
    expect(prompt).not.toContain('Use British spelling.')
  })
})

describe('getGreeting', () => {
  it('should return a greeting string', () => {
    const greeting = getGreeting(mockUKConfig)
    expect(typeof greeting).toBe('string')
    expect(greeting.length).toBeGreaterThan(0)
  })

  it('should return one of morning/afternoon/evening greetings', () => {
    const greeting = getGreeting(mockUKConfig)
    const validGreetings = [
      mockUKConfig.cultural.greetings.morning,
      mockUKConfig.cultural.greetings.afternoon,
      mockUKConfig.cultural.greetings.evening,
    ]
    expect(validGreetings).toContain(greeting)
  })
})

describe('RegionConfig Type Structure', () => {
  it('should have required routing fields', () => {
    expect(mockUKConfig.routing).toHaveProperty('path')
    expect(mockUKConfig.routing).toHaveProperty('domain')
    expect(mockUKConfig.routing).toHaveProperty('defaultRoute')
    expect(mockUKConfig.routing).toHaveProperty('mainEnabled')
    expect(mockUKConfig.routing).toHaveProperty('regionalEnabled')
  })

  it('should have required localization fields', () => {
    expect(mockUKConfig.localization).toHaveProperty('timezone')
    expect(mockUKConfig.localization).toHaveProperty('currency')
    expect(mockUKConfig.localization).toHaveProperty('dateFormat')
    expect(mockUKConfig.localization).toHaveProperty('dialects')
  })

  it('should have required feature flags', () => {
    expect(mockUKConfig.features).toHaveProperty('voice')
    expect(mockUKConfig.features).toHaveProperty('chat')
    expect(mockUKConfig.features).toHaveProperty('memory')
    expect(mockUKConfig.features).toHaveProperty('auth')
  })

  it('should have required appearance settings', () => {
    expect(mockUKConfig.appearance).toHaveProperty('defaultColor')
    expect(mockUKConfig.appearance).toHaveProperty('performanceMode')
    expect(mockUKConfig.appearance).toHaveProperty('theme')
  })

  it('should have valid defaultColor value', () => {
    const validColors = ['ORANGE', 'RED', 'YELLOW', 'GREEN_BLUE']
    expect(validColors).toContain(mockUKConfig.appearance.defaultColor)
  })

  it('should have valid performanceMode', () => {
    const validModes = ['full', 'reduced']
    expect(validModes).toContain(mockUKConfig.appearance.performanceMode)
  })

  it('should have valid theme', () => {
    const validThemes = ['dark', 'light', 'system']
    expect(validThemes).toContain(mockUKConfig.appearance.theme)
  })
})

describe('Middleware Integration', () => {
  it('should have middleware.ts file at project root src/', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    expect(require('fs').existsSync(middlewarePath)).toBe(true)
  })

  it('middleware should use createServerClient from @supabase/ssr', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    const content = require('fs').readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain("import { createServerClient } from '@supabase/ssr'")
  })

  it('middleware should refresh session on every request', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    const content = require('fs').readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain('await supabase.auth.getUser()')
  })

  it('middleware should exclude static files from processing', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    const content = require('fs').readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain('_next/static')
    expect(content).toContain('_next/image')
    expect(content).toContain('favicon.ico')
  })

  it('middleware should support legacy env var names', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    const content = require('fs').readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL1')
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY1')
  })

  it('middleware should handle cookies for session management', () => {
    const middlewarePath = require('path').resolve(__dirname, '../src/middleware.ts')
    const content = require('fs').readFileSync(middlewarePath, 'utf-8')
    expect(content).toContain('getAll()')
    expect(content).toContain('setAll(cookiesToSet)')
  })
})
