import { ENV } from '@/lib/config/env'

export const OPENCLAW_CONFIG = {
  name: 'openclaw',
  baseUrl: process.env.OPENCLAW_BASE_URL || 'http://localhost:18789',
  model: 'claude-3-5-sonnet-20241022', // Standard capable model for Clawdbot
  maxTokens: 4000,
  apiKeyEnv: 'OPENCLAW_API_KEY'
}

/**
 * Call OpenClaw API (OpenAI-compatible endpoint)
 */
export async function callOpenClaw(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey?: string | null
): Promise<string> {
  // Support both old and new env var names with fallback
  const key = apiKey || ENV.ai.openclaw
  const baseUrl = process.env.OPENCLAW_BASE_URL || 'http://localhost:18789'

  if (!key) {
    throw new Error('OPENCLAW_API_KEY or OPENROUTER_KEY_CUBIKEY not configured')
  }

  // Format messages for OpenAI-compatible API
  const formattedMessages = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...messages
  ]

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: OPENCLAW_CONFIG.model,
      messages: formattedMessages,
      max_tokens: OPENCLAW_CONFIG.maxTokens,
      stream: false
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('OpenClaw API error:', errorData)
    throw new Error(errorData.error?.message || 'OpenClaw API request failed')
  }

  const data = await response.json()

  // Extract the response text from OpenAI-compatible format
  return data.choices[0]?.message?.content || ''
}
