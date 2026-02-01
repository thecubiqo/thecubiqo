/**
 * OAuth Configuration for all services
 */

export interface OAuthConfig {
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl?: string
  scopes: string[]
  clientIdEnv: string
  clientSecretEnv: string
}

export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  gmail: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET'
  },
  twitter: {
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientIdEnv: 'TWITTER_CLIENT_ID',
    clientSecretEnv: 'TWITTER_CLIENT_SECRET'
  },
  uber: {
    authorizeUrl: 'https://login.uber.com/oauth/v2/authorize',
    tokenUrl: 'https://login.uber.com/oauth/v2/token',
    userInfoUrl: 'https://api.uber.com/v1.2/me',
    scopes: ['profile', 'request', 'request_receipt'],
    clientIdEnv: 'UBER_CLIENT_ID',
    clientSecretEnv: 'UBER_CLIENT_SECRET'
  },
  linkedin: {
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/me',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET'
  },
  // Add more services as needed
  instagram: {
    authorizeUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopes: ['user_profile', 'user_media'],
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    clientSecretEnv: 'INSTAGRAM_CLIENT_SECRET'
  },
  facebook: {
    authorizeUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    scopes: ['public_profile', 'email', 'pages_manage_posts'],
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET'
  }
}

export function getOAuthConfig(serviceId: string): OAuthConfig | null {
  return OAUTH_CONFIGS[serviceId] || null
}
