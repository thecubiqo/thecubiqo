/**
 * TTS API Route - ElevenLabs Text-to-Speech
 * Securely generates audio from text using ElevenLabs API
 * 
 * Rate limited: 10 requests/minute per session
 */

import { NextRequest, NextResponse } from 'next/server'

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

// Default voice - "Adam" (deep, versatile male voice)
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'

// Rate limiting: Track requests per session
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

interface TTSRequest {
  text: string
  voiceId?: string
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(sessionId)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(sessionId, { count: 1, resetTime: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: RATE_LIMIT - record.count }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    
    console.log('[TTS API] Request received, API key present:', !!apiKey)
    
    if (!apiKey) {
      console.error('[TTS API] ELEVENLABS_API_KEY not found in environment')
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }
    
    const body: TTSRequest & { sessionId?: string } = await request.json()
    const { 
      text, 
      voiceId = DEFAULT_VOICE_ID,
      stability = 0.7,
      similarity_boost = 0.7,
      style = 0.2,
      use_speaker_boost = true,
      sessionId = 'anonymous'
    } = body
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }
    
    // Check rate limit
    const { allowed, remaining } = checkRateLimit(sessionId)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }
    
    // Call ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_API_URL}/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[TTS API] ElevenLabs error:', response.status, errorText)
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'ElevenLabs rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Return audio as blob
    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-RateLimit-Remaining': remaining.toString(),
        'Cache-Control': 'no-store'
      }
    })
    
  } catch (error) {
    console.error('[TTS API] Error:', error)
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
