/**
 * Channel Config API Route
 * PUT /api/channels/:type/config - Update channel configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidChannelType, isChannelConnected, SUPPORTED_CHANNELS } from '@/lib/channels'

interface RouteContext {
  params: Promise<{ type: string }>
}

/**
 * PUT - Update channel configuration
 * Note: Runtime configuration is read-only (managed via environment variables).
 * This endpoint validates the request and returns current configuration state.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { type } = await context.params

    // Validate channel type
    if (!isValidChannelType(type)) {
      return NextResponse.json(
        { error: `Invalid channel type: ${type}` },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))

    const channelInfo = SUPPORTED_CHANNELS[type]
    const configured = isChannelConnected(type)

    // Return current configuration state
    // Note: Actual configuration values are not exposed for security
    return NextResponse.json({
      channel: {
        type: channelInfo.type,
        name: channelInfo.name,
        configured,
        config: {
          // Configuration is managed via environment variables
          // and is read-only at runtime
          readonly: true,
          envVars: channelInfo.envVars,
        },
      },
      message: 'Channel configuration is read-only and managed via environment variables.',
    })
  } catch (error) {
    console.error('[Channels API] PUT config error:', error)
    return NextResponse.json(
      { error: 'Failed to update channel configuration' },
      { status: 500 }
    )
  }
}
