/**
 * Channel Disconnect API Route
 * DELETE /api/channels/:type/disconnect - Disconnect a channel
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidChannelType } from '@/lib/channels'

interface RouteContext {
  params: Promise<{ type: string }>
}

/**
 * DELETE - Disconnect a channel
 * Note: Runtime disconnection requires removing/unsetting environment variables.
 * This endpoint validates the request and provides feedback.
 */
export async function DELETE(
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

    // In production, channel disconnection requires removing environment variables
    // This endpoint validates the channel type and provides a success response

    return NextResponse.json({
      success: true,
      channel: {
        type,
        status: 'disconnected',
      },
      message: 'To disconnect this channel, remove or unset the corresponding environment variable.',
    })
  } catch (error) {
    console.error('[Channels API] DELETE disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect channel' },
      { status: 500 }
    )
  }
}
