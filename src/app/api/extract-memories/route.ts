/**
 * Memory Extraction API Route
 * Called asynchronously after chat responses to extract and save user facts
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractMemories, saveMemories } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userMessage, aiResponse, existingMemories = [] } = body

    if (!sessionId || !userMessage || !aiResponse) {
      return NextResponse.json(
        { error: 'sessionId, userMessage, and aiResponse required' },
        { status: 400 }
      )
    }

    // Extract memories using Haiku
    const extracted = await extractMemories(
      userMessage,
      aiResponse,
      existingMemories
    )

    if (extracted.length === 0) {
      return NextResponse.json({ extracted: [], saved: 0 })
    }

    // Get base URL for saving
    const baseUrl = request.nextUrl.origin

    // Save to database
    const saved = await saveMemories(sessionId, extracted, baseUrl)

    return NextResponse.json({
      extracted,
      saved: saved ? extracted.length : 0
    })

  } catch (error) {
    console.error('[API/extract-memories] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
