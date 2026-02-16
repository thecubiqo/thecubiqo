/**
 * AI Provider Configurations
 * MiniMax (primary) → Mixtral → Llama → Claude Haiku (final fallback)
 */

import type { ProviderConfig } from './types'

export const MINIMAX_CONFIG: ProviderConfig = {
  name: 'minimax',
  model: 'MiniMax-M2',
  maxTokens: 200,
  apiKeyEnv: 'MINIMAX_API_KEY' // Also supports MINIMAX_KEY as fallback
}

export const MIXTRAL_CONFIG: ProviderConfig = {
  name: 'mixtral',
  model: 'mistral-medium-latest',
  maxTokens: 200,
  apiKeyEnv: 'MISTRAL_API_KEY'
}

export const LLAMA_CONFIG: ProviderConfig = {
  name: 'llama',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  maxTokens: 200,
  apiKeyEnv: 'TOGETHER_API_KEY'
}

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 200,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}

// Primary provider - MiniMax
export const PRIMARY_PROVIDER = MINIMAX_CONFIG

// Fallback chain
export const FALLBACK_PROVIDERS = [MIXTRAL_CONFIG, LLAMA_CONFIG, CLAUDE_CONFIG]
