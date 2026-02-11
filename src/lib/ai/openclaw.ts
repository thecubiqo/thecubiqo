/**
 * OpenClaw Integration
 * Routes AI calls through Clawdbot for tool use, memory, and enhanced capabilities
 */

export const OPENCLAW_CONFIG = {
  name: 'openclaw',
  baseUrl: process.env.OPENCLAW_BASE_URL || 'http://localhost:18789',
  model: 'emergent-claude/claude-sonnet-4-5', // or any model configured in Clawdbot
  maxTokens: 4000,
  apiKeyEnv: 'OPENROUTER_KEY_CUBIKEY'
}

/**
 * Call OpenClaw API (OpenAI-compatible endpoint)
 */
export async function callOpenClaw(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey?: string | null
): Promise<string> {
  const key = apiKey || process.env.OPENROUTER_KEY_CUBIKEY
  const baseUrl = process.env.OPENCLAW_BASE_URL || 'http://localhost:18789'

  if (!key) {
    throw new Error('OPENROUTER_KEY_CUBIKEY not configured')
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
