/**
 * AI Provider Configurations
 * MiniMax (primary) → Mixtral → Llama → Claude Haiku (final fallback)
 */

import type { ProviderConfig } from './types'

export const MINIMAX_CONFIG: ProviderConfig = {
  name: 'minimax',
  model: 'abab6-chat',
  maxTokens: 2048,
  apiKeyEnv: 'MINIMAX_KEY'
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

export const OPENAI_CONFIG: ProviderConfig = {
  name: 'openai',
  model: 'gpt-3.5-turbo',
  maxTokens: 200,
  apiKeyEnv: 'OPENAI_API_KEY'
}

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-3-5-haiku-20241022',
  maxTokens: 1024,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}

// Primary provider - OpenAI (MiniMax models deprecated)
export const PRIMARY_PROVIDER = OPENAI_CONFIG

// Fallback chain (MiniMax removed, others as fallbacks)
export const FALLBACK_PROVIDERS = [MIXTRAL_CONFIG, LLAMA_CONFIG, CLAUDE_CONFIG]
