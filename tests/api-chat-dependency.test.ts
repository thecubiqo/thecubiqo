/**
 * Chat API Dependency Tests
 *
 * Validates the /api/chat route's dependency wiring:
 * AI provider fallback chain, rate limiting, spending caps,
 * content classification, and memory context.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const chatRoutePath = resolve(__dirname, '../src/app/api/chat/route.ts')
const chatRouteContent = readFileSync(chatRoutePath, 'utf-8')

describe('Chat API: Provider Fallback Chain', () => {
  it('should import MiniMax config (primary)', () => {
    expect(chatRouteContent).toContain('MINIMAX_CONFIG')
  })

  it('should import Mixtral config (first fallback)', () => {
    expect(chatRouteContent).toContain('MIXTRAL_CONFIG')
  })

  it('should import Llama config (second fallback)', () => {
    expect(chatRouteContent).toContain('LLAMA_CONFIG')
  })

  it('should import Claude config (final fallback)', () => {
    expect(chatRouteContent).toContain('CLAUDE_CONFIG')
  })

  it('should import OpenClaw caller', () => {
    expect(chatRouteContent).toContain('callOpenClaw')
  })
})

describe('Chat API: Rate Limiting', () => {
  it('should define MiniMax rate limit at 100 requests per hour', () => {
    expect(chatRouteContent).toContain('MINIMAX_RATE_LIMIT')
    expect(chatRouteContent).toContain('100')
  })

  it('should use 1-hour rate window', () => {
    expect(chatRouteContent).toContain('MINIMAX_RATE_WINDOW')
    expect(chatRouteContent).toContain('60 * 60 * 1000')
  })

  it('should track rate limits per session', () => {
    expect(chatRouteContent).toContain('minimaxRateLimitMap')
  })

  it('should implement checkMiniMaxRateLimit function', () => {
    expect(chatRouteContent).toContain('function checkMiniMaxRateLimit')
  })
})

describe('Chat API: Spending Caps Integration', () => {
  it('should import checkSpendingCap', () => {
    expect(chatRouteContent).toContain('checkSpendingCap')
  })

  it('should import recordSpending', () => {
    expect(chatRouteContent).toContain('recordSpending')
  })

  it('should import estimateAnthropicCost', () => {
    expect(chatRouteContent).toContain('estimateAnthropicCost')
  })

  it('should import estimateTokens', () => {
    expect(chatRouteContent).toContain('estimateTokens')
  })

  it('should document Anthropic spending cap of $200/month', () => {
    expect(chatRouteContent).toContain('$200')
  })
})

describe('Chat API: Content Classification', () => {
  it('should define sensitive content patterns', () => {
    expect(chatRouteContent).toContain('SENSITIVE_CONTENT_PATTERNS')
  })

  it('should classify intimate/adult content', () => {
    expect(chatRouteContent).toContain('intimate')
    expect(chatRouteContent).toContain('nsfw')
  })

  it('should route sensitive content to Claude Haiku', () => {
    // Claude Haiku handles sensitive content better
    expect(chatRouteContent).toContain('Claude Haiku')
  })
})

describe('Chat API: Memory Integration', () => {
  it('should import buildMemoryContext', () => {
    expect(chatRouteContent).toContain('buildMemoryContext')
  })

  it('should import adaptive system prompt builder', () => {
    expect(chatRouteContent).toContain('buildAdaptiveSystemPrompt')
    expect(chatRouteContent).toContain('buildMessages')
  })

  it('should import parseResponse', () => {
    expect(chatRouteContent).toContain('parseResponse')
  })
})

describe('Chat API: Region Support', () => {
  it('should import getRegionConfig', () => {
    expect(chatRouteContent).toContain('getRegionConfig')
  })

  it('should import buildRegionalPrompt', () => {
    expect(chatRouteContent).toContain('buildRegionalPrompt')
  })
})

describe('Chat API: Supabase Admin Client', () => {
  it('should create admin Supabase client with service role key', () => {
    expect(chatRouteContent).toContain('supabaseAdmin')
    expect(chatRouteContent).toContain('serviceRoleKey')
  })

  it('should support ENV fallback properties', () => {
    expect(chatRouteContent).toContain('ENV.supabase.url')
    expect(chatRouteContent).toContain('ENV.supabase.serviceRoleKey')
  })

  it('should use placeholders when env vars missing', () => {
    expect(chatRouteContent).toContain('https://placeholder.supabase.co')
    expect(chatRouteContent).toContain('placeholder-key')
  })
})
