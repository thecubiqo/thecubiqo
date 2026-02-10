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
import { getRegionConfig, buildRegionalPrompt } from '@/lib/config/regions'
import { PolicyRouter, ZoneColor } from '@/lib/ai/policy-router'
import { SemanticCache } from '@/lib/ai/cache'

// Server-side Supabase client for loading memories
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY1 || 'placeholder-key'
)

// Build auth nudge prompt for guest users
function buildAuthNudgePrompt(isGuest: boolean, messageCount: number): string {
  if (!isGuest || messageCount < 5 || messageCount > 10) return ''
  const isMandatory = messageCount >= 10
  return `
SPECIAL CONTEXT (use wisely):
The person you're talking to is a guest. You've had ${messageCount} exchanges.
${isMandatory ? 'You MUST suggest signing in.' : 'You MAY naturally suggest signing in.'}
Rules: mention no passwords, easy magic link. End with [AUTH_NUDGE:short CTA].`
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest & { isGuest?: boolean; messageCount?: number; sessionId?: string; region?: string; duoMode?: boolean; context?: string; userId?: string } = await request.json()
    const { message, conversationHistory = [], currentColor = 'ORANGE', isGuest = false, messageCount = 0, sessionId, region, duoMode = false, context, userId } = body

    // Get region from body or header
    const regionId = region || request.headers.get('x-user-region')

    if (!message) {
      return NextResponse.json({ error: 'Missing required field: message' }, { status: 400 })
    }

    // Load memories
    let memoryContext = ''
    if (sessionId) {
      try {
        const { data: memories } = await supabaseAdmin.from('memory').select('key, value, zone').eq('session_id', sessionId)
        if (memories?.length) memoryContext = buildMemoryContext(memories)
      } catch {
        // Ignore memory loading errors - not critical
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

    let duoModeContext = ''
    if (duoMode) {
      duoModeContext = `\n--- DUO MODE ACTIVE ---\nProactively interject with brief, helpful advice if user behavior is risky/unhealthy.`
    }

    let extensionContext = ''
    if (context) {
      extensionContext = `\n\n[USER CONTEXT]\nUser viewing: ${context}\n`
    }

    const authNudge = buildAuthNudgePrompt(isGuest, messageCount)
    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext + regionalContext + duoModeContext + extensionContext + authNudge

    // --- POLICY ROUTER & CACHING ---

    // Map App Colors to Router Zones
    let zone: ZoneColor = 'GREEN'
    if (currentColor === 'YELLOW' || currentColor === 'ORANGE') zone = 'YELLOW'
    if (currentColor === 'GREEN_BLUE') zone = 'GREEN'
    if (currentColor === 'RED') zone = 'RED'

    // Check Cache
    const cacheKey = fullSystemPrompt + messages.map(m => m.content).join('')
    const cachedResponse = await SemanticCache.get(cacheKey, zone)

    if (cachedResponse) {
      console.log('[API] Cache Hit!')
      return NextResponse.json({ ...parseResponse(cachedResponse), provider: 'cache', byo: false })
    }

    console.log(`[API] Routing to ${zone} zone`)

    let content: string
    try {
      content = await PolicyRouter.route(fullSystemPrompt, messages, {
        zone,
        reasoning: false, // Default to false until UI toggle added
        userId: userId || 'anonymous',
        sessionId
      })

      // Save to Cache
      SemanticCache.set(cacheKey, content, zone)

    } catch (error) {
      console.error('[API] Router Failed:', error)
      throw new Error('AI Router failed.')
    }

    return NextResponse.json({
      ...parseResponse(content),
      provider: 'openrouter', // Abstraction
      byo: false
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
