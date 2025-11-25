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

export type AIProvider = 'claude' | 'openai'

export interface ProviderConfig {
  name: AIProvider
  model: string
  maxTokens: number
  apiKeyEnv: string
}
