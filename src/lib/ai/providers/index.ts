/**
 * AI Provider Abstraction & Registry
 * 
 * This module provides a centralized registry for AI providers with feature flag support.
 * Providers are disabled by default and only enabled when environment variables are present.
 * 
 * Purpose:
 * - Define a common interface for AI providers
 * - Register available providers with their configurations
 * - Provide feature flag checks to enable/disable providers
 * - Validate environment configuration before provider usage
 */

import type { ProviderConfig } from '../types'

/**
 * Extended Provider Configuration with feature flag support
 */
export interface ExtendedProviderConfig extends ProviderConfig {
  /**
   * Display name for UI and logs
   */
  displayName: string
  
  /**
   * Description of the provider's capabilities
   */
  description?: string
  
  /**
   * Base URL for API calls (optional, defaults to provider's default)
   */
  baseUrl?: string
  
  /**
   * Whether this provider is experimental/beta
   */
  experimental?: boolean
  
  /**
   * Feature flag check - returns true if provider is enabled
   */
  isEnabled: () => boolean
}

/**
 * Provider Registry Entry
 */
export interface ProviderRegistryEntry {
  config: ExtendedProviderConfig
  /**
   * Validate that required environment variables are present
   */
  validate: () => { valid: boolean; message?: string }
}

/**
 * Check if OpenClaw provider is enabled
 * OpenClaw is ONLY enabled if explicit environment variables are set
 */
export function isOpenClawEnabled(): boolean {
  // Check for explicit OpenClaw configuration
  const hasApiKey = !!(
    process.env.OPENCLAW_API_KEY || 
    process.env.OPENROUTER_KEY_CUBIKEY
  )
  
  // Only enable if API key is present
  return hasApiKey
}

/**
 * OpenClaw Provider Configuration
 * 
 * OpenClaw routes AI calls through Clawdbot for enhanced tool use,
 * memory management, and advanced capabilities.
 * 
 * ⚠️ IMPORTANT: OpenClaw is disabled by default
 * To enable, set OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY in your environment
 */
export const OPENCLAW_PROVIDER: ExtendedProviderConfig = {
  name: 'openclaw' as any, // Extended provider type
  displayName: 'OpenClaw (via Clawdbot)',
  model: 'emergent-claude/claude-sonnet-4-5',
  maxTokens: 4000,
  apiKeyEnv: 'OPENCLAW_API_KEY',
  baseUrl: process.env.OPENCLAW_BASE_URL || 'http://localhost:18789',
  description: 'Routes calls through Clawdbot for tool use and enhanced capabilities',
  experimental: true,
  isEnabled: isOpenClawEnabled
}

/**
 * Validate OpenClaw configuration
 */
export function validateOpenClawConfig(): { valid: boolean; message?: string } {
  if (!isOpenClawEnabled()) {
    return {
      valid: false,
      message: 'OpenClaw is not enabled. Set OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY to enable.'
    }
  }
  
  const apiKey = process.env.OPENCLAW_API_KEY || process.env.OPENROUTER_KEY_CUBIKEY
  if (!apiKey) {
    return {
      valid: false,
      message: 'OpenClaw API key not found in environment'
    }
  }
  
  const baseUrl = process.env.OPENCLAW_BASE_URL || 'http://localhost:18789'
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return {
      valid: false,
      message: 'Invalid OPENCLAW_BASE_URL format (must start with http:// or https://)'
    }
  }
  
  return { valid: true }
}

/**
 * Global Provider Registry
 * 
 * This registry contains all available providers with their configurations
 * and validation logic. Providers can be enabled/disabled via feature flags.
 */
export const PROVIDER_REGISTRY: Record<string, ProviderRegistryEntry> = {
  openclaw: {
    config: OPENCLAW_PROVIDER,
    validate: validateOpenClawConfig
  }
  // Additional providers can be registered here
}

/**
 * Get all enabled providers
 */
export function getEnabledProviders(): ExtendedProviderConfig[] {
  return Object.values(PROVIDER_REGISTRY)
    .filter(entry => entry.config.isEnabled())
    .map(entry => entry.config)
}

/**
 * Get provider by name
 */
export function getProvider(name: string): ExtendedProviderConfig | undefined {
  const entry = PROVIDER_REGISTRY[name]
  if (!entry) return undefined
  
  // Check if provider is enabled
  if (!entry.config.isEnabled()) {
    console.warn(`Provider '${name}' is registered but not enabled`)
    return undefined
  }
  
  return entry.config
}

/**
 * Validate a specific provider's configuration
 */
export function validateProvider(name: string): { valid: boolean; message?: string } {
  const entry = PROVIDER_REGISTRY[name]
  if (!entry) {
    return {
      valid: false,
      message: `Provider '${name}' not found in registry`
    }
  }
  
  return entry.validate()
}

/**
 * Check if any experimental providers are enabled
 */
export function hasExperimentalProviders(): boolean {
  return getEnabledProviders().some(p => p.experimental)
}
