/**
 * AI Stats API - Track cost savings from local Ollama usage
 * Proves that we're running near-free
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCostStats, resetCostStats } from '@/lib/ai/router'

export async function GET() {
  try {
    const stats = getCostStats()
    
    // Calculate percentages
    const ollamaPercentage = stats.totalRequests > 0
      ? (stats.ollamaRequests / stats.totalRequests) * 100
      : 0
    
    const cloudPercentage = stats.totalRequests > 0
      ? (stats.cloudRequests / stats.totalRequests) * 100
      : 0
    
    return NextResponse.json({
      stats: {
        ...stats,
        ollamaPercentage: ollamaPercentage.toFixed(1) + '%',
        cloudPercentage: cloudPercentage.toFixed(1) + '%'
      },
      message: `Saving ${stats.savingsFromOllama.toFixed(4)} USD by using local Ollama`
    })
  } catch (error) {
    console.error('[AI Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'reset') {
      resetCostStats()
      return NextResponse.json({ message: 'Stats reset' })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[AI Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
