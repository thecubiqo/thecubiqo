/**
 * Social Army: System Status API
 *
 * GET /api/admin/social-army/status
 *
 * Returns operational status:
 * - 10 supported platforms
 * - Account coverage per platform
 * - GFXToolz connection status
 * - Available API keys (Gemini, OpenAI, etc.)
 * - Content engine fallback chain
 * - Posting readiness
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const PLATFORMS = [
  'twitter', 'tiktok', 'linkedin', 'instagram',
  'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord',
] as const

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const supabase = createAdminClient()

    // Count accounts per platform
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('social_accounts')
      .select('platform, status')

    if (accountsError) throw new Error(accountsError.message)

    const platformCoverage: Record<string, { total: number; active: number }> = {}
    for (const platform of PLATFORMS) {
      platformCoverage[platform] = { total: 0, active: 0 }
    }
    for (const acc of (accounts ?? [])) {
      if (platformCoverage[acc.platform]) {
        platformCoverage[acc.platform].total++
        if (acc.status === 'active') platformCoverage[acc.platform].active++
      }
    }

    // Check GFXToolz credentials
    const hasGfxUser = !!process.env.GFX_TOOLZ_USER
    const hasGfxPass = !!process.env.GFX_TOOLZ_PASS
    const gfxConnected = hasGfxUser && hasGfxPass

    // Check API keys for fallback chain
    const hasGemini = !!process.env.GEMINI_API_KEY
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    // Determine content engine status
    let contentEngine: string
    if (gfxConnected) {
      contentEngine = 'gfxtoolz (primary)'
    } else if (hasGemini) {
      contentEngine = 'gemini (fallback)'
    } else if (hasOpenAI) {
      contentEngine = 'openai (fallback)'
    } else {
      contentEngine = 'template (offline mode)'
    }

    // Count campaigns
    const { data: campaigns } = await (supabase as any)
      .from('social_campaigns')
      .select('status')

    const campaignCounts = {
      total: (campaigns ?? []).length,
      running: (campaigns ?? []).filter((c: any) => c.status === 'running').length,
      paused: (campaigns ?? []).filter((c: any) => c.status === 'paused').length,
    }

    // Queue stats
    const queueCounts: Record<string, number> = {}
    for (const status of ['pending', 'processing', 'ready', 'posted', 'failed']) {
      const { count } = await (supabase as any)
        .from('content_queue')
        .select('id', { count: 'exact', head: true })
        .eq('generation_status', status)
      queueCounts[status] = count ?? 0
    }

    const totalAccounts = (accounts ?? []).length
    const activeAccounts = (accounts ?? []).filter((a: any) => a.status === 'active').length
    const platformsWithAccounts = PLATFORMS.filter(p => platformCoverage[p].active > 0).length

    return NextResponse.json({
      system: {
        platforms: PLATFORMS.length,
        platformsWithAccounts,
        allPlatformsCovered: platformsWithAccounts === PLATFORMS.length,
      },
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        byPlatform: platformCoverage,
      },
      contentEngine: {
        status: contentEngine,
        gfxtoolz: {
          connected: gfxConnected,
          hasUser: hasGfxUser,
          hasPass: hasGfxPass,
        },
        fallbacks: {
          gemini: hasGemini,
          openai: hasOpenAI,
          template: true, // always available
        },
      },
      campaigns: campaignCounts,
      queue: queueCounts,
      readiness: {
        canCreateAccounts: true,
        canGenerateContent: true, // template engine always works
        canPost: activeAccounts > 0,
        canPostAllPlatforms: platformsWithAccounts === PLATFORMS.length,
        message: platformsWithAccounts === PLATFORMS.length
          ? `✅ All ${PLATFORMS.length} platforms covered with ${activeAccounts} active accounts`
          : `⚠️ ${PLATFORMS.length - platformsWithAccounts} platform(s) missing active accounts`,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Social Army Status] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
