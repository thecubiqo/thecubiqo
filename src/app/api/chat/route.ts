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
  type ChatRequest,
  type AIResponse
} from '@/lib/ai'
import { buildMemoryContext } from '@/lib/ai/memory-extraction.server'
import { FOUNDER_SYSTEM_PROMPT } from '@/lib/ai/founder-prompt'
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
// Made optional during build to prevent errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY1;
if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase')) {
  supabaseAdmin = createClient(supabaseUrl, supabaseKey);
}

// Claude and OpenAI functions now in @/lib/ai/providers

// Build auth nudge prompt for guest users
function buildAuthNudgePrompt(isGuest: boolean, messageCount: number): string {
  if (!isGuest || messageCount < 5 || messageCount > 10) return ''
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
    const body: ChatRequest & { isGuest?: boolean; messageCount?: number; sessionId?: string; region?: string; duoMode?: boolean; context?: string; userId?: string; isFounder?: boolean } = await request.json()
    const { message, conversationHistory = [], currentColor = 'ORANGE', isGuest = false, messageCount = 0, sessionId, region, duoMode = false, context, userId } = body
    let isFounder = body.isFounder || false

    // Get region from body or header
    const regionId = region || request.headers.get('x-user-region')

    if (!message) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 })
    }

    // Load memories and check Founder status
    let memoryContext = ''
    let abTestVariant: 'A' | 'B' = 'A'

    if (sessionId) {
      // Deterministic AB Test Variant based on Session ID
      const firstChar = sessionId.charCodeAt(0)
      abTestVariant = firstChar % 2 === 0 ? 'A' : 'B'
      console.log('[AB Test] Variant:', abTestVariant, 'Session:', sessionId)

      try {
        // Parallel: Load memories AND check user profile
        if (supabaseAdmin) {
          const [memoriesResult, sessionResult] = await Promise.all([
            supabaseAdmin
              .from('memory')
              .select('key, value, zone')
              .eq('session_id', sessionId),

            supabaseAdmin
              .from('sessions')
              .select('user_id, profiles(email)')
              .eq('id', sessionId)
              .single()
          ])

          // Process Memories
          const memories = memoriesResult.data
          if (memories && memories.length > 0) {
            memoryContext = buildMemoryContext(memories)
          }

          // Process Founder Status
          const sessionData = sessionResult.data as any
          if (sessionData?.profiles) {
            const email = sessionData.profiles.email
            if (email === 'aditya@cubiqo.ai') {
              isFounder = true
              console.log('[Chat] 👑 Founder identified:', email)
            }
          }
        }
      } catch (e) {
        console.warn('[Chat] Stats lookup failed:', e)
        // Non-critical, continue
      }
    }

    // Build messages & Context
    const messages = buildMessages(message, conversationHistory, currentColor)

    let regionalContext = ''
    if (regionId) {
      try {
        const conf = await getRegionConfig(regionId)
        if (conf) regionalContext = '\n\n--- REGIONAL CONTEXT ---\n' + buildRegionalPrompt(conf)
      } catch {
        // Ignore regional config errors - not critical
      }
    }

    // Build full system prompt with memory, regional context, and optional auth nudge
    const authNudge = buildAuthNudgePrompt(isGuest, messageCount)

    // Extension context
    let extensionContext = ''
    if (context) {
      extensionContext = `\n\n[USER CONTEXT]\nUser viewing: ${context}\n`
    }

    // Choose base system prompt
    const basePrompt = isFounder ? FOUNDER_SYSTEM_PROMPT : SYSTEM_PROMPT
    const fullSystemPrompt = basePrompt + memoryContext + regionalContext + extensionContext + authNudge

    // Extract BYO keys from headers
    const byoClaudeKey = request.headers.get('x-byo-claude-key')
    const byoOpenaiKey = request.headers.get('x-byo-openai-key')

    // ROUTER: Try Ollama first (local, free, no guardrails), fallback to cloud
    const routerResult = await routeAIRequest({
      systemPrompt: fullSystemPrompt,
      messages,
      byoClaudeKey,
      byoOpenaiKey,
      forceCloud: false,
      preferredCloud: 'minimax',
      isFounder,
      abTestVariant
    })

    const content = routerResult.content
    const provider = routerResult.provider

    // Track cost for analytics
    trackCost(provider, routerResult.cost)

    console.log('[Chat] Provider used:', provider, '| Cost:', routerResult.cost.toFixed(6), 'USD')

    // Parse the response (extract color and speaker)
    const aiResponse = parseResponse(content)

    return NextResponse.json({
      ...aiResponse,
      provider,
      byo: !!(byoClaudeKey || byoOpenaiKey),
      abTest: abTestVariant
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 })
  }
}

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
