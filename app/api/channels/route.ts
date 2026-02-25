/**
 * Channels API Route
 * GET /api/channels - List all configured channels
 */

import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_CHANNELS, getAllChannelTypes, isChannelConnected } from '@/lib/channels'

export const dynamic = 'force-dynamic'

/**
 * GET - List all channels with their connection status
 */
export async function GET(request: NextRequest) {
  try {
    const channelTypes = getAllChannelTypes()

    const channels = channelTypes.map((type) => {
      const channelInfo = SUPPORTED_CHANNELS[type]
      const status = isChannelConnected(type) ? 'connected' : 'disconnected'

      return {
        type: channelInfo.type,
        name: channelInfo.name,
        status,
        description: channelInfo.description,
      }
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('[Channels API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}
