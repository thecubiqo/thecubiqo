/**
 * Admin: Social Army API
 *
 * Server-side guarded endpoints for managing social campaigns and
 * inspecting the content queue.  All mutations go through here so
 * that the admin auth guard is enforced server-side — the UI must
 * NOT write directly to Supabase from the browser.
 *
 * Routes
 * ──────
 * GET  /api/admin/social-army          — overview (campaigns + queue stats + accounts)
 * POST /api/admin/social-army          — create a new campaign
 * PATCH /api/admin/social-army?id=…   — update campaign status (running / paused / stopped)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const supabase = createAdminClient()

    // Campaigns with progress
    const { data: campaigns, error: campaignsError } = await (supabase as any)
      .from('social_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (campaignsError) throw new Error(campaignsError.message)

    // Augment each campaign with posted/total counts
    const campaignsWithProgress = await Promise.all(
      (campaigns ?? []).map(async (c: any) => {
        const { count: posted } = await (supabase as any)
          .from('content_queue')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', c.id)
          .eq('generation_status', 'posted')

        return {
          id: c.id,
          name: c.name,
          seed_topic: c.seed_topic,
          status: c.status ?? 'draft',
          total_posts_target: c.total_posts_target ?? 0,
          posted_count: posted ?? 0,
          progress:
            c.total_posts_target > 0
              ? Math.min(Math.round(((posted ?? 0) / c.total_posts_target) * 100), 100)
              : 0,
          created_at: c.created_at,
        }
      })
    )

    // Queue summary
    const queueStatusCounts: Record<string, number> = {}
    for (const status of ['pending', 'processing', 'ready', 'posted', 'failed']) {
      const { count } = await (supabase as any)
        .from('content_queue')
        .select('id', { count: 'exact', head: true })
        .eq('generation_status', status)
      queueStatusCounts[status] = count ?? 0
    }

    // Recent queue items
    const { data: recentQueue } = await (supabase as any)
      .from('content_queue')
      .select('id, generation_status, content_type, caption, asset_url, posted_at, created_at, social_campaigns(name)')
      .order('created_at', { ascending: false })
      .limit(10)

    // Active accounts
    const { data: accounts } = await (supabase as any)
      .from('social_accounts')
      .select('id, username, platform, persona_type, status')
      .order('platform')

    return NextResponse.json({
      campaigns: campaignsWithProgress,
      queue: {
        summary: queueStatusCounts,
        recent: recentQueue ?? [],
      },
      accounts: accounts ?? [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Admin Social Army] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const body = await request.json()
    const { name, seed_topic, total_posts_target = 100 } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: campaign, error } = await (supabase as any)
      .from('social_campaigns')
      .insert({
        name: name.trim(),
        seed_topic: seed_topic?.trim() || 'AI Revolution',
        status: 'running',
        total_posts_target,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    console.info('[Admin Social Army] Campaign created', {
      campaignId: campaign.id,
      name: campaign.name,
      adminUserId: authResult.user?.id,
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('[Admin Social Army] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    const VALID_STATUSES = ['running', 'paused', 'stopped', 'draft']
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: campaign, error } = await (supabase as any)
      .from('social_campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    console.info('[Admin Social Army] Campaign updated', {
      campaignId: id,
      status,
      adminUserId: authResult.user?.id,
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('[Admin Social Army] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Delete queue items first (FK constraint)
    await (supabase as any).from('content_queue').delete().eq('campaign_id', id)

    const { error } = await (supabase as any)
      .from('social_campaigns')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[Admin Social Army] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
