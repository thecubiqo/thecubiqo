/**
 * Unit Tests: Token Counter Utilities
 *
 * Tests estimateTokenCount, countMessageTokens, countConversationTokens,
 * getTokenLimit, and shouldCompact.
 */

import { describe, it, expect } from 'vitest'
import {
  estimateTokenCount,
  countMessageTokens,
  countConversationTokens,
  DEFAULT_TOKEN_LIMITS,
  getTokenLimit,
  shouldCompact,
} from '@/lib/utils/token-counter'

describe('estimateTokenCount', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0)
  })

  it('should estimate ~1 token per 4 characters', () => {
    expect(estimateTokenCount('abcd')).toBe(1)
    expect(estimateTokenCount('abcdefgh')).toBe(2)
  })

  it('should round up for partial tokens', () => {
    expect(estimateTokenCount('ab')).toBe(1)   // ceil(2/4) = 1
    expect(estimateTokenCount('abcde')).toBe(2) // ceil(5/4) = 2
  })

  it('should handle long text', () => {
    const longText = 'a'.repeat(1000)
    expect(estimateTokenCount(longText)).toBe(250) // 1000/4
  })

  it('should handle unicode text', () => {
    const unicode = '你好世界' // 4 chars
    const result = estimateTokenCount(unicode)
    expect(result).toBeGreaterThan(0)
  })
})

describe('countMessageTokens', () => {
  it('should count string content tokens plus overhead', () => {
    const msg = { role: 'user', content: 'Hello world!' } // 12 chars => 3 tokens + 4 overhead = 7
    const tokens = countMessageTokens(msg)
    expect(tokens).toBe(7)
  })

  it('should include 4-token base overhead per message', () => {
    const msg = { role: 'user', content: '' }
    expect(countMessageTokens(msg)).toBe(4) // just overhead
  })

  it('should count array content with text blocks', () => {
    const msg = {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: 'World' },
      ],
    }
    const tokens = countMessageTokens(msg)
    // 4 overhead + ceil(5/4) + ceil(5/4) = 4 + 2 + 2 = 8
    expect(tokens).toBe(8)
  })

  it('should estimate 1000 tokens for image blocks', () => {
    const msg = {
      role: 'user',
      content: [
        { type: 'image_url', image_url: 'data:image/png;base64,...' },
      ],
    }
    const tokens = countMessageTokens(msg)
    expect(tokens).toBe(1004) // 4 overhead + 1000 for image
  })

  it('should count tool calls', () => {
    const msg = {
      role: 'assistant',
      content: 'Running tool',
      toolCalls: [{ id: '1', name: 'search', input: { query: 'test' } }],
    }
    const withTools = countMessageTokens(msg)
    const without = countMessageTokens({ role: 'assistant', content: 'Running tool' })
    expect(withTools).toBeGreaterThan(without)
  })

  it('should count tool results', () => {
    const msg = {
      role: 'tool',
      content: '',
      toolResults: [{ tool_use_id: '1', content: 'Result data here' }],
    }
    const tokens = countMessageTokens(msg)
    expect(tokens).toBeGreaterThan(4) // overhead + tool result tokens
  })
})

describe('countConversationTokens', () => {
  it('should return 0 for empty conversation', () => {
    expect(countConversationTokens([])).toBe(0)
  })

  it('should sum tokens across all messages', () => {
    const messages = [
      { role: 'user', content: 'Hello' },       // 4 + 2 = 6
      { role: 'assistant', content: 'Hi there' }, // 4 + 2 = 6
    ]
    const total = countConversationTokens(messages)
    expect(total).toBe(12)
  })

  it('should handle multi-message conversations', () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message number ${i}`,
    }))
    const total = countConversationTokens(messages)
    expect(total).toBeGreaterThan(40) // 10 messages * at least 4 overhead each
  })
})

describe('DEFAULT_TOKEN_LIMITS', () => {
  it('should define limits for known models', () => {
    expect(DEFAULT_TOKEN_LIMITS['claude-3-5-sonnet-20241022']).toBe(200000)
    expect(DEFAULT_TOKEN_LIMITS['gpt-4-turbo']).toBe(128000)
    expect(DEFAULT_TOKEN_LIMITS['gpt-4']).toBe(8192)
    expect(DEFAULT_TOKEN_LIMITS['gpt-3.5-turbo']).toBe(16385)
  })
})

describe('getTokenLimit', () => {
  it('should return known model limits', () => {
    expect(getTokenLimit('claude-3-5-sonnet-20241022')).toBe(200000)
    expect(getTokenLimit('gpt-4')).toBe(8192)
  })

  it('should return default limit for unknown models', () => {
    expect(getTokenLimit('unknown-model')).toBe(100000)
    expect(getTokenLimit('')).toBe(100000)
  })
})

describe('shouldCompact', () => {
  it('should return false when under threshold', () => {
    // GPT-4 limit is 8192, 75% is 6144
    expect(shouldCompact(5000, 'gpt-4')).toBe(false)
  })

  it('should return true when at or above threshold', () => {
    // GPT-4 limit is 8192, 75% is 6144
    expect(shouldCompact(6144, 'gpt-4')).toBe(true)
    expect(shouldCompact(8000, 'gpt-4')).toBe(true)
  })

  it('should respect custom threshold', () => {
    // GPT-4 limit is 8192, 50% is 4096
    expect(shouldCompact(4096, 'gpt-4', 0.5)).toBe(true)
    expect(shouldCompact(4095, 'gpt-4', 0.5)).toBe(false)
  })

  it('should use default limit for unknown models', () => {
    // Default is 100000, 75% is 75000
    expect(shouldCompact(74999, 'some-model')).toBe(false)
    expect(shouldCompact(75000, 'some-model')).toBe(true)
  })
})
