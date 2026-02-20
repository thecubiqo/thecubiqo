/**
 * Integration Registry
 * ALL integrations: social, chat, smart home, etc.
 */

export interface Integration {
  name: string
  type: 'chat' | 'social' | 'smart_home' | 'productivity'
  displayName: string
  icon: string
  color: string
  description: string
  requiresOAuth: boolean
  capabilities: string[]
}

export const INTEGRATIONS: Record<string, Integration> = {
  // ===== CHAT PLATFORMS =====
  whatsapp: {
    name: 'whatsapp',
    type: 'chat',
    displayName: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    description: 'Send and receive WhatsApp messages',
    requiresOAuth: false,
    capabilities: ['send_message', 'read_message']
  },
  telegram: {
    name: 'telegram',
    type: 'chat',
    displayName: 'Telegram',
    icon: '✈️',
    color: '#0088cc',
    description: 'Telegram bot integration',
    requiresOAuth: false,
    capabilities: ['send_message', 'read_message']
  },
  discord: {
    name: 'discord',
    type: 'chat',
    displayName: 'Discord',
    icon: '🎮',
    color: '#5865F2',
    description: 'Discord server and DM integration',
    requiresOAuth: true,
    capabilities: ['send_message', 'read_message', 'voice_channel']
  },
  slack: {
    name: 'slack',
    type: 'chat',
    displayName: 'Slack',
    icon: '💼',
    color: '#4A154B',
    description: 'Slack workspace integration',
    requiresOAuth: true,
    capabilities: ['send_message', 'read_message', 'channels']
  },
  signal: {
    name: 'signal',
    type: 'chat',
    displayName: 'Signal',
    icon: '🔒',
    color: '#3A76F0',
    description: 'Secure messaging via Signal',
    requiresOAuth: false,
    capabilities: ['send_message', 'read_message']
  },
  imessage: {
    name: 'imessage',
    type: 'chat',
    displayName: 'iMessage',
    icon: '💬',
    color: '#007AFF',
    description: 'Apple iMessage integration',
    requiresOAuth: false,
    capabilities: ['send_message', 'read_message']
  },

  // ===== SOCIAL MEDIA =====
  twitter: {
    name: 'twitter',
    type: 'social',
    displayName: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2',
    description: 'Twitter posts and mentions',
    requiresOAuth: true,
    capabilities: ['post', 'reply', 'like', 'retweet']
  },
  instagram: {
    name: 'instagram',
    type: 'social',
    displayName: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    description: 'Instagram posts, stories, and DMs',
    requiresOAuth: true,
    capabilities: ['post', 'story', 'message', 'like']
  },
  facebook: {
    name: 'facebook',
    type: 'social',
    displayName: 'Facebook',
    icon: '👥',
    color: '#1877F2',
    description: 'Facebook posts and Messenger',
    requiresOAuth: true,
    capabilities: ['post', 'message', 'like', 'share']
  },
  linkedin: {
    name: 'linkedin',
    type: 'social',
    displayName: 'LinkedIn',
    icon: '💼',
    color: '#0077B5',
    description: 'LinkedIn posts and messages',
    requiresOAuth: true,
    capabilities: ['post', 'message', 'like', 'comment']
  },
  tiktok: {
    name: 'tiktok',
    type: 'social',
    displayName: 'TikTok',
    icon: '🎵',
    color: '#000000',
    description: 'TikTok videos and comments',
    requiresOAuth: true,
    capabilities: ['post_video', 'comment', 'like']
  },
  reddit: {
    name: 'reddit',
    type: 'social',
    displayName: 'Reddit',
    icon: '🤖',
    color: '#FF4500',
    description: 'Reddit posts and comments',
    requiresOAuth: true,
    capabilities: ['post', 'comment', 'upvote', 'message']
  },
  youtube: {
    name: 'youtube',
    type: 'social',
    displayName: 'YouTube',
    icon: '📺',
    color: '#FF0000',
    description: 'YouTube videos and comments',
    requiresOAuth: true,
    capabilities: ['upload_video', 'comment', 'like']
  },
  mastodon: {
    name: 'mastodon',
    type: 'social',
    displayName: 'Mastodon',
    icon: '🐘',
    color: '#6364FF',
    description: 'Decentralized social network',
    requiresOAuth: true,
    capabilities: ['post', 'reply', 'boost', 'favorite']
  },

  // ===== SMART HOME =====
  philips_hue: {
    name: 'philips_hue',
    type: 'smart_home',
    displayName: 'Philips Hue',
    icon: '💡',
    color: '#FF6000',
    description: 'Control Philips Hue lights',
    requiresOAuth: true,
    capabilities: ['turn_on', 'turn_off', 'set_brightness', 'set_color']
  },
  nest: {
    name: 'nest',
    type: 'smart_home',
    displayName: 'Nest',
    icon: '🌡️',
    color: '#00AFD8',
    description: 'Nest thermostat and cameras',
    requiresOAuth: true,
    capabilities: ['set_temperature', 'get_temperature', 'view_camera']
  },
  ring: {
    name: 'ring',
    type: 'smart_home',
    displayName: 'Ring',
    icon: '🔔',
    color: '#0066FF',
    description: 'Ring doorbell and security cameras',
    requiresOAuth: true,
    capabilities: ['view_camera', 'doorbell_alert', 'two_way_talk']
  },
  august: {
    name: 'august',
    type: 'smart_home',
    displayName: 'August Lock',
    icon: '🔒',
    color: '#FF0040',
    description: 'Smart door lock control',
    requiresOAuth: true,
    capabilities: ['lock', 'unlock', 'get_status']
  },
  sonos: {
    name: 'sonos',
    type: 'smart_home',
    displayName: 'Sonos',
    icon: '🔊',
    color: '#000000',
    description: 'Sonos speaker control',
    requiresOAuth: true,
    capabilities: ['play', 'pause', 'volume', 'next_track']
  },
  ecobee: {
    name: 'ecobee',
    type: 'smart_home',
    displayName: 'Ecobee',
    icon: '🌡️',
    color: '#6ABD45',
    description: 'Ecobee smart thermostat',
    requiresOAuth: true,
    capabilities: ['set_temperature', 'get_temperature', 'set_mode']
  },
  home_assistant: {
    name: 'home_assistant',
    type: 'smart_home',
    displayName: 'Home Assistant',
    icon: '🏠',
    color: '#41BDF5',
    description: 'Connect 2,000+ devices via Home Assistant',
    requiresOAuth: false,
    capabilities: ['control_any_device', 'get_device_state', 'automation']
  },

  // ===== PRODUCTIVITY =====
  gmail: {
    name: 'gmail',
    type: 'productivity',
    displayName: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    description: 'Gmail email integration',
    requiresOAuth: true,
    capabilities: ['send_email', 'read_email', 'search_email']
  },
  google_calendar: {
    name: 'google_calendar',
    type: 'productivity',
    displayName: 'Google Calendar',
    icon: '📅',
    color: '#4285F4',
    description: 'Google Calendar events',
    requiresOAuth: true,
    capabilities: ['create_event', 'read_events', 'update_event']
  },
  notion: {
    name: 'notion',
    type: 'productivity',
    displayName: 'Notion',
    icon: '📝',
    color: '#000000',
    description: 'Notion workspace integration',
    requiresOAuth: true,
    capabilities: ['create_page', 'read_page', 'update_page']
  },
  github: {
    name: 'github',
    type: 'productivity',
    displayName: 'GitHub',
    icon: '🐙',
    color: '#181717',
    description: 'GitHub repositories and issues',
    requiresOAuth: true,
    capabilities: ['create_issue', 'comment', 'merge_pr', 'notifications']
  },
  trello: {
    name: 'trello',
    type: 'productivity',
    displayName: 'Trello',
    icon: '📋',
    color: '#0079BF',
    description: 'Trello boards and cards',
    requiresOAuth: true,
    capabilities: ['create_card', 'move_card', 'add_comment']
  },
  apple_notes: {
    name: 'apple_notes',
    type: 'productivity',
    displayName: 'Apple Notes',
    icon: '📝',
    color: '#FFCC00',
    description: 'Apple Notes integration',
    requiresOAuth: false,
    capabilities: ['create_note', 'read_note', 'search_notes']
  }
}

export function getIntegration(name: string): Integration | undefined {
  return INTEGRATIONS[name]
}

export function getAllIntegrations(): Integration[] {
  return Object.values(INTEGRATIONS)
}
