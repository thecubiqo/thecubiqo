/**
 * Tool Filter
 * Enforces integration toggles on agent tool availability
 */

import { createClient } from '@/lib/supabase/server'
import type { ServiceType } from '@/types/integrations'

/**
 * Map of tool names to their corresponding service
 */
const TOOL_SERVICE_MAP: Record<string, ServiceType> = {
  // Gmail tools
  'gmail_search': 'gmail',
  'gmail_read': 'gmail',
  'gmail_send': 'gmail',
  'gmail_reply': 'gmail',
  
  // Calendar tools
  'calendar_list': 'calendar',
  'calendar_get': 'calendar',
  'calendar_create': 'calendar',
  'calendar_update': 'calendar',
  'calendar_delete': 'calendar',
  
  // Slack tools
  'slack_channels': 'slack',
  'slack_messages': 'slack',
  'slack_send': 'slack',
  'slack_reply': 'slack',
  
  // Discord tools
  'discord_guilds': 'discord',
  'discord_channels': 'discord',
  'discord_messages': 'discord',
  'discord_send': 'discord',
  
  // Telegram tools
  'telegram_chats': 'telegram',
  'telegram_messages': 'telegram',
  'telegram_send': 'telegram',
  
  // WhatsApp tools
  'whatsapp_chats': 'whatsapp',
  'whatsapp_messages': 'whatsapp',
  'whatsapp_send': 'whatsapp',
  
  // Notion tools
  'notion_search': 'notion',
  'notion_page': 'notion',
  'notion_create': 'notion',
  'notion_update': 'notion',
  
  // Drive tools
  'drive_list': 'drive',
  'drive_search': 'drive',
  'drive_download': 'drive',
  'drive_upload': 'drive',
  'drive_create_folder': 'drive',
  
  // GitHub tools
  'github_repos': 'github',
  'github_issues': 'github',
  'github_create_repo': 'github',
  'github_create_issue': 'github',
  'github_create_pr': 'github',
  
  // Maps tools
  'maps_search': 'maps',
  'maps_directions': 'maps',
  'maps_geocode': 'maps',
  
  // Uber tools
  'uber_estimate': 'uber',
  'uber_request': 'uber',
  'uber_cancel': 'uber',
  
  // Spotify tools
  'spotify_search': 'spotify',
  'spotify_play': 'spotify',
  'spotify_pause': 'spotify',
  'spotify_create_playlist': 'spotify',
  
  // Twitter tools
  'twitter_timeline': 'twitter',
  'twitter_search': 'twitter',
  'twitter_tweet': 'twitter',
  'twitter_reply': 'twitter',
  
  // LinkedIn tools
  'linkedin_profile': 'linkedin',
  'linkedin_feed': 'linkedin',
  'linkedin_post': 'linkedin',
  'linkedin_message': 'linkedin'
}

/**
 * Classify tools as read or write operations
 */
const WRITE_TOOLS = new Set([
  'gmail_send',
  'gmail_reply',
  'calendar_create',
  'calendar_update',
  'calendar_delete',
  'slack_send',
  'slack_reply',
  'discord_send',
  'telegram_send',
  'whatsapp_send',
  'notion_create',
  'notion_update',
  'drive_upload',
  'drive_create_folder',
  'github_create_repo',
  'github_create_issue',
  'github_create_pr',
  'uber_request',
  'uber_cancel',
  'spotify_play',
  'spotify_pause',
  'spotify_create_playlist',
  'twitter_tweet',
  'twitter_reply',
  'linkedin_post',
  'linkedin_message'
])

/**
 * Check if a tool is enabled for the current user
 */
export async function isToolEnabled(
  userId: string,
  toolName: string
): Promise<boolean> {
  // Get the service for this tool
  const service = TOOL_SERVICE_MAP[toolName]
  if (!service) {
    // Tool doesn't require integration, allow it
    return true
  }

  try {
    const supabase = await createClient()
    
    // Check if integration exists and is enabled
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('is_connected, read_enabled, write_enabled')
      .eq('user_id', userId)
      .eq('service', service)
      .single()

    if (!integration || !integration.is_connected) {
      return false
    }

    // Check read/write permission
    const isWriteTool = WRITE_TOOLS.has(toolName)
    return isWriteTool ? integration.write_enabled : integration.read_enabled
  } catch (error) {
    console.error(`Tool filter error for ${toolName}:`, error)
    return false
  }
}

/**
 * Filter available tools based on user's integrations
 */
export async function filterTools(
  userId: string,
  tools: any[]
): Promise<any[]> {
  const enabledTools = await Promise.all(
    tools.map(async tool => {
      const enabled = await isToolEnabled(userId, tool.name)
      return enabled ? tool : null
    })
  )

  return enabledTools.filter(Boolean)
}

/**
 * Get all enabled services for a user
 */
export async function getEnabledServices(
  userId: string,
  permission: 'read' | 'write' = 'read'
): Promise<ServiceType[]> {
  try {
    const supabase = await createClient()
    
    const { data: integrations } = await supabase
      .from('user_integrations')
      .select('service, is_connected, read_enabled, write_enabled')
      .eq('user_id', userId)
      .eq('is_connected', true)

    if (!integrations) return []

    return integrations
      .filter(i => permission === 'read' ? i.read_enabled : i.write_enabled)
      .map(i => i.service as ServiceType)
  } catch (error) {
    console.error('Failed to get enabled services:', error)
    return []
  }
}

/**
 * Check if specific service is enabled
 */
export async function isServiceEnabled(
  userId: string,
  service: ServiceType,
  permission: 'read' | 'write' = 'read'
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('is_connected, read_enabled, write_enabled')
      .eq('user_id', userId)
      .eq('service', service)
      .single()

    if (!integration || !integration.is_connected) {
      return false
    }

    return permission === 'read' ? integration.read_enabled : integration.write_enabled
  } catch (error) {
    return false
  }
}
