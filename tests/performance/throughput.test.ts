/**
 * Performance Tests: Throughput and Timing
 *
 * Validates that core utility functions execute within acceptable time budgets
 * under realistic workloads.
 */

import { describe, it, expect } from 'vitest'
import {
  estimateTokenCount,
  countConversationTokens,
  shouldCompact,
} from '@/lib/utils/token-counter'
import {
  detectVoiceMood,
  addNaturalVariation,
  getVoiceSettings,
  VOICE_MOODS,
} from '@/lib/voice-modulation'
import {
  checkSpendingCap,
  recordSpending,
  getSpendingStatus,
  resetSpending,
  estimateAnthropicCost,
} from '@/lib/spending-caps'

describe('Token Counter Performance', () => {
  it('should estimate tokens for 10,000 chars in under 10ms', () => {
    const text = 'a'.repeat(10_000)
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      estimateTokenCount(text)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100) // 1000 iterations in under 100ms
  })

  it('should count conversation tokens for 100 messages in under 50ms', () => {
    const messages = Array.from({ length: 100 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `This is message number ${i} with some reasonable content length for testing purposes.`,
    }))
    const start = performance.now()
    countConversationTokens(messages)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })

  it('should check shouldCompact 10,000 times in under 50ms', () => {
    const start = performance.now()
    for (let i = 0; i < 10_000; i++) {
      shouldCompact(i * 10, 'gpt-4')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })
})

describe('Voice Modulation Performance', () => {
  it('should detect mood for a paragraph in under 5ms', () => {
    const paragraph =
      'This is an important analysis of the research data. The evidence is significant and crucial. ' +
      'However, let me also say haha that is quite funny honestly. ' +
      'Between us, I feel vulnerable sharing this secret confession.'

    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      detectVoiceMood(paragraph)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500) // 1000 iterations in under 500ms
  })

  it('should apply natural variation 10,000 times in under 100ms', () => {
    const settings = VOICE_MOODS.neutral
    const start = performance.now()
    for (let i = 0; i < 10_000; i++) {
      addNaturalVariation(settings)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  it('should get voice settings end-to-end 1,000 times in under 200ms', () => {
    const text = 'This is important research data that is crucial to understand.'
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      getVoiceSettings(text)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
  })
})

describe('Spending Caps Performance', () => {
  it('should check spending cap 10,000 times in under 50ms', () => {
    resetSpending()
    const start = performance.now()
    for (let i = 0; i < 10_000; i++) {
      checkSpendingCap('anthropic')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })

  it('should record and check spending 5,000 times in under 100ms', () => {
    resetSpending()
    const start = performance.now()
    for (let i = 0; i < 5_000; i++) {
      recordSpending('anthropic', 0.001)
      checkSpendingCap('anthropic')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
    resetSpending()
  })

  it('should estimate anthropic cost 100,000 times in under 50ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100_000; i++) {
      estimateAnthropicCost(1000, 500)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })

  it('should get spending status 10,000 times in under 100ms', () => {
    resetSpending()
    const start = performance.now()
    for (let i = 0; i < 10_000; i++) {
      getSpendingStatus()
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })
})
