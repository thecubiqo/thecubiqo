/**
 * CubiQo Type Exports
 * Central export point for all application types
 */

export type { Database } from './database.types'
export type { Tables, Enums } from './database.types'

// CQ-to-CQ Communication Types
export * from './cq'

import type { Database } from './database.types'

// ============================================================================
// TABLE TYPES - Direct access to table rows
// ============================================================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Memory = Database['public']['Tables']['memory']['Row']
export type Event = Database['public']['Tables']['events']['Row']

// ============================================================================
// INSERT TYPES - For creating new records
// ============================================================================

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MemoryInsert = Database['public']['Tables']['memory']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']

// ============================================================================
// UPDATE TYPES - For updating existing records
// ============================================================================

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']
export type MemoryUpdate = Database['public']['Tables']['memory']['Update']
export type EventUpdate = Database['public']['Tables']['events']['Update']

// ============================================================================
// ENUM TYPES - For color states, roles, etc.
// ============================================================================

export type ColorState = 'trcl' | 'green' | 'yellow' | 'red'
export type AIModel = 'claude' | 'openai'
export type MessageRole = 'user' | 'assistant' | 'system'
export type MemoryZone = 'green' | 'yellow' | 'red'

// ============================================================================
// EVENT TYPES - For analytics
// ============================================================================

export type EventType =
  | 'app_opened'
  | 'world_entered'
  | 'voice_granted'
  | 'voice_denied'
  | 'action_confirmed'
  | 'action_executed'
  | 'a2hs_shown'
  | 'a2hs_done'
  | 'a2hs_dismissed'
  | 'session_ended'
  | 'profile_created'
  | 'color_changed'
  | 'adult_mode_enabled'

// ============================================================================
// COMPOSITE TYPES - Complex objects with relations
// ============================================================================

export type ConversationWithMessages = Conversation & {
  messages: Message[]
}

export type SessionWithConversations = Session & {
  conversations: Conversation[]
}

export type ProfileWithSessions = Profile & {
  sessions: Session[]
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export type AuthUser = {
  id: string
  email?: string
  phone?: string
}

export type GuestSession = {
  id: string
  is_guest: true
  expires_at: string
}

export type AuthenticatedSession = {
  id: string
  is_guest: false
  user_id: string
}

// ============================================================================
// AI ROUTING TYPES
// ============================================================================

export type AIRoute = {
  model: AIModel
  color: ColorState
  verified: boolean
}

export type AIMessage = {
  role: MessageRole
  content: string
  color?: ColorState
  tokens_used?: number
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryKey =
  | 'name'
  | 'preference_food'
  | 'preference_music'
  | 'preference_color'
  | 'fact_birthday'
  | 'fact_location'
  | string // Allow custom keys

export type MemoryRecord = {
  key: MemoryKey
  value: string
  zone: MemoryZone
}

// ============================================================================
// DEVICE INFO TYPES
// ============================================================================

export type DeviceInfo = {
  userAgent?: string
  platform?: string
  screenWidth?: number
  screenHeight?: number
  language?: string
  timezone?: string
}

// ============================================================================
// GEO LOCATION TYPES
// ============================================================================

export type GeoLocation = 'US' | 'CA'

// ============================================================================
// PREFERENCES TYPES
// ============================================================================

export type UserPreferences = {
  theme?: 'light' | 'dark' | 'auto'
  notifications?: boolean
  voice_enabled?: boolean
  adult_mode_verified?: boolean
  language?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WithTimestamps<T> = T & {
  created_at: string
  updated_at?: string
}

export type Paginated<T> = {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}
