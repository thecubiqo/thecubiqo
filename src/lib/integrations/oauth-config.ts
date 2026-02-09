/**
 * OAuth Configuration for Integrations
 * Manages OAuth flows for third-party services
 */

import type { ServiceType, OAuthConfig } from '@/types/integrations'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const OAUTH_CONFIGS: Partial<Record<ServiceType, OAuthConfig>> = {
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/gmail`,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  
  calendar: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/calendar`,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  
  drive: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/drive`,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file'
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/github`,
    scopes: ['repo', 'user', 'read:org'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token'
  },
  
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/slack`,
    scopes: [
      'channels:read',
      'chat:write',
      'users:read',
      'channels:history'
    ],
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access'
  },
  
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/discord`,
    scopes: ['identify', 'guilds', 'messages.read', 'messages.write'],
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token'
  },
  
  notion: {
    clientId: process.env.NOTION_CLIENT_ID || '',
    clientSecret: process.env.NOTION_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/notion`,
    scopes: ['read_content', 'update_content', 'insert_content'],
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token'
  },
  
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: `${BASE_URL}/api/integrations/oauth/callback/spotify`,
    scopes: [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-modify-public'
    ],
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token'
  }
}

export function getOAuthConfig(service: ServiceType): OAuthConfig | null {
  return OAUTH_CONFIGS[service] || null
}

export function buildAuthUrl(service: ServiceType, state: string): string | null {
  const config = getOAuthConfig(service)
  if (!config) return null

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline', // For refresh tokens (Google)
    prompt: 'consent' // Force consent screen (Google)
  })

  return `${config.authUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(
  service: ServiceType,
  code: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in?: number
} | null> {
  const config = getOAuthConfig(service)
  if (!config) return null

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      console.error(`OAuth token exchange failed for ${service}:`, await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`OAuth token exchange error for ${service}:`, error)
    return null
  }
}

export async function refreshAccessToken(
  service: ServiceType,
  refreshToken: string
): Promise<{
  access_token: string
  expires_in?: number
} | null> {
  const config = getOAuthConfig(service)
  if (!config) return null

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      console.error(`OAuth token refresh failed for ${service}:`, await response.text())
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`OAuth token refresh error for ${service}:`, error)
    return null
  }
}
