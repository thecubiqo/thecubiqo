/**
 * Social Army: Sample Post API
 *
 * POST /api/admin/social-army/sample-post
 * Body: { campaignId?: string, topic?: string }
 *
 * Generates 1 sample post per platform (10 total), using the content engine
 * template fallback. Picks one active account per platform and creates a
 * content_queue entry with generation_status = 'ready' so the worker can post it.
 *
 * If no campaignId is provided, a throwaway "Sample Post" campaign is created.
 * If no topic is provided, uses the default CubiQo topic.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const PLATFORMS = [
  'twitter', 'tiktok', 'linkedin', 'instagram',
  'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord',
] as const

const BRAND = {
  name: 'CubiQo',
  tagline: 'Your AI Life Companion',
  hashtags: ['#CubiQo', '#AICompanion', '#FutureOfAI', '#EmotionalAI', '#PrivacyFirst'],
}

// Platform-specific templates — each generates a single ready-to-post caption
function generateSampleCaption(platform: string, topic: string): string {
  const templates: Record<string, string[]> = {
    twitter: [
      `🚀 ${topic}\n\nBuilding the future of personal AI — one conversation at a time.\n\n${BRAND.hashtags[0]} ${BRAND.hashtags[2]}`,
      `What if your AI actually remembered you? That's ${BRAND.name}.\n\n${BRAND.hashtags[0]} ${BRAND.hashtags[3]}`,
    ],
    tiktok: [
      `POV: Your AI companion just remembered your favorite coffee order ☕️\n\n${topic}\n\n${BRAND.hashtags[0]} #AITok #FYP`,
      `This AI doesn't just answer — it understands 🧠\n\n${topic}\n\n${BRAND.hashtags[0]} #TechTok`,
    ],
    linkedin: [
      `I've been thinking about the future of AI companions.\n\nNot the kind that just answers questions — but one that genuinely understands context, emotion, and privacy.\n\nThat's what we're building at ${BRAND.name}: ${BRAND.tagline}.\n\n${topic}\n\nThe next generation of AI won't replace human connection. It will enhance it.\n\n${BRAND.hashtags[0]} ${BRAND.hashtags[2]}`,
    ],
    instagram: [
      `✨ ${topic}\n\nPrivacy-first. Emotionally intelligent. Always learning.\n\nMeet ${BRAND.name} — ${BRAND.tagline} 🤖💜\n\n${BRAND.hashtags.join(' ')} #AI #TechStartup #Innovation #BuildInPublic #StartupLife`,
    ],
    youtube: [
      `${BRAND.name} — ${topic} | Demo & Deep Dive\n\nIn this video, we explore how ${BRAND.name} is redefining what it means to have an AI companion. Privacy-first, emotionally intelligent, and built for the future.\n\n${BRAND.hashtags.join(' ')}`,
    ],
    reddit: [
      `${topic}\n\nHey r/artificial! We're building ${BRAND.name}, an AI companion that prioritizes privacy and emotional intelligence. No data harvesting — just genuine AI that grows with you.\n\nWould love to hear your thoughts on privacy-first AI. What features matter most to you?`,
    ],
    pinterest: [
      `${BRAND.name}: ${BRAND.tagline} ✨\n\n${topic}\n\nDiscover the future of personal AI — premium design meets emotional intelligence.\n\n${BRAND.hashtags[0]} ${BRAND.hashtags[2]}`,
    ],
    threads: [
      `the future of AI isn't chatbots — it's companions that actually understand you 🧵\n\n${topic}\n\nthat's ${BRAND.name}. ${BRAND.hashtags[0]}`,
    ],
    facebook: [
      `🚀 Exciting update!\n\n${topic}\n\n${BRAND.name} — ${BRAND.tagline}\n\nWe're building an AI that doesn't just respond — it remembers, learns, and grows with you. Privacy-first, always.\n\nLearn more: cubiqo.ai\n\n${BRAND.hashtags[0]} ${BRAND.hashtags[2]}`,
    ],
    discord: [
      `**${BRAND.name} Update** 🤖\n\n${topic}\n\n> ${BRAND.tagline}\n\nPrivacy-first AI companion. No data harvesting. Just intelligence that grows with you.\n\nJoin the conversation! 💜`,
    ],
  }

  const platformTemplates = templates[platform] || templates.twitter
  return platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) return authResult.response!

  try {
    const body = await request.json()
    const {
      campaignId: providedCampaignId,
      topic = 'Launch of CubiQo AI — the future of personal intelligence',
    } = body

    const supabase = createAdminClient()

    // Get or create campaign
    let campaignId = providedCampaignId
    let campaignName = 'Sample Post'

    if (!campaignId) {
      const { data: campaign, error: campaignError } = await (supabase as any)
        .from('social_campaigns')
        .insert({
          name: `Sample Post — ${new Date().toLocaleString()}`,
          seed_topic: topic,
          status: 'running',
          total_posts_target: PLATFORMS.length,
        })
        .select('id, name')
        .single()

      if (campaignError) throw new Error(campaignError.message)
      campaignId = campaign.id
      campaignName = campaign.name
    } else {
      // Verify campaign exists
      const { data: campaign, error } = await (supabase as any)
        .from('social_campaigns')
        .select('id, name')
        .eq('id', campaignId)
        .single()

      if (error || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      campaignName = campaign.name
    }

    // Get one active account per platform
    const { data: accounts, error: accountsError } = await (supabase as any)
      .from('social_accounts')
      .select('id, platform, username, persona_type')
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (accountsError) throw new Error(accountsError.message)

    // Pick first active account per platform
    const accountsByPlatform = new Map<string, any>()
    for (const acc of (accounts ?? [])) {
      if (!accountsByPlatform.has(acc.platform)) {
        accountsByPlatform.set(acc.platform, acc)
      }
    }

    const results: Array<{
      platform: string
      username: string
      caption: string
      status: string
      queueItemId?: string
    }> = []

    // Generate and queue one post per platform
    for (const platform of PLATFORMS) {
      const account = accountsByPlatform.get(platform)

      if (!account) {
        results.push({
          platform,
          username: '—',
          caption: '',
          status: 'skipped — no active account',
        })
        continue
      }

      const caption = generateSampleCaption(platform, topic)

      // Insert into content_queue as 'ready' (already generated)
      const { data: queueItem, error: insertError } = await (supabase as any)
        .from('content_queue')
        .insert({
          campaign_id: campaignId,
          target_account_id: account.id,
          content_type: 'text',
          generation_status: 'ready',
          caption,
          asset_url: null,
        })
        .select('id')
        .single()

      if (insertError) {
        results.push({
          platform,
          username: account.username,
          caption,
          status: `error: ${insertError.message}`,
        })
        continue
      }

      results.push({
        platform,
        username: account.username,
        caption,
        status: 'ready',
        queueItemId: queueItem?.id,
      })
    }

    const readyCount = results.filter(r => r.status === 'ready').length
    const skippedCount = results.filter(r => r.status.startsWith('skipped')).length

    console.info('[Social Army Sample Post]', {
      campaignId,
      campaignName,
      generated: readyCount,
      skipped: skippedCount,
      adminUserId: authResult.user?.id,
    })

    return NextResponse.json({
      success: true,
      campaign: { id: campaignId, name: campaignName },
      platforms: PLATFORMS.length,
      generated: readyCount,
      skipped: skippedCount,
      posts: results,
      message: `Generated ${readyCount} sample posts across ${PLATFORMS.length} platforms`,
    }, { status: 201 })
  } catch (error) {
    console.error('[Social Army Sample Post] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
