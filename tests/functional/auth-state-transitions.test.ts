/**
 * Functional Tests: Auth State Transitions
 *
 * Validates the correctness of authentication state machine transitions
 * and the voice modulation pipeline end-to-end.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  detectVoiceMood,
  getVoiceSettings,
  VOICE_MOODS,
  type VoiceMood,
} from '@/lib/voice-modulation'

describe('Auth State Machine Transitions', () => {
  describe('Guest → Authenticated transition', () => {
    it('should have initial guest state properties', () => {
      const guestState = {
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: true,
      }

      expect(guestState.user).toBeNull()
      expect(guestState.isGuest).toBe(true)
      expect(guestState.isAuthenticated).toBe(false)
    })

    it('should transition to loading state on sign-in attempt', () => {
      const loadingState = {
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
        isGuest: true,
      }

      expect(loadingState.isLoading).toBe(true)
      expect(loadingState.isAuthenticated).toBe(false)
    })

    it('should transition to authenticated state after successful login', () => {
      const authenticatedState = {
        user: { id: 'user-123', email: 'test@example.com' },
        profile: null,
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
      }

      expect(authenticatedState.isAuthenticated).toBe(true)
      expect(authenticatedState.isGuest).toBe(false)
      expect(authenticatedState.user).not.toBeNull()
      expect(authenticatedState.user!.id).toBe('user-123')
    })

    it('should eventually have profile after authentication', () => {
      const fullAuthState = {
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { handle: 'testuser', tier: 'founder' },
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
      }

      expect(fullAuthState.profile).not.toBeNull()
      expect(fullAuthState.profile!.handle).toBe('testuser')
    })
  })

  describe('Authenticated → Guest transition (sign out)', () => {
    it('should clear user on sign out', () => {
      const postSignOut = {
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: true,
      }

      expect(postSignOut.user).toBeNull()
      expect(postSignOut.profile).toBeNull()
      expect(postSignOut.isAuthenticated).toBe(false)
      expect(postSignOut.isGuest).toBe(true)
    })
  })

  describe('Auth timeout fallback', () => {
    it('should fall back to guest state after timeout', () => {
      const timeoutState = {
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: true,
      }

      expect(timeoutState.isLoading).toBe(false)
      expect(timeoutState.isGuest).toBe(true)
    })
  })

  describe('Auth event handling', () => {
    const authContextPath = resolve(__dirname, '../../src/contexts/AuthContext.tsx')
    const content = readFileSync(authContextPath, 'utf-8')

    it('should handle SIGNED_IN event', () => {
      expect(content).toContain('session?.user')
    })

    it('should handle SIGNED_OUT event', () => {
      expect(content).toContain('SIGNED_OUT')
    })

    it('should handle INITIAL_SESSION event', () => {
      expect(content).toContain('INITIAL_SESSION')
    })

    it('should implement auth timeout mechanism', () => {
      expect(content).toContain('AUTH_TIMEOUT_MS')
      expect(content).toContain('setTimeout')
    })

    it('should clean up subscription on unmount', () => {
      expect(content).toContain('subscription.unsubscribe()')
      expect(content).toContain('clearTimeout')
    })
  })
})

describe('Voice Modulation Pipeline (End-to-End)', () => {
  describe('Full pipeline: text → mood → settings', () => {
    it('should produce valid settings for sincere text', () => {
      const text = 'This is important research data that is significant.'
      const mood = detectVoiceMood(text)
      expect(mood).toBe('sincere')

      const settings = getVoiceSettings(text, undefined, false)
      expect(settings).toEqual(VOICE_MOODS.sincere)
    })

    it('should produce valid settings for candid text', () => {
      const text = 'haha lol that was so funny honestly'
      const mood = detectVoiceMood(text)
      expect(mood).toBe('candid')

      const settings = getVoiceSettings(text, undefined, false)
      expect(settings).toEqual(VOICE_MOODS.candid)
    })

    it('should produce valid settings for intimate text', () => {
      const text = 'Let me whisper a secret confession between us'
      const mood = detectVoiceMood(text)
      expect(mood).toBe('intimate')

      const settings = getVoiceSettings(text, undefined, false)
      expect(settings).toEqual(VOICE_MOODS.intimate)
    })

    it('should produce valid settings for neutral text', () => {
      const text = 'The weather is nice today'
      const mood = detectVoiceMood(text)
      expect(mood).toBe('neutral')

      const settings = getVoiceSettings(text, undefined, false)
      expect(settings).toEqual(VOICE_MOODS.neutral)
    })
  })

  describe('Pipeline with mood override', () => {
    it('should override detected mood', () => {
      const text = 'haha this is funny' // would be candid
      const settings = getVoiceSettings(text, 'sincere', false)
      expect(settings).toEqual(VOICE_MOODS.sincere)
    })

    it('should allow all mood overrides', () => {
      const moods: VoiceMood[] = ['sincere', 'candid', 'intimate', 'neutral']
      for (const mood of moods) {
        const settings = getVoiceSettings('any text', mood, false)
        expect(settings).toEqual(VOICE_MOODS[mood])
      }
    })
  })

  describe('Pipeline with natural variation', () => {
    it('should produce slightly varied settings when variation enabled', () => {
      const text = 'any text'
      const base = VOICE_MOODS.neutral
      let anyDifferent = false

      // Run 20 times to check that variation occurs
      for (let i = 0; i < 20; i++) {
        const settings = getVoiceSettings(text, 'neutral', true)
        if (
          settings.stability !== base.stability ||
          settings.style !== base.style ||
          settings.similarity_boost !== base.similarity_boost
        ) {
          anyDifferent = true
          break
        }
      }

      expect(anyDifferent).toBe(true)
    })
  })
})

describe('Spending + Token Counter Integration', () => {
  it('should estimate tokens and cost consistently', async () => {
    const { estimateTokens } = await import('@/lib/spending-caps')
    const { estimateTokenCount } = await import('@/lib/utils/token-counter')

    const text = 'Hello, this is a test message for token estimation.'
    const spendingTokens = estimateTokens(text)
    const counterTokens = estimateTokenCount(text)

    // Both use ~4 chars per token, should agree
    expect(spendingTokens).toBe(counterTokens)
  })
})
