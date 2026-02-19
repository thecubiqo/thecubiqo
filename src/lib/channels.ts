/**
 * Channel Configuration and Utilities
 * Defines supported communication channels and their configuration
 */

export type ChannelType = 'telegram' | 'discord' | 'slack' | 'email'

export interface ChannelInfo {
  type: ChannelType
  name: string
  description: string
  envVars: string[]
}

/**
 * Supported channels configuration
 * Maps channel types to their environment variables and metadata
 */
export const SUPPORTED_CHANNELS: Record<ChannelType, ChannelInfo> = {
  telegram: {
    type: 'telegram',
    name: 'Telegram',
    description: 'Telegram bot integration for agent communication',
    envVars: ['TELEGRAM_BOT_TOKEN'],
  },
  discord: {
    type: 'discord',
    name: 'Discord',
    description: 'Discord bot integration for agent communication',
    envVars: ['DISCORD_BOT_TOKEN'],
  },
  slack: {
    type: 'slack',
    name: 'Slack',
    description: 'Slack bot integration for agent communication',
    envVars: ['SLACK_BOT_TOKEN'],
  },
  email: {
    type: 'email',
    name: 'Email',
    description: 'Email integration for agent communication',
    envVars: ['EMAIL_SMTP_HOST', 'SENDGRID_API_KEY'],
  },
}

/**
 * Check if a channel is connected (environment variable is set)
 */
export function isChannelConnected(channelType: ChannelType): boolean {
  const channel = SUPPORTED_CHANNELS[channelType]
  if (!channel) return false

  // Check if any of the required environment variables are set
  return channel.envVars.some((envVar) => {
    const value = process.env[envVar]
    return value !== undefined && value !== ''
  })
}

/**
 * Check if a channel type is valid
 */
export function isValidChannelType(type: string): type is ChannelType {
  return type in SUPPORTED_CHANNELS
}

/**
 * Get all channel types
 */
export function getAllChannelTypes(): ChannelType[] {
  return Object.keys(SUPPORTED_CHANNELS) as ChannelType[]
}
