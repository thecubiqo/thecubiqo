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
  twitter: {
    name: 'twitter',
    type: 'social',
    displayName: 'Twitter/X',
    icon: '🐦',
    color: '#1DA1F2',
    description: 'Twitter posts and mentions',
    requiresOAuth: true,
    capabilities: ['post', 'reply', 'like']
  },
  philips_hue: {
    name: 'philips_hue',
    type: 'smart_home',
    displayName: 'Philips Hue',
    icon: '💡',
    color: '#FF6000',
    description: 'Control Philips Hue lights',
    requiresOAuth: true,
    capabilities: ['turn_on', 'turn_off', 'set_brightness']
  }
}

export function getIntegration(name: string): Integration | undefined {
  return INTEGRATIONS[name]
}

export function getAllIntegrations(): Integration[] {
  return Object.values(INTEGRATIONS)
}
