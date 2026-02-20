/**
 * Load Tests: Spending Caps Under Stress
 *
 * Validates spending cap system accuracy and behavior
 * under high-volume recording and query patterns.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkSpendingCap,
  recordSpending,
  getSpendingStatus,
  resetSpending,
  estimateAnthropicCost,
  estimateElevenLabsCost,
} from '@/lib/spending-caps'

describe('Spending Caps Load Tests', () => {
  beforeEach(() => {
    resetSpending()
  })

  it('should maintain accuracy after 10,000 small increments', () => {
    const increment = 0.01 // $0.01 each
    const iterations = 10_000
    const expectedTotal = increment * iterations // $100

    for (let i = 0; i < iterations; i++) {
      recordSpending('anthropic', increment)
    }

    const status = getSpendingStatus()
    // Allow floating point tolerance
    expect(status.anthropic.spent).toBeCloseTo(expectedTotal, 0)
    expect(status.anthropic.percentUsed).toBeCloseTo(50, 0) // $100 of $200 = 50%
  })

  it('should correctly block when cap is exceeded through increments', () => {
    const increment = 1.0 // $1 each
    for (let i = 0; i < 201; i++) {
      recordSpending('elevenlabs', increment)
    }

    const result = checkSpendingCap('elevenlabs')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should track both providers independently under load', () => {
    for (let i = 0; i < 1000; i++) {
      recordSpending('anthropic', 0.05)
      recordSpending('elevenlabs', 0.03)
    }

    const status = getSpendingStatus()
    expect(status.anthropic.spent).toBeCloseTo(50, 0)
    expect(status.elevenlabs.spent).toBeCloseTo(30, 0)
  })

  it('should handle alternating record and check operations', () => {
    let blocked = false

    for (let i = 0; i < 500; i++) {
      recordSpending('anthropic', 0.5)
      const result = checkSpendingCap('anthropic')

      if (!result.allowed) {
        blocked = true
        // Should block at around $200, which is ~400 iterations
        expect(i).toBeGreaterThanOrEqual(399)
        break
      }
    }

    expect(blocked).toBe(true)
  })

  it('should correctly estimate costs for a realistic workload of API calls', () => {
    // Simulate 100 API calls with varying token counts
    const calls = Array.from({ length: 100 }, () => ({
      inputTokens: Math.floor(Math.random() * 5000) + 500,
      outputTokens: Math.floor(Math.random() * 2000) + 100,
    }))

    let totalCost = 0
    for (const call of calls) {
      const cost = estimateAnthropicCost(call.inputTokens, call.outputTokens)
      totalCost += cost
      recordSpending('anthropic', cost)
    }

    const status = getSpendingStatus()
    expect(status.anthropic.spent).toBeCloseTo(totalCost, 1)
  })

  it('should correctly estimate costs for a realistic TTS workload', () => {
    // Simulate 200 TTS requests with varying character counts
    const requests = Array.from({ length: 200 }, () =>
      Math.floor(Math.random() * 500) + 50
    )

    let totalCost = 0
    for (const charCount of requests) {
      const cost = estimateElevenLabsCost(charCount)
      totalCost += cost
      recordSpending('elevenlabs', cost)
    }

    const status = getSpendingStatus()
    expect(status.elevenlabs.spent).toBeCloseTo(totalCost, 1)
  })

  it('should reset cleanly after load testing', () => {
    for (let i = 0; i < 1000; i++) {
      recordSpending('anthropic', 0.1)
      recordSpending('elevenlabs', 0.1)
    }

    resetSpending()

    const status = getSpendingStatus()
    expect(status.anthropic.spent).toBe(0)
    expect(status.elevenlabs.spent).toBe(0)
    expect(status.anthropic.percentUsed).toBe(0)
    expect(status.elevenlabs.percentUsed).toBe(0)
  })
})
