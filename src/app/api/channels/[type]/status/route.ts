/**
 * Channel Status API Route
 * GET /api/channels/:type/status - Get channel health and status
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidChannelType, isChannelConnected, SUPPORTED_CHANNELS } from '@/lib/channels'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ type: string }>
}

/**
 * GET - Get channel status and health information
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { type } = await context.params

    // Validate channel type
    if (!isValidChannelType(type)) {
      return NextResponse.json(
        { error: `Unknown channel type: ${type}` },
        { status: 404 }
      )
    }

    const channelInfo = SUPPORTED_CHANNELS[type]
    const configured = isChannelConnected(type)
    const status = configured ? 'connected' : 'disconnected'
    const lastChecked = new Date().toISOString()

    return NextResponse.json({
      channel: {
        type: channelInfo.type,
        name: channelInfo.name,
        status,
        configured,
        lastChecked,
        description: channelInfo.description,
      },
    })
  } catch (error) {
    console.error('[Channels API] GET status error:', error)
    return NextResponse.json(
      { error: 'Failed to get channel status' },
      { status: 500 }
    )
  }
}
