/**
 * OAuth Callback Handler
 * GET /api/integrations/oauth/callback/[service]?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken } from '@/lib/integrations/oauth-config'
import type { ServiceType, OAuthState } from '@/types/integrations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors (user denied, etc.)
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/integrations?error=${error}`, request.url)
      )
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL('/integrations?error=missing_parameters', request.url)
      )
    }

    // Decode state
    let state: OAuthState
    try {
      state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/integrations?error=invalid_state', request.url)
      )
    }

    const serviceType = service as ServiceType

    // Verify service matches state
    if (serviceType !== state.service) {
      return NextResponse.redirect(
        new URL('/integrations?error=service_mismatch', request.url)
      )
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(serviceType, code)
    if (!tokenData) {
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      )
    }

    const supabase = await createClient()

    // Verify user matches state
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== state.userId) {
      return NextResponse.redirect(
        new URL('/integrations?error=unauthorized', request.url)
      )
    }

    // Calculate token expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    // Store/update integration
    const { error: upsertError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        serviceType,
        is_connected: true,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,service'
      })

    if (upsertError) {
      console.error('Failed to store integration:', upsertError)
      return NextResponse.redirect(
        new URL('/integrations?error=storage_failed', request.url)
      )
    }

    // Success! Redirect back to return URL
    const redirectUrl = new URL(state.returnUrl, request.url)
    redirectUrl.searchParams.set('connected', serviceType)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/integrations?error=internal_error', request.url)
    )
  }
}
