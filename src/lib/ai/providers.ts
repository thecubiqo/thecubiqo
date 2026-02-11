/**
 * AI Provider Configurations & Functions
 * MiniMax (primary), Claude, and OpenAI (fallback)
 */

import type { ProviderConfig } from './types'
import {
  checkSpendingCap,
  recordSpending,
  estimateAnthropicCost,
  estimateOpenAICost,
  estimateMiniMaxCost,
  estimateTokens
} from '@/lib/spending-caps'

export const MINIMAX_CONFIG: ProviderConfig = {
  name: 'minimax',
  model: 'MiniMax-M2',
  maxTokens: 200,
  apiKeyEnv: 'MINIMAX_KEY'
}

export const CLAUDE_CONFIG: ProviderConfig = {
  name: 'claude',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 200,
  apiKeyEnv: 'ANTHROPIC_API_KEY'
}

export const OPENAI_CONFIG: ProviderConfig = {
  name: 'openai',
  model: 'gpt-5.1',
  maxTokens: 200,
  apiKeyEnv: 'OPENAI_API_KEY'
}

// Primary provider - MiniMax
export const PRIMARY_PROVIDER = MINIMAX_CONFIG

// Fallback providers
export const FALLBACK_PROVIDER = CLAUDE_CONFIG
export const TERTIARY_PROVIDER = OPENAI_CONFIG

/**
 * Claude API call with prompt caching
 * Extracted for reuse by router
 */
export async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  byoApiKey?: string | null
): Promise<string> {
  // Check spending cap (skip if using BYO key)
  if (!byoApiKey) {
    const capCheck = checkSpendingCap('anthropic')
    if (!capCheck.allowed) {
      console.error(`[Claude] Spending cap reached: $${capCheck.currentSpend}/$${capCheck.cap}`)
      throw new Error('Anthropic spending cap reached ($200/month). Using fallback.')
    }
  }

  const apiKey = byoApiKey || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Estimate input tokens for cost tracking
  const inputText = systemPrompt + messages.map(m => m.content).join('')
  const estimatedInputTokens = estimateTokens(inputText)

  // Structure system prompt with cache control
  const systemCached = [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' } // Cache for 5 minutes
    }
  ]

  // Structure messages with cache control
  const structuredMessages = messages.map((msg, index) => {
    const contentBlocks: { type: string; text: string; cache_control?: { type: string } }[] = [
      {
        type: 'text',
        text: msg.content
      }
    ]

    // Cache the last message (if there's more than 1 message)
    if (index === messages.length - 1 && messages.length > 1) {
      contentBlocks[0].cache_control = { type: 'ephemeral' }
    }

    return {
      role: msg.role,
      content: contentBlocks
    }
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    body: JSON.stringify({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      system: systemCached,
      messages: structuredMessages
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Claude API error:', errorData)
    throw new Error(errorData.error?.message || 'Claude API request failed')
  }

  const data = await response.json()
  const outputText = data.content[0].text

  // Record spending (skip if using BYO key)
  if (!byoApiKey) {
    const estimatedOutputTokens = estimateTokens(outputText)
    const cost = estimateAnthropicCost(estimatedInputTokens, estimatedOutputTokens)
    recordSpending('anthropic', cost)
  }

  return outputText
}

/**
 * OpenAI API call
 * Extracted for reuse by router
 */
export async function callOpenAI(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  byoApiKey?: string | null
): Promise<string> {
  // Check spending cap (skip if using BYO key)
  if (!byoApiKey) {
    const capCheck = checkSpendingCap('openai')
    if (!capCheck.allowed) {
      console.error(`[OpenAI] Spending cap reached: $${capCheck.currentSpend}/$${capCheck.cap}`)
      throw new Error('OpenAI spending cap reached ($200/month). All providers exhausted.')
    }
  }

  const apiKey = byoApiKey || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Estimate input tokens for cost tracking
  const inputText = systemPrompt + messages.map(m => m.content).join('')
  const estimatedInputTokens = estimateTokens(inputText)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_CONFIG.model,
      max_tokens: OPENAI_CONFIG.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error:', errorData)
    throw new Error(errorData.error?.message || 'OpenAI API request failed')
  }

  const data = await response.json()
  const outputText = data.choices[0].message.content

  // Record spending (skip if using BYO key)
  if (!byoApiKey) {
    const estimatedOutputTokens = estimateTokens(outputText)
    const cost = estimateOpenAICost(estimatedInputTokens, estimatedOutputTokens)
    recordSpending('openai', cost)
  }

  return outputText
}

/**
 * MiniMax API call (Primary Provider)
 */
export async function callMiniMax(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  byoApiKey?: string | null
): Promise<string> {
  // Check spending cap
  if (!byoApiKey) {
    const capCheck = checkSpendingCap('minimax')
    if (!capCheck.allowed) {
      console.error(`[MiniMax] Spending cap reached: $${capCheck.currentSpend}/$${capCheck.cap}`)
      throw new Error('MiniMax spending cap reached ($200/month). Falling back.')
    }
  }

  const apiKey = byoApiKey || process.env.MINIMAX_KEY

  if (!apiKey) {
    throw new Error('MINIMAX_KEY not configured')
  }

  // MiniMax API v2 expects messages with role 'system', 'user', 'assistant'
  const minimaxMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MINIMAX_CONFIG.model,
      messages: minimaxMessages,
      max_tokens: MINIMAX_CONFIG.maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('MiniMax API error:', response.status, errorText)
    throw new Error(`MiniMax API request failed with status ${response.status}`)
  }

  const data = await response.json()

  // MiniMax v2 response format: data.choices[0].message.content
  if (!data.choices || !data.choices[0]?.message?.content) {
    console.error('MiniMax invalid response format:', data)
    throw new Error('Invalid MiniMax response format')
  }

  const outputText = data.choices[0].message.content

  // Record spending
  if (!byoApiKey) {
    const totalTokens = (data.usage?.total_tokens) || estimateTokens(systemPrompt + outputText)
    const cost = estimateMiniMaxCost(totalTokens)
    recordSpending('minimax', cost)
  }

  return outputText
}
