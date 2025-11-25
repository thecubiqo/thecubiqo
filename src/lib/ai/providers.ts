/**
 * AI Provider Configurations
 * Claude (primary) and OpenAI (fallback)
 */

import type { ProviderConfig } from './types'

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 200,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}

export const OPENAI_CONFIG: ProviderConfig = {
  name: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 200,
  apiKeyEnv: 'OPENAI_API_KEY'
}

// Primary provider
export const PRIMARY_PROVIDER = CLAUDE_CONFIG

// Fallback provider (used if primary fails)
export const FALLBACK_PROVIDER = OPENAI_CONFIG
