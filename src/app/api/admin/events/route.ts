import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/events
 * Fetch recent events from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = (await createClient()) as any

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') // Optional filter by event type

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply type filter if provided
    if (type) {
      query = query.eq('type', type)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('[Admin Events API] Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      )
    }

    // Get event type counts
    const { data: typeCounts, error: typeError } = await supabase
      .from('events')
      .select('type')
      .order('created_at', { ascending: false })
      .limit(1000)

    // Count events by type
    const eventTypeCounts: Record<string, number> = {}
    if (typeCounts && !typeError) {
      typeCounts.forEach((event: any) => {
        eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1
      })
    }

    return NextResponse.json({
      events: events || [],
      stats: {
        total: events?.length || 0,
        typeCounts: eventTypeCounts
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Admin Events API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
