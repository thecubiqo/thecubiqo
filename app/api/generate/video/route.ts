/**
 * Video Generation API Route
 * Placeholder for video generation - coming soon
 * 
 * Video generation requires specialized APIs (e.g., Runway, Pika)
 * This endpoint returns status information and will be enabled when
 * a video generation provider is configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { VideoGenerationRequest, VideoGenerationResponse } from '@/types/media'

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json()
    const { prompt } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Video generation is coming soon
    const result: VideoGenerationResponse = {
      status: 'pending',
      message: 'Video generation is coming soon. This feature is under development. Try image generation in the meantime!',
      prompt: prompt.trim(),
      createdAt: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Video Gen] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
