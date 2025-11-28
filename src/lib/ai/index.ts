/**
 * AI Module Exports
 */

export { SYSTEM_PROMPT, buildMemoryContext } from './system-prompt'
export { buildMessages, parseResponse, formatFullTimestamp, formatTimeAgo } from './service'
export { CLAUDE_CONFIG, OPENAI_CONFIG, PRIMARY_PROVIDER, FALLBACK_PROVIDER } from './providers'
export type {
  ChatMessage,
  ConversationEntry,
  AIResponse,
  ChatRequest,
  ChatAPIRequest,
  AIProvider,
  ProviderConfig
} from './types'
export {
  extractMemories,
  saveMemories,
  loadMemories,
  parseExtractionResult,
  type ExtractedMemory
} from './memory-extraction'
