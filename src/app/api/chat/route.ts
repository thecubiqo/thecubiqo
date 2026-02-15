/**
 * Chat API Route Handler
 * Fallback chain: MiniMax (primary) → Mixtral → Llama → Claude Haiku (final fallback)
 * With classification layer to route sensitive content directly to Claude Haiku
 * Rate limited: 100 requests/hour per session
 * 
 * SPENDING CAPS:
 * - Anthropic (Claude): $200/month
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  SYSTEM_PROMPT,
  buildMessages,
  parseResponse,
  CLAUDE_CONFIG,
  MIXTRAL_CONFIG,
  LLAMA_CONFIG,
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
  estimateTokens
} from '@/lib/spending-caps'

// Rate limiting for MiniMax: 100 requests/hour per session
const minimaxRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const MINIMAX_RATE_LIMIT = 100 // requests per hour
const MINIMAX_RATE_WINDOW = 60 * 60 * 1000 // 1 hour in ms
const MAX_RATE_LIMIT_ENTRIES = 10000 // Prevent memory leaks

// Sensitive content patterns for classification layer
// These patterns route messages directly to Claude Haiku for better handling
const SENSITIVE_CONTENT_PATTERNS = [
  /\b(intimate|sexual|erotic|nsfw|adult|explicit)\b/i,
  /\b(love|romance|relationship|dating|flirt)\b.*\b(private|secret|personal)\b/i,
  /\b(feel|feeling|emotion|emotional)\b.*\b(close|connection|bond|deep)\b/i,
]

function checkMiniMaxRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  
  // Cleanup expired entries to prevent memory leak
  if (minimaxRateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, value] of minimaxRateLimitMap.entries()) {
      if (now > value.resetTime) {
        minimaxRateLimitMap.delete(key)
      }
    }
  }
  
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
// Support both old and new env var names (fallback pattern)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Check which API keys are configured
function getConfiguredProviders(): { minimax: boolean; mixtral: boolean; llama: boolean; claude: boolean } {
  return {
    minimax: !!process.env.MINIMAX_API_KEY,
    mixtral: !!process.env.MISTRAL_API_KEY,
    llama: !!process.env.TOGETHER_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY
  }
}

// MiniMax API call (primary)
async function callMiniMax(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  // Support both old and new env var names (fallback pattern)
  const apiKey = process.env.MINIMAX_KEY || process.env.MINIMAX_API_KEY

  if (!apiKey) {
    throw new Error('MINIMAX_KEY or MINIMAX_API_KEY not configured')
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

// Simple classification layer to detect sensitive/intimate content
// Returns true if content should skip directly to Claude Haiku
function classifyMessage(message: string): boolean {
  return SENSITIVE_CONTENT_PATTERNS.some(pattern => pattern.test(message))
}

// Mixtral API call (first fallback)
async function callMixtral(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY

  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured')
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MIXTRAL_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: MIXTRAL_CONFIG.maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Mixtral API error:', response.status, errorText)
    throw new Error(`Mixtral API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }
  
  throw new Error('Invalid Mixtral response format')
}

// Llama API call via Together AI (second fallback)
async function callLlama(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY

  if (!apiKey) {
    throw new Error('TOGETHER_API_KEY not configured')
  }

  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: LLAMA_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: LLAMA_CONFIG.maxTokens,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Llama API error:', response.status, errorText)
    throw new Error(`Llama API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }
  
  throw new Error('Invalid Llama response format')
}

// Claude API call with prompt caching (final fallback)
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
      throw new Error('Anthropic spending cap reached ($200/month). All providers exhausted.')
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

    // Get BYO API key from headers (if user has BYO mode enabled)
    const byoClaudeKey = request.headers.get('x-byo-claude-key')
    const isBYO = !!byoClaudeKey

    console.log('[BYO API] Headers received:', {
      hasByoClaudeKey: !!byoClaudeKey,
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

    // Check which providers are available
    const configured = getConfiguredProviders()
    const hasAnyProvider = configured.minimax || configured.mixtral || configured.llama || configured.claude || !!byoClaudeKey

    if (!hasAnyProvider) {
      console.error('[AI Router] No AI provider API keys configured')
      return NextResponse.json(
        {
          error: 'No AI providers are configured. Please set up at least one API key (MINIMAX_API_KEY, MISTRAL_API_KEY, TOGETHER_API_KEY, or ANTHROPIC_API_KEY) or enable BYO mode with your own API key.',
          code: 'NO_PROVIDERS_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Classify message to determine if we should skip directly to Claude
    const isSensitiveContent = classifyMessage(message)

    let content: string | undefined
    let provider: 'minimax' | 'mixtral' | 'llama' | 'claude' = 'minimax'
    const errors: string[] = []
    
    // If sensitive content detected, skip directly to Claude Haiku
    if (isSensitiveContent) {
      console.log('[AI Router] Sensitive content detected, routing to Claude Haiku')
      try {
        content = await callClaude(fullSystemPrompt, messages, byoClaudeKey)
        provider = 'claude'
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`claude: ${msg}`)
        throw new Error(`Claude failed for sensitive content: ${msg}`)
      }
    } else {
      // Check MiniMax rate limit
      const { allowed: minimaxAllowed } = checkMiniMaxRateLimit(sessionId || 'anonymous')

      // Try MiniMax first (primary) - only if configured
      if (configured.minimax && minimaxAllowed) {
        try {
          content = await callMiniMax(fullSystemPrompt, messages)
        } catch (minimaxError) {
          const msg = minimaxError instanceof Error ? minimaxError.message : 'Unknown error'
          errors.push(`minimax: ${msg}`)
          console.warn('MiniMax failed, falling back:', msg)
        }
      } else if (!configured.minimax) {
        errors.push('minimax: not configured')
      } else {
        errors.push('minimax: rate limited')
      }

      // Try Mixtral if MiniMax didn't succeed
      if (!content && configured.mixtral) {
        try {
          content = await callMixtral(fullSystemPrompt, messages)
          provider = 'mixtral'
        } catch (mixtralError) {
          const msg = mixtralError instanceof Error ? mixtralError.message : 'Unknown error'
          errors.push(`mixtral: ${msg}`)
          console.warn('Mixtral failed, falling back:', msg)
        }
      } else if (!content && !configured.mixtral) {
        errors.push('mixtral: not configured')
      }

      // Try Llama if previous providers didn't succeed
      if (!content && configured.llama) {
        try {
          content = await callLlama(fullSystemPrompt, messages)
          provider = 'llama'
        } catch (llamaError) {
          const msg = llamaError instanceof Error ? llamaError.message : 'Unknown error'
          errors.push(`llama: ${msg}`)
          console.warn('Llama failed, falling back:', msg)
        }
      } else if (!content && !configured.llama) {
        errors.push('llama: not configured')
      }

      // Try Claude as final fallback
      if (!content && (configured.claude || byoClaudeKey)) {
        try {
          content = await callClaude(fullSystemPrompt, messages, byoClaudeKey)
          provider = 'claude'
        } catch (claudeError) {
          const msg = claudeError instanceof Error ? claudeError.message : 'Unknown error'
          errors.push(`claude: ${msg}`)
          console.warn('Claude failed:', msg)
        }
      } else if (!content && !configured.claude && !byoClaudeKey) {
        errors.push('claude: not configured')
      }

      // If no provider succeeded
      if (!content) {
        console.error('[AI Router] All providers failed:', errors.join('; '))
        return NextResponse.json(
          {
            error: 'All AI providers are temporarily unavailable. Please try again in a moment.',
            code: 'ALL_PROVIDERS_FAILED'
          },
          { status: 503 }
        )
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
      'Access-Control-Allow-Headers': 'Content-Type, x-byo-claude-key'
    }
  })
}
