/**
 * GitHub OAuth Callback Handler
 * 
 * Handles the OAuth callback from GitHub after user authorization.
 * Exchanges the code for an access token and stores it securely.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/utils/encryption'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('❌ GitHub OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent('GitHub connection failed')}`, request.url)
    )
  }

  // Validate required parameters
  if (!code) {
    console.error('❌ No code provided in callback')
    return NextResponse.redirect(
      new URL('/admin?error=missing_code', request.url)
    )
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('❌ GitHub OAuth credentials not configured')
    return NextResponse.redirect(
      new URL('/admin?error=oauth_not_configured', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('❌ GitHub token exchange failed:', tokenData.error)
      return NextResponse.redirect(
        new URL(`/admin?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`, request.url)
      )
    }

    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('❌ No access token received from GitHub')
      return NextResponse.redirect(
        new URL('/admin?error=no_access_token', request.url)
      )
    }

    // Fetch GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    const githubUser = await userResponse.json()

    if (!githubUser.id) {
      console.error('❌ Failed to fetch GitHub user info')
      return NextResponse.redirect(
        new URL('/admin?error=failed_to_fetch_user', request.url)
      )
    }

    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ Not authenticated:', userError)
      return NextResponse.redirect(
        new URL('/admin?error=not_authenticated', request.url)
      )
    }

    // Encrypt the access token before storing
    const encryptedToken = encryptToken(accessToken)

    // Store or update the integration
    const { error: dbError } = await supabase
      .from('user_integrations')
      .upsert({
        user_id: user.id,
        provider: 'github',
        access_token: encryptedToken,
        provider_user_id: githubUser.id.toString(),
        provider_username: githubUser.login,
        metadata: {
          name: githubUser.name,
          email: githubUser.email,
          avatar_url: githubUser.avatar_url,
          bio: githubUser.bio,
          public_repos: githubUser.public_repos,
          scopes: tokenData.scope?.split(',') || [],
        },
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('❌ Failed to store integration:', dbError)
      return NextResponse.redirect(
        new URL('/admin?error=failed_to_store', request.url)
      )
    }

    console.log(`✅ GitHub connected for user ${user.id} (@${githubUser.login})`)

    // Redirect back to admin with success message
    return NextResponse.redirect(
      new URL('/admin?success=github_connected', request.url)
    )

  } catch (error) {
    console.error('❌ GitHub OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/admin?error=unexpected_error', request.url)
    )
  }
}
