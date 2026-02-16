/**
 * GitHub Repositories API
 * 
 * Fetches the user's GitHub repositories using their stored access token
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils/encryption'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  updated_at: string
  language: string | null
  stargazers_count: number
  forks_count: number
  default_branch: string
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get GitHub integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 404 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(integration.access_token)
    } catch (error) {
      console.error('❌ Failed to decrypt token:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 500 }
      )
    }

    // Fetch repositories from GitHub
    const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!reposResponse.ok) {
      console.error('❌ GitHub API error:', reposResponse.status, await reposResponse.text())
      
      // If token is invalid, we might need to re-authenticate
      if (reposResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired or invalid. Please reconnect GitHub.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch repositories' },
        { status: reposResponse.status }
      )
    }

    const repos: GitHubRepo[] = await reposResponse.json()

    // Update last_synced_at
    await supabase
      .from('user_integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integration.id)

    return NextResponse.json({
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        updated_at: repo.updated_at,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        default_branch: repo.default_branch,
      })),
      user: {
        username: integration.provider_username,
        user_id: integration.provider_user_id,
      },
    })

  } catch (error) {
    console.error('❌ Error fetching GitHub repos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
