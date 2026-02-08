/**
 * API Key Management Types
 */

export type Provider = 'anthropic' | 'openai' | 'google' | 'groq' | 'mistral' | 'cohere'

export interface APIKey {
  id: string
  provider: Provider
  name: string // User-friendly name
  key: string // The actual API key (encrypted in storage)
  createdAt: number
  lastValidated?: number
  isValid?: boolean
  validationError?: string
}

export interface APIKeyStorage {
  keys: APIKey[]
  version: number
}

export interface ProviderConfig {
  name: string
  provider: Provider
  icon: string
  placeholder: string
  validateUrl?: string
  docsUrl: string
  color: string
}

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    provider: 'anthropic',
    icon: '🤖',
    placeholder: 'sk-ant-api03-...',
    validateUrl: 'https://api.anthropic.com/v1/messages',
    docsUrl: 'https://console.anthropic.com',
    color: '#D97757',
  },
  openai: {
    name: 'OpenAI (GPT)',
    provider: 'openai',
    icon: '🧠',
    placeholder: 'sk-...',
    validateUrl: 'https://api.openai.com/v1/models',
    docsUrl: 'https://platform.openai.com',
    color: '#10A37F',
  },
  google: {
    name: 'Google (Gemini)',
    provider: 'google',
    icon: '✨',
    placeholder: 'AIzaSy...',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    color: '#4285F4',
  },
  groq: {
    name: 'Groq',
    provider: 'groq',
    icon: '⚡',
    placeholder: 'gsk_...',
    validateUrl: 'https://api.groq.com/openai/v1/models',
    docsUrl: 'https://console.groq.com',
    color: '#F55036',
  },
  mistral: {
    name: 'Mistral AI',
    provider: 'mistral',
    icon: '🌪️',
    placeholder: 'sk-...',
    docsUrl: 'https://console.mistral.ai',
    color: '#FF7000',
  },
  cohere: {
    name: 'Cohere',
    provider: 'cohere',
    icon: '🔮',
    placeholder: 'co-...',
    docsUrl: 'https://dashboard.cohere.ai',
    color: '#39594D',
  },
}

export const STORAGE_KEY = 'cubiqo_api_keys_v2'
export const STORAGE_VERSION = 2
