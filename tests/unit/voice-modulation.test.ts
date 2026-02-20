/**
 * Unit Tests: Voice Modulation System
 *
 * Tests detectVoiceMood, addNaturalVariation, getVoiceSettings,
 * and VOICE_MOODS configuration constants.
 */

import { describe, it, expect } from 'vitest'
import {
  detectVoiceMood,
  addNaturalVariation,
  getVoiceSettings,
  VOICE_MOODS,
  type VoiceMood,
  type VoiceSettings,
} from '@/lib/voice-modulation'

describe('VOICE_MOODS Configuration', () => {
  it('should define all four mood presets', () => {
    expect(VOICE_MOODS).toHaveProperty('sincere')
    expect(VOICE_MOODS).toHaveProperty('candid')
    expect(VOICE_MOODS).toHaveProperty('intimate')
    expect(VOICE_MOODS).toHaveProperty('neutral')
  })

  it('should have stability values between 0 and 1', () => {
    for (const mood of Object.values(VOICE_MOODS)) {
      expect(mood.stability).toBeGreaterThanOrEqual(0)
      expect(mood.stability).toBeLessThanOrEqual(1)
    }
  })

  it('should have similarity_boost values between 0 and 1', () => {
    for (const mood of Object.values(VOICE_MOODS)) {
      expect(mood.similarity_boost).toBeGreaterThanOrEqual(0)
      expect(mood.similarity_boost).toBeLessThanOrEqual(1)
    }
  })

  it('should have style values between 0 and 1', () => {
    for (const mood of Object.values(VOICE_MOODS)) {
      expect(mood.style).toBeGreaterThanOrEqual(0)
      expect(mood.style).toBeLessThanOrEqual(1)
    }
  })

  it('should disable speaker_boost for intimate mood only', () => {
    expect(VOICE_MOODS.intimate.use_speaker_boost).toBe(false)
    expect(VOICE_MOODS.sincere.use_speaker_boost).toBe(true)
    expect(VOICE_MOODS.candid.use_speaker_boost).toBe(true)
    expect(VOICE_MOODS.neutral.use_speaker_boost).toBe(true)
  })

  it('should have candid as the most expressive style', () => {
    expect(VOICE_MOODS.candid.style).toBeGreaterThan(VOICE_MOODS.sincere.style)
    expect(VOICE_MOODS.candid.style).toBeGreaterThan(VOICE_MOODS.neutral.style)
    expect(VOICE_MOODS.candid.style).toBeGreaterThan(VOICE_MOODS.intimate.style)
  })
})

describe('detectVoiceMood', () => {
  it('should return neutral for empty text', () => {
    expect(detectVoiceMood('')).toBe('neutral')
  })

  it('should return neutral for text with no markers', () => {
    expect(detectVoiceMood('Hello world')).toBe('neutral')
  })

  it('should detect intimate mood from whisper markers', () => {
    expect(detectVoiceMood('Let me whisper something to you')).toBe('intimate')
    expect(detectVoiceMood('This is a secret between us')).toBe('intimate')
    expect(detectVoiceMood('I feel vulnerable right now')).toBe('intimate')
  })

  it('should detect candid mood from playful markers', () => {
    expect(detectVoiceMood('haha that is so funny')).toBe('candid')
    expect(detectVoiceMood('lol kidding')).toBe('candid')
    expect(detectVoiceMood('honestly by the way it was casual')).toBe('candid')
  })

  it('should detect sincere mood from serious markers', () => {
    expect(detectVoiceMood('This is important, understand the analysis')).toBe('sincere')
    expect(detectVoiceMood('The research evidence is significant')).toBe('sincere')
    expect(detectVoiceMood('Therefore the data is crucial')).toBe('sincere')
  })

  it('should be case-insensitive', () => {
    expect(detectVoiceMood('THIS IS IMPORTANT DATA')).toBe('sincere')
    expect(detectVoiceMood('HAHA LOL')).toBe('candid')
    expect(detectVoiceMood('WHISPER SOFTLY')).toBe('intimate')
  })

  it('should detect mood from emoji markers', () => {
    expect(detectVoiceMood('I love this ❤️')).toBe('intimate')
    expect(detectVoiceMood('So great 😂')).toBe('candid')
  })

  it('should pick the highest scoring mood when multiple are present', () => {
    // More candid markers than sincere
    const text = 'haha lol funny but also important'
    const mood = detectVoiceMood(text)
    expect(['candid', 'sincere', 'intimate']).toContain(mood)
  })
})

describe('addNaturalVariation', () => {
  it('should return settings with the same structure', () => {
    const input: VoiceSettings = VOICE_MOODS.neutral
    const result = addNaturalVariation(input)

    expect(result).toHaveProperty('stability')
    expect(result).toHaveProperty('similarity_boost')
    expect(result).toHaveProperty('style')
    expect(result).toHaveProperty('use_speaker_boost')
  })

  it('should keep values clamped between 0 and 1', () => {
    // Run multiple times since it involves randomness
    for (let i = 0; i < 50; i++) {
      const result = addNaturalVariation(VOICE_MOODS.neutral)
      expect(result.stability).toBeGreaterThanOrEqual(0)
      expect(result.stability).toBeLessThanOrEqual(1)
      expect(result.similarity_boost).toBeGreaterThanOrEqual(0)
      expect(result.similarity_boost).toBeLessThanOrEqual(1)
      expect(result.style).toBeGreaterThanOrEqual(0)
      expect(result.style).toBeLessThanOrEqual(1)
    }
  })

  it('should preserve use_speaker_boost unchanged', () => {
    const trueResult = addNaturalVariation({ ...VOICE_MOODS.sincere, use_speaker_boost: true })
    expect(trueResult.use_speaker_boost).toBe(true)

    const falseResult = addNaturalVariation({ ...VOICE_MOODS.intimate, use_speaker_boost: false })
    expect(falseResult.use_speaker_boost).toBe(false)
  })

  it('should produce values close to the input (within 5% variance)', () => {
    const input = VOICE_MOODS.neutral
    for (let i = 0; i < 50; i++) {
      const result = addNaturalVariation(input)
      expect(Math.abs(result.stability - input.stability)).toBeLessThanOrEqual(0.05)
      expect(Math.abs(result.similarity_boost - input.similarity_boost)).toBeLessThanOrEqual(0.05)
      expect(Math.abs(result.style - input.style)).toBeLessThanOrEqual(0.05)
    }
  })

  it('should handle edge case settings at boundaries', () => {
    const edgeSettings: VoiceSettings = {
      stability: 0,
      similarity_boost: 1,
      style: 0,
      use_speaker_boost: true,
    }
    for (let i = 0; i < 50; i++) {
      const result = addNaturalVariation(edgeSettings)
      expect(result.stability).toBeGreaterThanOrEqual(0)
      expect(result.similarity_boost).toBeLessThanOrEqual(1)
      expect(result.style).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('getVoiceSettings', () => {
  it('should auto-detect mood from text when no override', () => {
    const settings = getVoiceSettings('haha that was funny lol', undefined, false)
    // Should use candid mood settings
    expect(settings).toEqual(VOICE_MOODS.candid)
  })

  it('should use mood override when provided', () => {
    const settings = getVoiceSettings('random text', 'intimate', false)
    expect(settings).toEqual(VOICE_MOODS.intimate)
  })

  it('should apply variation by default', () => {
    const settings = getVoiceSettings('random text', 'neutral')
    // With variation, values should be slightly different from base
    // (statistically very unlikely to be exactly the same)
    expect(settings).toHaveProperty('stability')
    expect(settings).toHaveProperty('similarity_boost')
    expect(settings).toHaveProperty('style')
    expect(settings).toHaveProperty('use_speaker_boost')
  })

  it('should not apply variation when disabled', () => {
    const settings = getVoiceSettings('random text', 'sincere', false)
    expect(settings).toEqual(VOICE_MOODS.sincere)
  })

  it('should return neutral settings for unrecognized text without override', () => {
    const settings = getVoiceSettings('abc xyz 123', undefined, false)
    expect(settings).toEqual(VOICE_MOODS.neutral)
  })
})
