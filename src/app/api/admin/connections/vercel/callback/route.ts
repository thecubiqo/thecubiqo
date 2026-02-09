import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Vercel OAuth Callback Handler
 * 
 * Flow:
 * 1. User clicks "Connect Vercel" in ConnectionsPanel
 * 2. Redirected to Vercel OAuth
 * 3. Vercel redirects back here with code
 * 4. Exchange code for access token
 * 5. Store token in database
 * 6. Fetch and cache user's Vercel projects
 */

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Vercel OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/admin?error=vercel_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/admin?error=missing_code`
    )
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(
      `${requestUrl.origin}/admin?error=unauthorized`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID || '',
        client_secret: process.env.VERCEL_CLIENT_SECRET || '',
        code,
        redirect_uri: `${requestUrl.origin}/api/admin/connections/vercel/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      throw new Error(`Vercel token exchange failed: ${errorData.error || tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, team_id, user_id: vercel_user_id } = tokenData

    // Fetch user info from Vercel
    const userResponse = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const userData = await userResponse.json()

    // Fetch user's projects
    const projectsResponse = await fetch(
      team_id 
        ? `https://api.vercel.com/v9/projects?teamId=${team_id}`
        : 'https://api.vercel.com/v9/projects',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const projectsData = await projectsResponse.json()

    // Store connection in database
    const { error: dbError } = await supabase
      .from('connections')
      .upsert({
        user_id: user.id,
        service: 'vercel',
        access_token,
        metadata: {
          username: userData.username || userData.name,
          email: userData.email,
          team_id,
          vercel_user_id,
          avatar: userData.avatar,
          projects: projectsData.projects?.map((p: any) => ({
            id: p.id,
            name: p.name,
            framework: p.framework,
            createdAt: p.createdAt,
          })) || [],
          project_count: projectsData.projects?.length || 0,
        },
        connected_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,service'
      })

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Success! Redirect back to admin panel
    return NextResponse.redirect(
      `${requestUrl.origin}/admin?success=vercel_connected&projects=${projectsData.projects?.length || 0}`
    )
  } catch (error: any) {
    console.error('Vercel OAuth callback error:', error)
    return NextResponse.redirect(
      `${requestUrl.origin}/admin?error=connection_failed&message=${encodeURIComponent(error.message)}`
    )
  }
}
