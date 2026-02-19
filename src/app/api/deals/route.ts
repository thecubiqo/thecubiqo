/**
 * Deals API Route
 * GET /api/deals?category=food&query=sushi&maxResults=5
 * POST /api/deals  { message: "I want sushi deals" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchDeals, getContextualDeals } from '@/lib/deals'
import type { DealCategory, DealsQuery } from '@/lib/deals'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const query: DealsQuery = {
      category: (searchParams.get('category') as DealCategory) || undefined,
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      maxResults: searchParams.get('maxResults')
        ? parseInt(searchParams.get('maxResults')!, 10)
        : 5,
    }

    const result = await fetchDeals(query)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Deals API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, maxResults = 3 } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const deals = await getContextualDeals(message, maxResults)

    return NextResponse.json({
      deals,
      hasDeals: deals.length > 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Deals API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contextual deals' },
      { status: 500 }
    )
  }
}
