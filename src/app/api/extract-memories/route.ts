/**
 * Memory Extraction API Route
 * Called asynchronously after chat responses to extract and save user facts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractMemories } from '@/lib/ai/memory-extraction.server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL1 || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY1 || 'placeholder-key'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userMessage, aiResponse, existingMemories = [] } = body

    // Get BYO API key from header (if user has BYO mode enabled)
    const byoClaudeKey = request.headers.get('x-byo-claude-key')

    if (!sessionId || !userMessage || !aiResponse) {
      return NextResponse.json(
        { error: 'sessionId, userMessage, and aiResponse required' },
        { status: 400 }
      )
    }

    // Extract memories using Haiku (with BYO key if provided)
    const extracted = await extractMemories(
      userMessage,
      aiResponse,
      existingMemories,
      byoClaudeKey || undefined
    )

    if (extracted.length === 0) {
      return NextResponse.json({ extracted: [], saved: 0 })
    }

    // Save to database
    let savedCount = 0
    for (const mem of extracted) {
      const { data: existing } = await supabaseAdmin
        .from('memory')
        .select('id')
        .eq('session_id', sessionId)
        .eq('key', mem.key)
        .maybeSingle()

      if (existing) {
        await supabaseAdmin
          .from('memory')
          .update({ value: mem.value, zone: mem.zone })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin
          .from('memory')
          .insert({
            session_id: sessionId,
            key: mem.key,
            value: mem.value,
            zone: mem.zone
          })
      }
      savedCount++
    }

    return NextResponse.json({
      extracted,
      saved: savedCount
    })

  } catch (error) {
    console.error('[API/extract-memories] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS (BYO headers)
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
