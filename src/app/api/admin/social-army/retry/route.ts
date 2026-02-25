/**
 * Social Army: Retry Failed Items API
 *
 * POST /api/admin/social-army/retry
 * Body: { campaignId?: string, itemIds?: string[] }
 *
 * Resets failed content_queue items back to 'pending' so the worker re-processes them.
 * If campaignId is provided, retries all failed items for that campaign.
 * If itemIds is provided, retries only those specific items.
 * If neither, retries ALL failed items.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const body = await request.json()
    const { campaignId, itemIds } = body

    const supabase = createAdminClient()

    let query = (supabase as any)
      .from('content_queue')
      .update({ generation_status: 'pending', caption: null, asset_url: null })
      .eq('generation_status', 'failed')

    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      query = query.in('id', itemIds)
    } else if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    const { data, error, count } = await query.select('id')

    if (error) throw new Error(error.message)

    const retried = data?.length ?? 0

    console.info('[Social Army Retry] Reset failed items', {
      count: retried,
      campaignId: campaignId || 'all',
      adminUserId: authResult.user?.id,
    })

    return NextResponse.json({
      success: true,
      retried,
      message: retried > 0
        ? `Reset ${retried} failed item${retried !== 1 ? 's' : ''} to pending`
        : 'No failed items found to retry',
    })
  } catch (error) {
    console.error('[Social Army Retry] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
