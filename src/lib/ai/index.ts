/**
 * AI Module Exports
 */

export { SYSTEM_PROMPT } from './system-prompt'
export { buildMessages, parseResponse, formatFullTimestamp, formatTimeAgo } from './service'
export { 
  MINIMAX_CONFIG, 
  CLAUDE_CONFIG, 
  OPENAI_CONFIG, 
  PRIMARY_PROVIDER, 
  FALLBACK_PROVIDER, 
  TERTIARY_PROVIDER,
  callClaude,
  callOpenAI
} from './providers'
export { 
  OLLAMA_CONFIG, 
  callOllama, 
  callOllamaWithFallback, 
  isOllamaAvailable,
  getOllamaModels
} from './ollama'
export {
  routeAIRequest,
  trackCost,
  getCostStats,
  resetCostStats
} from './router'
export type {
  ChatMessage,
  ConversationEntry,
  AIResponse,
  ChatRequest,
  ChatAPIRequest,
  AIProvider,
  ProviderConfig
} from './types'
