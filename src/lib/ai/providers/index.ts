/**
 * AI Provider Abstractions
 * 
 * Provides a unified interface for AI providers including OpenClaw.
 * Feature flags control which providers are enabled at runtime.
 * 
 * Related PR: #4 (OpenClaw Integration)
 */

import type { ProviderConfig } from '../types'
import { MINIMAX_CONFIG, MIXTRAL_CONFIG, LLAMA_CONFIG, CLAUDE_CONFIG } from '../providers'

/**
 * OpenClaw Provider Configuration
 * Disabled by default - requires OPENCLAW_API_KEY to be set
 */
export const OPENCLAW_CONFIG: ProviderConfig = {
  name: 'openclaw',
  model: 'openclaw-1',
  maxTokens: 200,
  apiKeyEnv: 'OPENCLAW_API_KEY'
}

/**
 * Feature flags for AI providers
 */
export interface AIProviderFeatureFlags {
  /** Enable OpenClaw provider (requires API key) */
  enableOpenClaw: boolean
  /** Enable MiniMax provider (default) */
  enableMiniMax: boolean
  /** Enable Mixtral provider */
  enableMixtral: boolean
  /** Enable Llama provider */
  enableLlama: boolean
  /** Enable Claude provider */
  enableClaude: boolean
}

/**
 * Get AI provider feature flags from environment
 * 
 * OpenClaw is only enabled if:
 * 1. NEXT_PUBLIC_ENABLE_OPENCLAW is explicitly set to 'true'
 * 2. OPENCLAW_API_KEY is provided
 * 
 * This ensures no runtime dependency is added unless keys are provided.
 */
export function getAIProviderFlags(): AIProviderFeatureFlags {
  const hasOpenClawKey = typeof process !== 'undefined' && 
    (process.env.OPENCLAW_API_KEY || process.env.NEXT_PUBLIC_OPENCLAW_API_KEY)
  
  const openClawExplicitlyEnabled = 
    process.env.NEXT_PUBLIC_ENABLE_OPENCLAW === 'true'

  return {
    // OpenClaw requires explicit enablement AND API key
    enableOpenClaw: openClawExplicitlyEnabled && !!hasOpenClawKey,
    // Default providers are enabled by default
    enableMiniMax: true,
    enableMixtral: true,
    enableLlama: true,
    enableClaude: true,
  }
}

/**
 * Get list of enabled provider configs
 */
export function getEnabledProviders(): ProviderConfig[] {
  const flags = getAIProviderFlags()
  const providers: ProviderConfig[] = []

  if (flags.enableOpenClaw) {
    providers.push(OPENCLAW_CONFIG)
  }
  if (flags.enableMiniMax) {
    providers.push(MINIMAX_CONFIG)
  }
  if (flags.enableMixtral) {
    providers.push(MIXTRAL_CONFIG)
  }
  if (flags.enableLlama) {
    providers.push(LLAMA_CONFIG)
  }
  if (flags.enableClaude) {
    providers.push(CLAUDE_CONFIG)
  }

  return providers
}

/**
 * Check if a specific provider is enabled
 */
export function isProviderEnabled(providerName: string): boolean {
  const flags = getAIProviderFlags()
  
  switch (providerName) {
    case 'openclaw':
      return flags.enableOpenClaw
    case 'minimax':
      return flags.enableMiniMax
    case 'mixtral':
      return flags.enableMixtral
    case 'llama':
      return flags.enableLlama
    case 'claude':
      return flags.enableClaude
    default:
      return false
  }
}

/**
 * Validate that required environment variables are set for enabled providers
 * Returns array of missing environment variables
 */
export function validateProviderEnvironment(): string[] {
  const flags = getAIProviderFlags()
  const missing: string[] = []

  if (flags.enableOpenClaw && !process.env.OPENCLAW_API_KEY) {
    missing.push('OPENCLAW_API_KEY')
  }
  if (flags.enableMiniMax && !process.env.MINIMAX_API_KEY) {
    missing.push('MINIMAX_API_KEY')
  }
  if (flags.enableMixtral && !process.env.MISTRAL_API_KEY) {
    missing.push('MISTRAL_API_KEY')
  }
  if (flags.enableLlama && !process.env.TOGETHER_API_KEY) {
    missing.push('TOGETHER_API_KEY')
  }
  if (flags.enableClaude && !process.env.ANTHROPIC_API_KEY) {
    missing.push('ANTHROPIC_API_KEY')
  }

  return missing
}
