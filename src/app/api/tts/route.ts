/**
 * TTS API Route - ElevenLabs Text-to-Speech (Streaming)
 * Securely generates audio from text using ElevenLabs API
 * Uses streaming endpoint for faster response times
 * 
 * Rate limited: 10 requests/minute per session
 * 
 * SPENDING CAP: $200/month for ElevenLabs
 */

import { NextRequest, NextResponse } from 'next/server'
import { ENV } from '@/lib/config/env'
import {
  checkSpendingCap,
  recordSpending,
  estimateElevenLabsCost
} from '@/lib/spending-caps'
import { getVoiceSettings, type VoiceMood } from '@/lib/voice-modulation'

// ElevenLabs API configuration - using STREAMING endpoint for faster playback
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'

// Default voice - "Adam" (warm, smooth, versatile) - matches frontend
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'

// Rate limiting: Track requests per session
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

interface TTSRequest {
  text: string
  voiceId?: string
  mood?: VoiceMood // Auto-detect or override: sincere, candid, intimate, neutral
  stability?: number // Manual override (if mood not used)
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
    const apiKey = ENV.voice.elevenlabs

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
      mood,
      sessionId = 'anonymous'
    } = body

    // Get dynamic voice settings based on mood/content
    // This achieves the madhyama marg - balancing expressiveness and authenticity
    const voiceSettings = mood || body.stability === undefined
      ? getVoiceSettings(text, mood) // Auto-detect or use provided mood
      : { // Manual override if specific settings provided
        stability: body.stability ?? 0.7,
        similarity_boost: body.similarity_boost ?? 0.7,
        style: body.style ?? 0.2,
        use_speaker_boost: body.use_speaker_boost ?? true
      }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Check spending cap FIRST
    const capCheck = checkSpendingCap('elevenlabs')
    if (!capCheck.allowed) {
      console.error(`[TTS API] Spending cap reached: $${capCheck.currentSpend}/$${capCheck.cap}`)
      return NextResponse.json(
        { error: 'ElevenLabs spending cap reached ($200/month). Voice temporarily unavailable.' },
        { status: 429 }
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

    // Estimate cost before making call
    const estimatedCost = estimateElevenLabsCost(text.trim().length)

    // Call ElevenLabs API - use non-streaming for reliability with longer text
    let response = await fetch(
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
          model_id: 'eleven_multilingual_v2',
          voice_settings: voiceSettings
        })
      }
    )

    // Fallback to OpenAI TTS if ElevenLabs fails
    if (!response.ok) {
      const errorText = await response.text()
      console.warn('[TTS API] ElevenLabs failed, falling back to OpenAI:', response.status, errorText)

      const openaiKey = ENV.ai.openai
      if (openaiKey) {
        response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'nova',
            input: text.trim(),
          })
        })
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Voice synthesis failed (All providers exhausted)` },
        { status: response.status }
      )
    }

    // Record spending after successful call
    recordSpending('elevenlabs', estimatedCost)

    // Return audio as blob
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-Spending-Remaining': capCheck.remaining.toFixed(2),
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
