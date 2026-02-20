/**
 * Conversion Strategy & Voice Promotion Tests
 * 
 * Validates the persuasive conversion strategy and voice promotion modules:
 * - Conversion funnel stages
 * - Trigger detection
 * - Voice adoption classification
 * - Prompt generation
 */

import { describe, it, expect } from 'vitest'
import {
  getVoiceAdoptionStage,
  getVoicePromotionHint,
  buildVoicePromotionContext,
} from '@/lib/conversion/voice-promotion'
import {
  getConversionStage,
  detectConversionTriggers,
  getConversionPrompt,
  buildConversionContext,
} from '@/lib/conversion/conversion-strategy'

describe('Voice Promotion', () => {
  it('should classify voice adoption stages correctly', () => {
    expect(getVoiceAdoptionStage(10, 0)).toBe('never_used')
    expect(getVoiceAdoptionStage(10, 1)).toBe('tried_once')
    expect(getVoiceAdoptionStage(10, 2)).toBe('tried_once')
    expect(getVoiceAdoptionStage(20, 5)).toBe('occasional')
    expect(getVoiceAdoptionStage(20, 10)).toBe('regular')
    expect(getVoiceAdoptionStage(20, 15)).toBe('voice_native')
    expect(getVoiceAdoptionStage(20, 18)).toBe('voice_native')
  })

  it('should not promote voice too early', () => {
    const hint = getVoicePromotionHint('never_used', 1)
    expect(hint).toBeNull()
  })

  it('should not promote to regular voice users', () => {
    const hint = getVoicePromotionHint('regular', 10)
    expect(hint).toBeNull()
  })

  it('should not promote to voice native users', () => {
    const hint = getVoicePromotionHint('voice_native', 10)
    expect(hint).toBeNull()
  })

  it('should return a promotion hint at the right interval', () => {
    // At message 5, interval 5 for never_used
    const hint = getVoicePromotionHint('never_used', 5)
    expect(hint).not.toBeNull()
    expect(typeof hint).toBe('string')
  })

  it('should build voice promotion context for never_used stage', () => {
    const context = buildVoicePromotionContext('never_used', 0.1)
    expect(context).toContain('VOICE ENCOURAGEMENT')
    expect(context).toContain('not tried voice')
  })

  it('should build voice status context for regular users', () => {
    const context = buildVoicePromotionContext('regular', 0.8)
    expect(context).toContain('VOICE STATUS')
    expect(context).toContain('loves voice')
  })

  it('should return empty context for occasional users with moderate voice preference', () => {
    const context = buildVoicePromotionContext('occasional', 0.5)
    expect(context).toBe('')
  })
})

describe('Conversion Strategy', () => {
  it('should classify conversion stages correctly', () => {
    expect(getConversionStage(1)).toBe('discovery')
    expect(getConversionStage(3)).toBe('discovery')
    expect(getConversionStage(5)).toBe('connection')
    expect(getConversionStage(7)).toBe('connection')
    expect(getConversionStage(10)).toBe('investment')
    expect(getConversionStage(12)).toBe('investment')
    expect(getConversionStage(15)).toBe('commitment')
  })

  it('should detect emotional sharing triggers', () => {
    const triggers = detectConversionTriggers(
      'I feel really lonely today',
      'I hear you.',
      5
    )
    expect(triggers).toContain('emotional_sharing')
  })

  it('should detect value demonstration triggers', () => {
    const triggers = detectConversionTriggers(
      'thank you, that was really helpful!',
      'Glad to help.',
      5
    )
    expect(triggers).toContain('value_demonstration')
  })

  it('should detect memory moment triggers', () => {
    const triggers = detectConversionTriggers(
      'Do you remember?',
      'Earlier you mentioned something about your project.',
      5
    )
    expect(triggers).toContain('memory_moment')
  })

  it('should detect milestone triggers', () => {
    const triggers = detectConversionTriggers('hey', 'hello', 5)
    expect(triggers).toContain('milestone')

    const triggers10 = detectConversionTriggers('hey', 'hello', 10)
    expect(triggers10).toContain('milestone')
  })

  it('should not push conversion during discovery stage', () => {
    const prompt = getConversionPrompt('discovery', true, [])
    expect(prompt).toBe('')
  })

  it('should not push conversion for authenticated users', () => {
    const prompt = getConversionPrompt('investment', false, [])
    expect(prompt).toBe('')
  })

  it('should provide soft conversion prompt during connection stage', () => {
    const prompt = getConversionPrompt('connection', true, [])
    expect(prompt).toContain('CONVERSION CONTEXT')
    expect(prompt).toContain('soft')
  })

  it('should provide medium conversion prompt during investment stage', () => {
    const prompt = getConversionPrompt('investment', true, [])
    expect(prompt).toContain('CONVERSION CONTEXT')
    expect(prompt).toContain('medium')
  })

  it('should provide strong conversion prompt during commitment stage', () => {
    const prompt = getConversionPrompt('commitment', true, [])
    expect(prompt).toContain('CONVERSION CONTEXT')
    expect(prompt).toContain('strong')
  })

  it('should amplify conversion prompt with emotional trigger', () => {
    const promptWithout = getConversionPrompt('investment', true, [])
    const promptWith = getConversionPrompt('investment', true, ['emotional_sharing'])
    expect(promptWith.length).toBeGreaterThan(promptWithout.length)
    expect(promptWith).toContain('EMOTIONAL MOMENT')
  })

  it('should build full conversion context for guest users', () => {
    const context = buildConversionContext(true, 10, 'I feel grateful', 'response')
    expect(context).toContain('CONVERSION CONTEXT')
  })

  it('should return empty context for authenticated users', () => {
    const context = buildConversionContext(false, 10, 'hello', 'response')
    expect(context).toBe('')
  })

  it('should return empty context during discovery', () => {
    const context = buildConversionContext(true, 2, 'hello', 'response')
    expect(context).toBe('')
  })
})
