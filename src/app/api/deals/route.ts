/**
 * Deals API Route
 * GET /api/deals?category=food&query=sushi&maxResults=5
 * POST /api/deals  { message: "I want sushi deals" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchDeals, getContextualDeals } from '@/lib/deals'
import type { DealCategory, DealsQuery } from '@/lib/deals'

const VALID_CATEGORIES: DealCategory[] = [
  'food', 'travel', 'shopping', 'entertainment', 'health',
  'beauty', 'services', 'electronics', 'fitness', 'education',
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const rawCategory = searchParams.get('category')
    const category = rawCategory && VALID_CATEGORIES.includes(rawCategory as DealCategory)
      ? (rawCategory as DealCategory)
      : undefined

    const rawMax = searchParams.get('maxResults')
    const parsedMax = rawMax ? parseInt(rawMax, 10) : NaN
    const maxResults = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 5

    const query: DealsQuery = {
      category,
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      maxResults,
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
    const { message } = body
    const rawMax = typeof body.maxResults === 'number' ? body.maxResults : 3
    const maxResults = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 3

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
