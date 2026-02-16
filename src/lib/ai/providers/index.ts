/**
 * AI Provider Abstraction Layer
 * 
 * This module provides a unified interface for managing AI providers,
 * with feature flags and environment-based configuration.
 * 
 * Providers are disabled by default and only enabled when:
 * 1. Required environment variables are present
 * 2. Feature flags explicitly allow the provider
 * 
 * @module ai/providers
 */

/**
 * Base interface for all AI providers
 */
export interface AIProviderInterface {
  /** Unique identifier for the provider */
  name: string
  /** Display name for the provider */
  displayName: string
  /** Model identifier used by the provider */
  model: string
  /** Maximum tokens for completion */
  maxTokens: number
  /** Environment variable name for API key */
  apiKeyEnv: string
  /** Optional base URL for custom endpoints */
  baseUrl?: string
  /** Whether this provider is enabled (checks env vars) */
  isEnabled: () => boolean
  /** Additional provider-specific metadata */
  metadata?: Record<string, unknown>
}

/**
 * OpenClaw Provider Configuration
 * 
 * OpenClaw routes AI calls through Clawdbot for enhanced capabilities
 * including tool use, memory, and multi-provider routing.
 * 
 * @see docs/SPARK_AI_COMPARISON.md for detailed comparison
 */
export interface OpenClawProvider extends AIProviderInterface {
  name: 'openclaw'
  displayName: 'OpenClaw'
  /** Default: 'emergent-claude/claude-sonnet-4-5' */
  model: string
  /** Default: 4000 */
  maxTokens: number
  /** Required: OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY */
  apiKeyEnv: 'OPENCLAW_API_KEY' | 'OPENROUTER_KEY_CUBIKEY'
  /** Default: http://localhost:18789 */
  baseUrl: string
  /** Additional OpenClaw-specific settings */
  metadata?: {
    /** Whether to use tool calling features */
    enableTools?: boolean
    /** Whether to use memory features */
    enableMemory?: boolean
    /** Timeout for API calls in ms */
    timeout?: number
  }
}

/**
 * Provider Registry
 * 
 * Central registry for all available AI providers.
 * Providers are only active when properly configured.
 */
class ProviderRegistry {
  private providers: Map<string, AIProviderInterface> = new Map()

  /**
   * Register a new provider
   */
  register(provider: AIProviderInterface): void {
    this.providers.set(provider.name, provider)
  }

  /**
   * Get a provider by name
   */
  get(name: string): AIProviderInterface | undefined {
    return this.providers.get(name)
  }

  /**
   * Get all registered providers
   */
  getAll(): AIProviderInterface[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get all enabled providers (have required env vars)
   */
  getEnabled(): AIProviderInterface[] {
    return this.getAll().filter(p => p.isEnabled())
  }

  /**
   * Check if a provider is enabled
   */
  isEnabled(name: string): boolean {
    const provider = this.get(name)
    return provider ? provider.isEnabled() : false
  }
}

/**
 * Global provider registry instance
 */
export const providerRegistry = new ProviderRegistry()

/**
 * Feature flag check for OpenClaw provider
 * 
 * OpenClaw is disabled by default to prevent runtime issues.
 * It is only enabled when:
 * 1. API key is present (OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY)
 * 2. Optional: OPENCLAW_BASE_URL is set (defaults to localhost:18789)
 * 
 * @returns true if OpenClaw is properly configured and should be enabled
 */
export function isOpenClawEnabled(): boolean {
  // Check for API key (support both old and new env var names)
  const hasApiKey = !!(
    process.env.OPENCLAW_API_KEY || 
    process.env.OPENROUTER_KEY_CUBIKEY
  )
  
  // OpenClaw requires an API key to function
  if (!hasApiKey) {
    return false
  }

  // Base URL is optional (defaults to localhost)
  // If set, we consider it an explicit opt-in
  const baseUrl = process.env.OPENCLAW_BASE_URL
  
  // Enabled if API key present AND either:
  // - Base URL is explicitly set, OR
  // - We're in a development environment (allows localhost default)
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  return hasApiKey && (!!baseUrl || isDevelopment)
}

/**
 * Validate OpenClaw environment configuration
 * 
 * @returns Object with validation status and any error messages
 */
export function validateOpenClawConfig(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for API key
  const hasApiKey = !!(
    process.env.OPENCLAW_API_KEY || 
    process.env.OPENROUTER_KEY_CUBIKEY
  )
  
  if (!hasApiKey) {
    errors.push(
      'OpenClaw API key not found. Set OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY environment variable.'
    )
  }

  // Check base URL
  const baseUrl = process.env.OPENCLAW_BASE_URL
  if (!baseUrl) {
    warnings.push(
      'OPENCLAW_BASE_URL not set. Will default to http://localhost:18789'
    )
  } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    errors.push(
      `Invalid OPENCLAW_BASE_URL: "${baseUrl}". Must start with http:// or https://`
    )
  }

  // Production safety check
  if (process.env.NODE_ENV === 'production' && !baseUrl) {
    errors.push(
      'OPENCLAW_BASE_URL must be explicitly set in production (localhost default not allowed)'
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * OpenClaw Provider Definition
 * 
 * This provider connects to Clawdbot for enhanced AI capabilities.
 * It remains disabled unless explicitly configured via environment variables.
 */
export const openClawProvider: OpenClawProvider = {
  name: 'openclaw',
  displayName: 'OpenClaw',
  model: process.env.OPENCLAW_MODEL || 'emergent-claude/claude-sonnet-4-5',
  maxTokens: parseInt(process.env.OPENCLAW_MAX_TOKENS || '4000', 10),
  apiKeyEnv: 'OPENCLAW_API_KEY',
  baseUrl: process.env.OPENCLAW_BASE_URL || 'http://localhost:18789',
  isEnabled: isOpenClawEnabled,
  metadata: {
    enableTools: process.env.OPENCLAW_ENABLE_TOOLS !== 'false',
    enableMemory: process.env.OPENCLAW_ENABLE_MEMORY !== 'false',
    timeout: parseInt(process.env.OPENCLAW_TIMEOUT || '30000', 10)
  }
}

/**
 * Register OpenClaw provider
 * 
 * Note: Registration doesn't enable the provider.
 * The provider is only active when isEnabled() returns true.
 */
providerRegistry.register(openClawProvider)

/**
 * Get OpenClaw configuration safely
 * 
 * Returns null if OpenClaw is not enabled, preventing
 * accidental usage without proper configuration.
 * 
 * @returns OpenClaw configuration or null if not enabled
 */
export function getOpenClawConfig(): OpenClawProvider | null {
  if (!isOpenClawEnabled()) {
    return null
  }
  
  const validation = validateOpenClawConfig()
  if (!validation.valid) {
    console.warn('OpenClaw configuration invalid:', validation.errors)
    return null
  }
  
  return openClawProvider
}

/**
 * Export provider registry for use in other modules
 */
export { ProviderRegistry }

/**
 * Type guard for OpenClaw provider
 */
export function isOpenClawProvider(
  provider: AIProviderInterface
): provider is OpenClawProvider {
  return provider.name === 'openclaw'
}
