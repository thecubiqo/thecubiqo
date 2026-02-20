/**
 * Unit Tests: Spending Caps
 *
 * Tests spending cap checking, recording, cost estimation,
 * token estimation, and status reporting.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SPENDING_CAPS,
  COST_PER_UNIT,
  checkSpendingCap,
  recordSpending,
  estimateAnthropicCost,
  estimateElevenLabsCost,
  estimateTokens,
  getSpendingStatus,
  resetSpending,
} from '@/lib/spending-caps'

describe('SPENDING_CAPS constants', () => {
  it('should define cap for anthropic', () => {
    expect(SPENDING_CAPS.anthropic).toBe(200)
  })

  it('should define cap for elevenlabs', () => {
    expect(SPENDING_CAPS.elevenlabs).toBe(200)
  })
})

describe('COST_PER_UNIT constants', () => {
  it('should define anthropic input cost per token', () => {
    expect(COST_PER_UNIT.anthropic_input).toBe(0.000015)
  })

  it('should define anthropic output cost per token', () => {
    expect(COST_PER_UNIT.anthropic_output).toBe(0.000075)
  })

  it('should define elevenlabs cost per character', () => {
    expect(COST_PER_UNIT.elevenlabs_char).toBe(0.0003)
  })
})

describe('estimateAnthropicCost', () => {
  it('should return 0 for zero tokens', () => {
    expect(estimateAnthropicCost(0, 0)).toBe(0)
  })

  it('should estimate cost for input tokens only', () => {
    const cost = estimateAnthropicCost(1000, 0)
    expect(cost).toBeCloseTo(0.015, 4) // 1000 * 0.000015
  })

  it('should estimate cost for output tokens only', () => {
    const cost = estimateAnthropicCost(0, 1000)
    expect(cost).toBeCloseTo(0.075, 4) // 1000 * 0.000075
  })

  it('should combine input and output costs', () => {
    const cost = estimateAnthropicCost(1000, 1000)
    expect(cost).toBeCloseTo(0.09, 4) // 0.015 + 0.075
  })

  it('should estimate $15 per 1M input tokens', () => {
    const cost = estimateAnthropicCost(1_000_000, 0)
    expect(cost).toBeCloseTo(15, 0)
  })

  it('should estimate $75 per 1M output tokens', () => {
    const cost = estimateAnthropicCost(0, 1_000_000)
    expect(cost).toBeCloseTo(75, 0)
  })
})

describe('estimateElevenLabsCost', () => {
  it('should return 0 for zero characters', () => {
    expect(estimateElevenLabsCost(0)).toBe(0)
  })

  it('should estimate cost for 1000 characters', () => {
    const cost = estimateElevenLabsCost(1000)
    expect(cost).toBeCloseTo(0.3, 2) // 1000 * 0.0003
  })

  it('should scale linearly', () => {
    const cost1 = estimateElevenLabsCost(500)
    const cost2 = estimateElevenLabsCost(1000)
    expect(cost2).toBeCloseTo(cost1 * 2, 4)
  })
})

describe('estimateTokens', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('should estimate ~1 token per 4 chars', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('abcdefgh')).toBe(2)
  })

  it('should round up partial tokens', () => {
    expect(estimateTokens('ab')).toBe(1)
    expect(estimateTokens('abcde')).toBe(2)
  })
})

describe('checkSpendingCap', () => {
  beforeEach(() => {
    resetSpending()
  })

  it('should allow spending when under cap', () => {
    const result = checkSpendingCap('anthropic')
    expect(result.allowed).toBe(true)
    expect(result.currentSpend).toBe(0)
    expect(result.cap).toBe(200)
    expect(result.remaining).toBe(200)
  })

  it('should block spending when at cap', () => {
    recordSpending('anthropic', 200)
    const result = checkSpendingCap('anthropic')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should track remaining budget correctly', () => {
    recordSpending('elevenlabs', 50)
    const result = checkSpendingCap('elevenlabs')
    expect(result.allowed).toBe(true)
    expect(result.currentSpend).toBe(50)
    expect(result.remaining).toBe(150)
  })
})

describe('recordSpending', () => {
  beforeEach(() => {
    resetSpending()
  })

  it('should accumulate spending', () => {
    recordSpending('anthropic', 10)
    recordSpending('anthropic', 20)
    const result = checkSpendingCap('anthropic')
    expect(result.currentSpend).toBe(30)
  })

  it('should track providers independently', () => {
    recordSpending('anthropic', 50)
    recordSpending('elevenlabs', 30)

    expect(checkSpendingCap('anthropic').currentSpend).toBe(50)
    expect(checkSpendingCap('elevenlabs').currentSpend).toBe(30)
  })
})

describe('getSpendingStatus', () => {
  beforeEach(() => {
    resetSpending()
  })

  it('should return status for all providers', () => {
    const status = getSpendingStatus()
    expect(status).toHaveProperty('anthropic')
    expect(status).toHaveProperty('elevenlabs')
  })

  it('should show zero spending initially', () => {
    const status = getSpendingStatus()
    expect(status.anthropic.spent).toBe(0)
    expect(status.anthropic.cap).toBe(200)
    expect(status.anthropic.remaining).toBe(200)
    expect(status.anthropic.percentUsed).toBe(0)
  })

  it('should calculate percentUsed correctly', () => {
    recordSpending('anthropic', 100) // 50% of $200
    const status = getSpendingStatus()
    expect(status.anthropic.percentUsed).toBe(50)
  })

  it('should update after spending is recorded', () => {
    recordSpending('elevenlabs', 75)
    const status = getSpendingStatus()
    expect(status.elevenlabs.spent).toBe(75)
    expect(status.elevenlabs.remaining).toBe(125)
  })
})

describe('resetSpending', () => {
  beforeEach(() => {
    resetSpending()
  })

  it('should reset a specific provider', () => {
    recordSpending('anthropic', 100)
    recordSpending('elevenlabs', 50)
    resetSpending('anthropic')

    expect(checkSpendingCap('anthropic').currentSpend).toBe(0)
    expect(checkSpendingCap('elevenlabs').currentSpend).toBe(50)
  })

  it('should reset all providers when no argument given', () => {
    recordSpending('anthropic', 100)
    recordSpending('elevenlabs', 50)
    resetSpending()

    expect(checkSpendingCap('anthropic').currentSpend).toBe(0)
    expect(checkSpendingCap('elevenlabs').currentSpend).toBe(0)
  })
})
