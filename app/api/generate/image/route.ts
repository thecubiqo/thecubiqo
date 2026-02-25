/**
 * Image Generation API Route
 * Generates images using OpenAI DALL-E 3 API
 * 
 * Rate limited: 5 requests/hour per session
 * Spending cap: $50/month for image generation
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ImageGenerationRequest, ImageGenerationResponse } from '@/types/media'

// Rate limiting: 5 image generations per hour per session
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour

// Simple in-memory spending tracker for image generation
let imageSpending = { total: 0, monthStart: getMonthStart() }
const IMAGE_SPENDING_CAP = 50 // $50/month

function getMonthStart(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

function checkMonthlyReset(): void {
  const currentMonthStart = getMonthStart()
  if (currentMonthStart > imageSpending.monthStart) {
    imageSpending = { total: 0, monthStart: currentMonthStart }
  }
}

// DALL-E 3 costs: ~$0.04 (standard 1024x1024), ~$0.08 (standard 1024x1792/1792x1024), ~$0.08 (hd 1024x1024), ~$0.12 (hd 1024x1792/1792x1024)
function estimateImageCost(quality: string, size: string): number {
  if (quality === 'hd') {
    return size === '1024x1024' ? 0.08 : 0.12
  }
  return size === '1024x1024' ? 0.04 : 0.08
}

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(sessionId)

  if (!record || now > record.resetTime) {
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
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Set OPENAI_API_KEY to enable image generation.' },
        { status: 500 }
      )
    }

    const body: ImageGenerationRequest = await request.json()
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      sessionId = 'anonymous'
    } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (prompt.trim().length > 4000) {
      return NextResponse.json(
        { error: 'Prompt must be 4000 characters or fewer' },
        { status: 400 }
      )
    }

    // Validate size
    const validSizes = ['1024x1024', '1024x1792', '1792x1024']
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${validSizes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check spending cap
    checkMonthlyReset()
    const estimatedCost = estimateImageCost(quality, size)
    if (imageSpending.total + estimatedCost > IMAGE_SPENDING_CAP) {
      return NextResponse.json(
        { error: 'Image generation spending cap reached ($50/month). Please try again next month.' },
        { status: 429 }
      )
    }

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(sessionId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 image generations per hour.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    // Call OpenAI DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.trim(),
        n: 1,
        size,
        quality,
        style,
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Image Gen] OpenAI error:', response.status, errorData)

      if (response.status === 400 && errorData?.error?.code === 'content_policy_violation') {
        return NextResponse.json(
          { error: 'Your prompt was flagged by content policy. Please try a different prompt.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Image generation failed: ${errorData?.error?.message || response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const imageData = data.data?.[0]

    if (!imageData?.url) {
      return NextResponse.json(
        { error: 'No image was generated. Please try again.' },
        { status: 500 }
      )
    }

    // Record spending
    imageSpending.total += estimatedCost
    console.log(`[Image Gen] Cost: $${estimatedCost.toFixed(2)} | Total: $${imageSpending.total.toFixed(2)} / $${IMAGE_SPENDING_CAP}`)

    const result: ImageGenerationResponse = {
      url: imageData.url,
      prompt: prompt.trim(),
      revisedPrompt: imageData.revised_prompt,
      size,
      quality,
      style,
      provider: 'openai',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString()
      }
    })
  } catch (error) {
    console.error('[Image Gen] Error:', error)
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
