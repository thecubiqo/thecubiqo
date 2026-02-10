/**
 * AI Provider Configurations
 * MiniMax (primary), Claude, and OpenAI (fallback)
 */

import type { ProviderConfig } from './types'

export const MINIMAX_CONFIG: ProviderConfig = {
  name: 'minimax',
  model: 'MiniMax-M2',
  maxTokens: 200,
  apiKeyEnv: 'MINIMAX_KEY'
}

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 200,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}

export const OPENAI_CONFIG: ProviderConfig = {
  name: 'openai',
  model: 'gpt-5.1',
  maxTokens: 200,
  apiKeyEnv: 'OPENAI_API_KEY'
}

// Primary provider - MiniMax
export const PRIMARY_PROVIDER = MINIMAX_CONFIG

// Fallback providers
export const FALLBACK_PROVIDER = CLAUDE_CONFIG
export const TERTIARY_PROVIDER = OPENAI_CONFIG
