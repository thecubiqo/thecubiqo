/**
 * Spending Caps Dependency Tests
 *
 * Validates cost tracking, cap enforcement, estimation helpers,
 * and monthly reset logic for AI API spending.
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

describe('Spending Caps Constants', () => {
  it('should define anthropic cap at $200', () => {
    expect(SPENDING_CAPS.anthropic).toBe(200)
  })

  it('should define elevenlabs cap at $200', () => {
    expect(SPENDING_CAPS.elevenlabs).toBe(200)
  })

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
    recordSpending('anthropic', 50)
    const result = checkSpendingCap('anthropic')
    expect(result.allowed).toBe(true)
    expect(result.currentSpend).toBe(50)
    expect(result.remaining).toBe(150)
  })

  it('should work independently for different providers', () => {
    recordSpending('anthropic', 100)
    const anthropic = checkSpendingCap('anthropic')
    const elevenlabs = checkSpendingCap('elevenlabs')
    expect(anthropic.currentSpend).toBe(100)
    expect(elevenlabs.currentSpend).toBe(0)
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

  it('should track elevenlabs spending separately', () => {
    recordSpending('elevenlabs', 15)
    const result = checkSpendingCap('elevenlabs')
    expect(result.currentSpend).toBe(15)
  })
})

describe('estimateAnthropicCost', () => {
  it('should calculate cost for input and output tokens', () => {
    const cost = estimateAnthropicCost(1000, 500)
    const expected =
      1000 * COST_PER_UNIT.anthropic_input +
      500 * COST_PER_UNIT.anthropic_output
    expect(cost).toBeCloseTo(expected)
  })

  it('should return 0 for zero tokens', () => {
    expect(estimateAnthropicCost(0, 0)).toBe(0)
  })

  it('should handle large token counts', () => {
    const cost = estimateAnthropicCost(1000000, 100000)
    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(SPENDING_CAPS.anthropic)
  })
})

describe('estimateElevenLabsCost', () => {
  it('should calculate cost for character count', () => {
    const cost = estimateElevenLabsCost(1000)
    expect(cost).toBeCloseTo(0.3)
  })

  it('should return 0 for zero characters', () => {
    expect(estimateElevenLabsCost(0)).toBe(0)
  })
})

describe('estimateTokens', () => {
  it('should estimate ~1 token per 4 characters', () => {
    expect(estimateTokens('abcd')).toBe(1)
  })

  it('should round up partial tokens', () => {
    expect(estimateTokens('abc')).toBe(1) // ceil(3/4) = 1
    expect(estimateTokens('abcde')).toBe(2) // ceil(5/4) = 2
  })

  it('should handle empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('should handle long text', () => {
    const longText = 'a'.repeat(1000)
    expect(estimateTokens(longText)).toBe(250)
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

  it('should show 0% used when no spending', () => {
    const status = getSpendingStatus()
    expect(status.anthropic.percentUsed).toBe(0)
    expect(status.elevenlabs.percentUsed).toBe(0)
  })

  it('should calculate percentUsed correctly', () => {
    recordSpending('anthropic', 50)
    const status = getSpendingStatus()
    expect(status.anthropic.percentUsed).toBe(25) // 50/200 = 25%
  })

  it('should show correct remaining amount', () => {
    recordSpending('elevenlabs', 30)
    const status = getSpendingStatus()
    expect(status.elevenlabs.remaining).toBe(170)
    expect(status.elevenlabs.spent).toBe(30)
    expect(status.elevenlabs.cap).toBe(200)
  })
})

describe('resetSpending', () => {
  it('should reset specific provider spending', () => {
    recordSpending('anthropic', 100)
    resetSpending('anthropic')
    const result = checkSpendingCap('anthropic')
    expect(result.currentSpend).toBe(0)
  })

  it('should reset all spending when no provider specified', () => {
    recordSpending('anthropic', 100)
    recordSpending('elevenlabs', 50)
    resetSpending()
    expect(checkSpendingCap('anthropic').currentSpend).toBe(0)
    expect(checkSpendingCap('elevenlabs').currentSpend).toBe(0)
  })

  it('should not affect other provider when resetting one', () => {
    recordSpending('anthropic', 100)
    recordSpending('elevenlabs', 50)
    resetSpending('anthropic')
    expect(checkSpendingCap('anthropic').currentSpend).toBe(0)
    expect(checkSpendingCap('elevenlabs').currentSpend).toBe(50)
  })
})
