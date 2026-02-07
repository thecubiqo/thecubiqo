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
import { routeAIRequest, trackCost } from '@/lib/ai/router'
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
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// Claude and OpenAI functions now in @/lib/ai/providers

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
    const body: ChatRequest & { isGuest?: boolean; messageCount?: number; sessionId?: string; region?: string } = await request.json()
    const { message, conversationHistory = [], currentColor = 'ORANGE', isGuest = false, messageCount = 0, sessionId, region } = body

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

    // Build full system prompt with memory, regional context, and optional auth nudge
    const authNudge = buildAuthNudgePrompt(isGuest, messageCount)
    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext + regionalContext + authNudge

    // NEW ROUTER: Try Ollama first (local, free, no guardrails), fallback to cloud
    const routerResult = await routeAIRequest({
      systemPrompt: fullSystemPrompt,
      messages,
      byoClaudeKey,
      byoOpenaiKey,
      forceCloud: false, // Let router decide
      preferredCloud: 'openclaw'
    })

    const content = routerResult.content
    const provider = routerResult.provider

    // Track cost for analytics
    trackCost(provider, routerResult.cost)

    console.log('[Chat] Provider used:', provider, '| Cost:', routerResult.cost.toFixed(6), 'USD')

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
