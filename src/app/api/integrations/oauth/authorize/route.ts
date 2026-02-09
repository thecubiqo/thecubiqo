/**
 * OAuth Authorization Initiation
 * GET /api/integrations/oauth/authorize?service=gmail&returnUrl=/integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAuthUrl } from '@/lib/integrations/oauth-config'
import type { ServiceType, OAuthState } from '@/types/integrations'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const service = searchParams.get('service') as ServiceType
    const returnUrl = searchParams.get('returnUrl') || '/integrations'

    if (!service) {
      return NextResponse.json(
        { error: 'Service parameter required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create OAuth state
    const state: OAuthState = {
      service,
      userId: user.id,
      returnUrl
    }

    // Encode state as base64
    const stateParam = Buffer.from(JSON.stringify(state)).toString('base64')

    // Build authorization URL
    const authUrl = buildAuthUrl(service, stateParam)
    if (!authUrl) {
      return NextResponse.json(
        { error: `OAuth not configured for ${service}` },
        { status: 400 }
      )
    }

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
