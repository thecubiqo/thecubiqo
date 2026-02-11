/**
 * AI Router - Intelligent routing between local (Ollama) and cloud providers
 * 
 * ROUTING STRATEGY:
 * 1. Try Ollama FIRST (local, free, no guardrails)
 * 2. Fallback to cloud only if:
 *    - Ollama is down
 *    - Ollama fails
 *    - Request needs advanced reasoning (complex queries)
 * 
 * COST OPTIMIZATION:
 * - 80%+ requests → Ollama (FREE)
 * - 20% requests → Cloud (minimal cost)
 * 
 * NO GUARDRAILS:
 * - Ollama has NO censorship
 * - Cloud providers as backup only
 */

import { callOllamaWithFallback, isOllamaAvailable } from './ollama'
import { callClaude } from './providers'
import { callOpenAI } from './providers'
import { callOpenClaw } from './openclaw'
import { SYSTEM_PROMPT_UNHINGED } from './system-prompt-unhinged'

export type AIProvider = 'ollama' | 'claude' | 'openai' | 'openclaw'

export interface RouterResult {
  content: string
  provider: AIProvider
  cost: number // Estimated cost in USD
  cached: boolean // Whether response was cached
}

interface RouterOptions {
  systemPrompt: string
  messages: { role: string; content: string }[]
  byoClaudeKey?: string | null
  byoOpenaiKey?: string | null
  forceCloud?: boolean // Force cloud provider (skip Ollama)
  preferredCloud?: 'claude' | 'openai' | 'openclaw' // Which cloud to prefer
  isFounder?: boolean // Special access for aditya@cubiqo.ai
  abTestVariant?: 'A' | 'B' // Personality variant
}

// Track Ollama availability to avoid repeated timeout checks
let ollamaAvailableCache: { available: boolean; checkedAt: number } | null = null
const OLLAMA_CACHE_DURATION = 60000 // 1 minute

/**
 * Check if Ollama is available (with caching)
 */
async function checkOllamaAvailable(): Promise<boolean> {
  const now = Date.now()

  // Use cached result if recent
  if (ollamaAvailableCache && (now - ollamaAvailableCache.checkedAt) < OLLAMA_CACHE_DURATION) {
    return ollamaAvailableCache.available
  }

  // Check availability
  const available = await isOllamaAvailable()

  // Cache result
  ollamaAvailableCache = { available, checkedAt: now }

  return available
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Detect if query needs advanced reasoning (complex queries better for cloud)
 */
function needsAdvancedReasoning(messages: { role: string; content: string }[]): boolean {
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop()?.content || ''

  // Keywords that suggest complex reasoning
  const complexKeywords = [
    'analyze',
    'compare',
    'explain why',
    'how does',
    'what if',
    'reasoning',
    'logic',
    'calculate',
    'solve',
    'debug',
    'complex'
  ]

  const lowerMessage = lastUserMessage.toLowerCase()
  return complexKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Main router - decides which provider to use
 */
export async function routeAIRequest(options: RouterOptions): Promise<RouterResult> {
  const {
    systemPrompt,
    messages,
    byoClaudeKey,
    byoOpenaiKey,
    forceCloud = false,
    preferredCloud = 'openclaw',
    isFounder = false,
    abTestVariant = 'A'
  } = options

  // Calculate estimated input tokens for cost tracking
  const inputText = systemPrompt + messages.map(m => m.content).join('')
  const inputTokens = estimateTokens(inputText)

  // Log routing decision
  console.log('[Router] Request:', {
    forceCloud,
    preferredCloud,
    hasByoKeys: !!(byoClaudeKey || byoOpenaiKey),
    inputTokens,
    isFounder,
    abTestVariant
  })

  // Founder Mode: Always use the smartest model (Claude/OpenClaw) for maximum efficiency
  if (isFounder) {
    console.log('[Router] 🚀 FOUNDER MODE: Bypassing checks, using smartest provider')
    return await useCloudProvider({
      ...options,
      preferredCloud: 'openclaw' // Force OpenClaw (Claude Sonnet) for Founder
    }, inputTokens)
  }

  // OPTION 1: Force cloud provider (skip Ollama)
  if (forceCloud) {
    console.log('[Router] Forcing cloud provider')
    return await useCloudProvider(options, inputTokens)
  }

  // OPTION 2: Check if query needs advanced reasoning
  const needsAdvanced = needsAdvancedReasoning(messages)
  if (needsAdvanced) {
    console.log('[Router] Complex query detected, using cloud provider')
    return await useCloudProvider(options, inputTokens)
  }

  // OPTION 3: Try Ollama first (PRIMARY - free, no guardrails)
  // AB Test: Variant B always tries Ollama first regardless of complexity? (Already default behavior basically)
  const ollamaAvailable = await checkOllamaAvailable()

  if (ollamaAvailable) {
    try {
      console.log('[Router] Trying Ollama (local, free, no guardrails)')

      // Use UNHINGED prompt for local Ollama (no censorship!)
      const unhingedPrompt = SYSTEM_PROMPT_UNHINGED || systemPrompt
      const content = await callOllamaWithFallback(unhingedPrompt, messages)

      return {
        content,
        provider: 'ollama',
        cost: 0, // FREE!
        cached: false
      }
    } catch (ollamaError) {
      console.warn('[Router] Ollama failed, falling back to cloud:', ollamaError)
      // Mark Ollama as unavailable for next minute
      ollamaAvailableCache = { available: false, checkedAt: Date.now() }
    }
  } else {
    console.log('[Router] Ollama not available, using cloud provider')
  }

  // OPTION 4: Fallback to cloud provider
  return await useCloudProvider(options, inputTokens)
}

/**
 * Use cloud provider (fallback)
 */
async function useCloudProvider(options: RouterOptions, inputTokens: number): Promise<RouterResult> {
  const { systemPrompt, messages, byoClaudeKey, byoOpenaiKey, preferredCloud = 'openclaw' } = options

  // Try preferred cloud provider first
  if (preferredCloud === 'openclaw') {
    try {
      console.log('[Router] Trying OpenClaw')
      const content = await callOpenClaw(systemPrompt, messages)
      return {
        content,
        provider: 'openclaw',
        cost: estimateOpenClawCost(inputTokens),
        cached: false
      }
    } catch (openclawError) {
      console.warn('[Router] OpenClaw failed, trying Claude:', openclawError)
    }
  }

  // Try Claude
  try {
    console.log('[Router] Trying Claude')
    const content = await callClaude(systemPrompt, messages, byoClaudeKey)
    const outputTokens = estimateTokens(content)
    return {
      content,
      provider: 'claude',
      cost: estimateClaudeCost(inputTokens, outputTokens),
      cached: false
    }
  } catch (claudeError) {
    console.warn('[Router] Claude failed, trying OpenAI:', claudeError)
  }

  // Final fallback: OpenAI
  try {
    console.log('[Router] Trying OpenAI (final fallback)')
    const content = await callOpenAI(systemPrompt, messages, byoOpenaiKey)
    const outputTokens = estimateTokens(content)
    return {
      content,
      provider: 'openai',
      cost: estimateOpenAICost(inputTokens, outputTokens),
      cached: false
    }
  } catch (openaiError) {
    throw new Error('All providers failed')
  }
}

/**
 * Cost estimation functions
 */
function estimateClaudeCost(inputTokens: number, outputTokens: number): number {
  // Claude Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens
  const inputCost = (inputTokens / 1_000_000) * 0.25
  const outputCost = (outputTokens / 1_000_000) * 1.25
  return inputCost + outputCost
}

function estimateOpenAICost(inputTokens: number, outputTokens: number): number {
  // GPT-4o mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
  const inputCost = (inputTokens / 1_000_000) * 0.15
  const outputCost = (outputTokens / 1_000_000) * 0.60
  return inputCost + outputCost
}

function estimateOpenClawCost(inputTokens: number): number {
  // OpenClaw uses Claude Sonnet, more expensive but more capable
  // Claude Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
  // Estimate output is ~20% of input
  const outputTokens = inputTokens * 0.2
  const inputCost = (inputTokens / 1_000_000) * 3
  const outputCost = (outputTokens / 1_000_000) * 15
  return inputCost + outputCost
}

/**
 * Cost tracking for analytics
 */
interface CostStats {
  totalRequests: number
  ollamaRequests: number
  cloudRequests: number
  totalCost: number
  avgCostPerRequest: number
  savingsFromOllama: number // How much we saved by using Ollama
}

let costStats: CostStats = {
  totalRequests: 0,
  ollamaRequests: 0,
  cloudRequests: 0,
  totalCost: 0,
  avgCostPerRequest: 0,
  savingsFromOllama: 0
}

/**
 * Track cost for a request
 */
export function trackCost(provider: AIProvider, cost: number) {
  costStats.totalRequests++

  if (provider === 'ollama') {
    costStats.ollamaRequests++
    // Estimate what this would have cost on cloud (assume Claude)
    costStats.savingsFromOllama += 0.001 // ~$0.001 per request on Claude
  } else {
    costStats.cloudRequests++
    costStats.totalCost += cost
  }

  costStats.avgCostPerRequest = costStats.totalCost / Math.max(costStats.cloudRequests, 1)
}

/**
 * Get cost statistics
 */
export function getCostStats(): CostStats {
  return { ...costStats }
}

/**
 * Reset cost statistics
 */
export function resetCostStats() {
  costStats = {
    totalRequests: 0,
    ollamaRequests: 0,
    cloudRequests: 0,
    totalCost: 0,
    avgCostPerRequest: 0,
    savingsFromOllama: 0
  }
}
