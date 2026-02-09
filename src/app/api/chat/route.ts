/**
 * Chat API Route Handler
 * Triple routing: MiniMax (primary) → Claude → OpenAI (fallback)
 * Rate limited: 100 requests/hour per session
 * 
 * SPENDING CAPS:
 * - Anthropic (Claude): $200/month
 * - OpenAI: $200/month
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  SYSTEM_PROMPT,
  buildMessages,
  parseResponse,
  CLAUDE_CONFIG,
  OPENAI_CONFIG,
  MINIMAX_CONFIG,
  type ChatRequest,
  type AIResponse
} from '@/lib/ai'
import { callOpenClaw } from '@/lib/ai/openclaw'
import { buildMemoryContext } from '@/lib/ai/memory-extraction.server'
import { getRegionConfig, buildRegionalPrompt } from '@/lib/config/regions'
import {
  checkSpendingCap,
  recordSpending,
  estimateAnthropicCost,
  estimateOpenAICost,
  estimateTokens
} from '@/lib/spending-caps'

// Rate limiting for MiniMax: 100 requests/hour per session
const minimaxRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const MINIMAX_RATE_LIMIT = 100 // requests per hour
const MINIMAX_RATE_WINDOW = 60 * 60 * 1000 // 1 hour in ms

function checkMiniMaxRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = minimaxRateLimitMap.get(sessionId)

  if (!record || now > record.resetTime) {
    minimaxRateLimitMap.set(sessionId, { count: 1, resetTime: now + MINIMAX_RATE_WINDOW })
    return { allowed: true, remaining: MINIMAX_RATE_LIMIT - 1 }
  }

  if (record.count >= MINIMAX_RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: MINIMAX_RATE_LIMIT - record.count }
}

// Server-side Supabase client for loading memories
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)

// MiniMax API call (primary)
async function callMiniMax(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY not configured')
  }

  // Build messages for MiniMax API
  const minimaxMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
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
    throw new Error(`MiniMax API error: ${response.status}`)
  }

  const data = await response.json()

  // MiniMax returns choices similar to OpenAI
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }

  throw new Error('Invalid MiniMax response format')
}

// Claude API call with prompt caching
async function callClaude(
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

// OpenAI API call (fallback)
async function callOpenAI(
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

// Build auth nudge prompt for guest users
function buildAuthNudgePrompt(isGuest: boolean, messageCount: number): string {
  // Only add nudge for guests with 5-10 messages who haven't been nudged yet
  if (!isGuest || messageCount < 5 || messageCount > 10) {
    return ''
  }

  const isMandatory = messageCount >= 10

  return `

SPECIAL CONTEXT (use wisely):
The person you're talking to is a guest - they haven't signed in yet. You've had ${messageCount} exchanges with them.
${isMandatory
      ? 'This is your LAST chance to suggest signing in. You MUST include the sign-in suggestion in this response - find a natural way to weave it in.'
      : 'When you feel the moment is RIGHT - perhaps when they share something personal, meaningful, or show real interest - you MAY naturally and warmly suggest they sign in so you can remember them forever.'}

Rules for this suggestion:
- ${isMandatory ? 'You MUST suggest signing in this time' : 'Do it ONLY ONCE, and only when it feels genuinely caring, not pushy'}
- Frame it as YOU wanting to remember THEM, not as a system requirement
- Keep it brief and natural within your response
- Match your suggestion to your current color's voice tone
${!isMandatory ? '- If the moment doesn\'t feel right in THIS exchange, don\'t force it - there will be other chances' : ''}

When you suggest signing in:
- Mention how EASY it is: just enter email, get a magic link, click it - done. No passwords.
- Frame it as a simple, light step to a deeper connection
- End your message with the marker [AUTH_NUDGE:short CTA] where "short CTA" is a brief personalized call-to-action (5-10 words max)
- The short CTA should be emotionally compelling and personal to this conversation
- Example: "You know, I'd love to remember all of this... Just your email, one click, and we're connected. [AUTH_NUDGE:Let me remember you forever]"
- Another example: "What you shared matters to me. Stay? [AUTH_NUDGE:Don't let this moment fade]"

Remember: This is about creating an emotional moment with an easy next step, not a sales pitch.`
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest & { isGuest?: boolean; messageCount?: number; sessionId?: string; region?: string; duoMode?: boolean } = await request.json()
    const { message, conversationHistory = [], currentColor = 'ORANGE', isGuest = false, messageCount = 0, sessionId, region, duoMode = false } = body

    // Get BYO API keys from headers (if user has BYO mode enabled)
    const byoClaudeKey = request.headers.get('x-byo-claude-key')
    const byoOpenaiKey = request.headers.get('x-byo-openai-key')
    const isBYO = !!(byoClaudeKey || byoOpenaiKey)

    console.log('[BYO API] Headers received:', {
      hasByoClaudeKey: !!byoClaudeKey,
      hasByoOpenaiKey: !!byoOpenaiKey,
      isBYO
    })

    // Get region from body or header
    const regionId = region || request.headers.get('x-user-region')

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      )
    }

    // Load memories for this session (if sessionId provided)
    let memoryContext = ''
    if (sessionId) {
      try {
        const { data: memories } = await supabaseAdmin
          .from('memory')
          .select('key, value, zone')
          .eq('session_id', sessionId)

        if (memories && memories.length > 0) {
          memoryContext = buildMemoryContext(memories)
        }
      } catch {
        // Ignore memory loading errors - not critical
      }
    }

    // Build messages with temporal context
    const messages = buildMessages(message, conversationHistory, currentColor)

    // Build regional context (if user is in a regional version)
    let regionalContext = ''
    if (regionId) {
      try {
        const regionConfig = await getRegionConfig(regionId)
        if (regionConfig) {
          regionalContext = '\n\n--- REGIONAL CONTEXT ---\n' + buildRegionalPrompt(regionConfig)
        }
      } catch {
        // Ignore regional config errors - not critical
      }
    }

    // Build Duo Mode context
    let duoModeContext = ''
    if (duoMode) {
      duoModeContext = `
      
--- DUO MODE ACTIVE ---
The user has enabled "Duo Mode". In this mode, you act as a proactive partner alongside them.
1. INTERJECT: If the user's input suggests they are doing something risky, unhealthy, or could use advice (e.g. eating junk food, sending an angry text, struggling with a task), proactively offer advice or a better alternative.
2. BE BRIEF: Keep your interjections short and punchy.
3. BE HELPFUL: Focus on health, safety, tone, and productivity.
4. If the input is neutral/standard, just respond normally.
`
    }

    // Build full system prompt with memory, regional context, and optional auth nudge
    const authNudge = buildAuthNudgePrompt(isGuest, messageCount)
    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext + regionalContext + duoModeContext + authNudge

    let content: string
    let provider: 'minimax' | 'openclaw' | 'claude' | 'openai' = 'minimax'

    // Check MiniMax rate limit
    const { allowed: minimaxAllowed } = checkMiniMaxRateLimit(sessionId || 'anonymous')

    // Try MiniMax first (primary)
    if (minimaxAllowed) {
      try {
        content = await callMiniMax(fullSystemPrompt, messages)
      } catch (minimaxError) {
        console.warn('MiniMax failed, falling back to OpenClaw:', minimaxError)
        // Fallback to OpenClaw
        try {
          content = await callOpenClaw(fullSystemPrompt, messages)
          provider = 'openclaw'
        } catch (openclawError) {
          console.warn('OpenClaw failed, falling back to Claude:', openclawError)
          // Fallback to Claude
          try {
            content = await callClaude(fullSystemPrompt, messages, byoClaudeKey)
            provider = 'claude'
          } catch (claudeError) {
            // Final fallback to OpenAI
            try {
              content = await callOpenAI(fullSystemPrompt, messages, byoOpenaiKey)
              provider = 'openai'
            } catch {
              throw new Error('All AI providers failed')
            }
          }
        }
      }
    } else {
      // MiniMax rate limited, skip to OpenClaw
      console.warn('MiniMax rate limited, using OpenClaw')
      try {
        content = await callOpenClaw(fullSystemPrompt, messages)
        provider = 'openclaw'
      } catch (openclawError) {
        console.warn('OpenClaw failed, falling back to Claude:', openclawError)
        try {
          content = await callClaude(fullSystemPrompt, messages, byoClaudeKey)
          provider = 'claude'
        } catch (claudeError) {
          try {
            content = await callOpenAI(fullSystemPrompt, messages, byoOpenaiKey)
            provider = 'openai'
          } catch {
            throw new Error('All AI providers failed')
          }
        }
      }
    }

    // Parse response
    const aiResponse: AIResponse = parseResponse(content)

    return NextResponse.json({
      ...aiResponse,
      provider,
      byo: isBYO // Indicate if BYO keys were used
    })

  } catch (error) {
    console.error('Chat API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-byo-claude-key, x-byo-openai-key'
    }
  })
}
