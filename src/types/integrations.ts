/**
 * Integration Types
 * Defines all supported third-party service integrations
 */

export type ServiceType =
  | 'gmail'
  | 'calendar'
  | 'slack'
  | 'discord'
  | 'telegram'
  | 'whatsapp'
  | 'notion'
  | 'drive'
  | 'github'
  | 'maps'
  | 'uber'
  | 'spotify'
  | 'twitter'
  | 'linkedin'

export interface Integration {
  id: string
  user_id: string
  service: ServiceType
  is_connected: boolean
  read_enabled: boolean
  write_enabled: boolean
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  config?: Record<string, any>
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface ServiceMetadata {
  id: ServiceType
  name: string
  description: string
  icon: string
  color: string
  category: 'communication' | 'productivity' | 'storage' | 'social' | 'transport' | 'entertainment'
  oauth_enabled: boolean
  oauth_provider?: 'google' | 'microsoft' | 'github' | 'custom'
  features: {
    read: string[]
    write: string[]
  }
}

export const SERVICE_METADATA: Record<ServiceType, ServiceMetadata> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'Read and send emails',
    icon: '📧',
    color: '#EA4335',
    category: 'communication',
    oauth_enabled: true,
    oauth_provider: 'google',
    features: {
      read: ['Read emails', 'Search inbox', 'Check unread count'],
      write: ['Send emails', 'Reply to threads', 'Draft messages']
    }
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Manage your schedule',
    icon: '📅',
    color: '#4285F4',
    category: 'productivity',
    oauth_enabled: true,
    oauth_provider: 'google',
    features: {
      read: ['View events', 'Check availability', 'Get reminders'],
      write: ['Create events', 'Update meetings', 'Cancel appointments']
    }
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication',
    icon: '💬',
    color: '#4A154B',
    category: 'communication',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['Read messages', 'Check mentions', 'View channels'],
      write: ['Send messages', 'Post updates', 'Reply to threads']
    }
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    description: 'Gaming and community chat',
    icon: '🎮',
    color: '#5865F2',
    category: 'communication',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['Read messages', 'View servers', 'Check notifications'],
      write: ['Send messages', 'Create channels', 'Manage roles']
    }
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    description: 'Secure messaging',
    icon: '✈️',
    color: '#0088cc',
    category: 'communication',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['Read messages', 'View chats', 'Check groups'],
      write: ['Send messages', 'Create groups', 'Share media']
    }
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Personal messaging',
    icon: '📱',
    color: '#25D366',
    category: 'communication',
    oauth_enabled: false,
    features: {
      read: ['Read messages', 'View chats', 'Check status'],
      write: ['Send messages', 'Share media', 'Make calls']
    }
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Note-taking and docs',
    icon: '📝',
    color: '#000000',
    category: 'productivity',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['Read pages', 'Search databases', 'View blocks'],
      write: ['Create pages', 'Update content', 'Add blocks']
    }
  },
  drive: {
    id: 'drive',
    name: 'Google Drive',
    description: 'Cloud file storage',
    icon: '📁',
    color: '#4285F4',
    category: 'storage',
    oauth_enabled: true,
    oauth_provider: 'google',
    features: {
      read: ['List files', 'Download documents', 'Search content'],
      write: ['Upload files', 'Create folders', 'Share documents']
    }
  },
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Code repositories',
    icon: '🐙',
    color: '#181717',
    category: 'productivity',
    oauth_enabled: true,
    oauth_provider: 'github',
    features: {
      read: ['View repos', 'Read code', 'Check issues'],
      write: ['Create repos', 'Push commits', 'Open PRs']
    }
  },
  maps: {
    id: 'maps',
    name: 'Google Maps',
    description: 'Location and navigation',
    icon: '🗺️',
    color: '#34A853',
    category: 'transport',
    oauth_enabled: true,
    oauth_provider: 'google',
    features: {
      read: ['Get directions', 'Search places', 'View traffic'],
      write: ['Save locations', 'Share routes', 'Add reviews']
    }
  },
  uber: {
    id: 'uber',
    name: 'Uber',
    description: 'Ride sharing',
    icon: '🚗',
    color: '#000000',
    category: 'transport',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['View rides', 'Check prices', 'Track driver'],
      write: ['Request ride', 'Cancel trip', 'Rate driver']
    }
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    description: 'Music streaming',
    icon: '🎵',
    color: '#1DB954',
    category: 'entertainment',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['View playlists', 'Check now playing', 'Search music'],
      write: ['Play songs', 'Create playlists', 'Save tracks']
    }
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Social networking',
    icon: '🐦',
    color: '#1DA1F2',
    category: 'social',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['Read timeline', 'View mentions', 'Search tweets'],
      write: ['Post tweets', 'Reply', 'Retweet']
    }
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking',
    icon: '💼',
    color: '#0A66C2',
    category: 'social',
    oauth_enabled: true,
    oauth_provider: 'custom',
    features: {
      read: ['View profile', 'Read feed', 'Check messages'],
      write: ['Post updates', 'Send messages', 'Share articles']
    }
  }
}

export const SERVICE_CATEGORIES = {
  communication: ['gmail', 'slack', 'discord', 'telegram', 'whatsapp'],
  productivity: ['calendar', 'notion', 'github'],
  storage: ['drive'],
  transport: ['maps', 'uber'],
  entertainment: ['spotify'],
  social: ['twitter', 'linkedin']
} as const

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authUrl: string
  tokenUrl: string
}

export interface OAuthState {
  service: ServiceType
  userId: string
  returnUrl: string
}

export interface IntegrationUpdate {
  is_connected?: boolean
  read_enabled?: boolean
  write_enabled?: boolean
  config?: Record<string, any>
}
