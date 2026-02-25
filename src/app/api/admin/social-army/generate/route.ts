/**
 * Social Army: Generate Content API
 *
 * POST /api/admin/social-army/generate
 * Body: { campaignId: string }
 *
 * Seeds content_queue rows for every active social_account tied to this campaign.
 * Each row gets generation_status = 'pending' so the worker picks it up,
 * OR content is generated inline if no worker is available.
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
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify campaign exists and is running
    const { data: campaign, error: campaignError } = await (supabase as any)
      .from('social_campaigns')
      .select('id, name, seed_topic, status, total_posts_target')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'running') {
      return NextResponse.json(
        { error: `Campaign is "${campaign.status}" — must be "running" to generate content` },
        { status: 400 }
      )
    }

    // Check if there are already pending/processing items
    const { count: existingWork } = await (supabase as any)
      .from('content_queue')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('generation_status', ['pending', 'processing'])

    if ((existingWork ?? 0) > 0) {
      return NextResponse.json(
        { error: `Campaign already has ${existingWork} items being generated. Wait for them to complete.` },
        { status: 409 }
      )
    }

    // Fetch all active accounts
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('social_accounts')
      .select('id, platform, persona_type')
      .eq('status', 'active')

    if (accountsError) throw new Error(accountsError.message)

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No active social accounts found. Add accounts first.' },
        { status: 400 }
      )
    }

    // Seed one content_queue item per active account
    const rows = accounts.map((acc: any) => ({
      campaign_id: campaignId,
      target_account_id: acc.id,
      content_type: Math.random() > 0.3 ? 'text' : 'image',
      generation_status: 'pending',
      caption: null,
      asset_url: null,
    }))

    const { data: inserted, error: insertError } = await (supabase as any)
      .from('content_queue')
      .insert(rows)
      .select('id')

    if (insertError) throw new Error(insertError.message)

    console.info('[Social Army Generate] Seeded content queue', {
      campaignId,
      campaignName: campaign.name,
      itemCount: rows.length,
      adminUserId: authResult.user?.id,
    })

    return NextResponse.json({
      success: true,
      seeded: rows.length,
      campaign: campaign.name,
      message: `Queued ${rows.length} content items for ${accounts.length} active accounts`,
    }, { status: 201 })
  } catch (error) {
    console.error('[Social Army Generate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
