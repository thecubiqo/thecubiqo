/**
 * AI Service Types
 */

import type { ColorName } from '@/config/colors'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ConversationEntry {
  userMessage: string
  aiResponse: string
  color: ColorName
  timestamp: string
}

export interface AIResponse {
  color: ColorName
  response: string
}

export interface ChatRequest {
  message: string
  conversationHistory: ConversationEntry[]
  currentColor: ColorName
}

export interface ChatAPIRequest {
  systemPrompt: string
  messages: ChatMessage[]
}

export type AIProvider = 'minimax' | 'mixtral' | 'llama' | 'claude' | 'openclaw'

/**
 * Experimental AI Providers
 * These are not part of the core provider set and may be unstable
 */
export type ExperimentalProvider = 'openclaw'

/**
 * All available AI providers (core + experimental)
 */
export type AllProviders = AIProvider | ExperimentalProvider

export interface ProviderConfig {
  name: AIProvider
  model: string
  maxTokens: number
  apiKeyEnv: string
}
