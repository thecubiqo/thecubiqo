/**
 * CQ-to-CQ Communication Types
 * Types for friends system and direct messaging
 */

// ============================================================================
// FRIEND TYPES
// ============================================================================

export type FriendStatus = 'pending' | 'accepted' | 'blocked'

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: FriendStatus
  created_at: string
  updated_at: string
}

// Friend with profile data joined
export interface FriendWithProfile extends Friend {
  friend_profile: {
    handle: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

// ============================================================================
// DIRECT MESSAGE TYPES
// ============================================================================

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  is_voice_delivered: boolean
  created_at: string
}

// Message with sender profile data
export interface DirectMessageWithProfile extends DirectMessage {
  sender_profile: {
    handle: string | null
    display_name: string | null
    avatar_url: string | null
  }
}

// ============================================================================
// CQ NUMBER TYPES
// ============================================================================

export interface CQProfile {
  id: string
  handle: string
  display_name: string | null
  avatar_url: string | null
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface CQPreferences {
  cq_auto_voice?: boolean // Auto-play messages with Cubiqo voice
}
