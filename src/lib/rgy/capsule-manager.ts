/**
 * RGY Capsule Manager
 * Manages capsules in format: color:intent:keywords
 * Implements staged matching algorithm
 */

import { createClient } from '@/lib/supabase/client'

export type Color = 'green' | 'yellow' | 'red'
export type Intent = 'collaborate' | 'trade' | 'company'

export interface RGYCapsule {
  id: string
  user_id: string
  color: Color
  intent?: Intent | null
  keywords: string[]
  is_active: boolean
  geofence_enabled: boolean
  latitude?: number | null
  longitude?: number | null
  radius_km?: number
  created_at: string
  updated_at: string
}

export interface CapsuleMatch {
  capsule_id: string
  user_id: string
  color: Color
  intent?: Intent | null
  keywords: string[]
  match_score: number
  color_match: boolean
  intent_match: boolean
  keyword_matches: number
  distance_km?: number | null
}

export interface ChatRoom {
  id: string
  name: string
  color: Color
  intent?: Intent | null
  keywords: string[]
  is_geofenced: boolean
  latitude?: number | null
  longitude?: number | null
  radius_km?: number
  max_participants: number
  participant_count: number
  created_by: string
  expires_at?: string | null
  is_active: boolean
  created_at: string
}

export class CapsuleManager {
  private supabase = (createClient() as any)

  /**
   * Create a new capsule
   */
  async createCapsule(data: {
    color: Color
    intent?: Intent
    keywords: string[]
    geofence_enabled?: boolean
    latitude?: number
    longitude?: number
    radius_km?: number
  }): Promise<RGYCapsule> {
    // Validate intent based on color
    if (data.color === 'yellow' && data.intent) {
      throw new Error('Yellow capsules cannot have intents')
    }
    if ((data.color === 'green' || data.color === 'red') && !data.intent) {
      throw new Error(`${data.color} capsules require an intent (collaborate/trade/company)`)
    }

    const { data: capsule, error } = await this.supabase
      .from('rgy_capsules')
      .insert({
        color: data.color,
        intent: data.intent || null,
        keywords: data.keywords,
        geofence_enabled: data.geofence_enabled || false,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        radius_km: data.radius_km || 25,
      })
      .select()
      .single()

    if (error) throw error
    return capsule
  }

  /**
   * Get user's capsules
   */
  async getUserCapsules(userId: string): Promise<RGYCapsule[]> {
    const { data, error } = await this.supabase
      .from('rgy_capsules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Update capsule
   */
  async updateCapsule(capsuleId: string, updates: Partial<RGYCapsule>): Promise<RGYCapsule> {
    const { data, error } = await this.supabase
      .from('rgy_capsules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', capsuleId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete (deactivate) capsule
   */
  async deleteCapsule(capsuleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('rgy_capsules')
      .update({ is_active: false })
      .eq('id', capsuleId)

    if (error) throw error
  }

  /**
   * Find matching capsules using staged algorithm
   * Stage 1: Color match (required)
   * Stage 2: Intent match
   * Stage 3: Keyword match
   */
  async findMatches(
    userId: string,
    capsuleId: string,
    limit: number = 10
  ): Promise<CapsuleMatch[]> {
    const { data, error } = await this.supabase
      .rpc('get_matching_capsules', {
        p_user_id: userId,
        p_capsule_id: capsuleId,
        p_limit: limit,
      })

    if (error) throw error
    return data || []
  }

  /**
   * Create proactive match suggestions for user
   */
  async createProactiveSuggestions(userId: string): Promise<void> {
    // Get user's active capsules
    const capsules = await this.getUserCapsules(userId)

    for (const capsule of capsules) {
      // Find matches for each capsule
      const matches = await this.findMatches(userId, capsule.id, 5)

      // Create suggestions for high-score matches (>= 70)
      for (const match of matches) {
        if (match.match_score >= 70) {
          await this.supabase.from('rgy_match_suggestions').insert({
            user_id: userId,
            suggested_user_id: match.user_id,
            capsule_id: capsule.id,
            match_score: match.match_score,
            color_match: match.color_match,
            intent_match: match.intent_match,
            keyword_match_count: match.keyword_matches,
            is_proactive: true,
          })
        }
      }
    }
  }

  /**
   * Get match suggestions for user
   */
  async getMatchSuggestions(userId: string, limit: number = 20): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('rgy_match_suggestions')
      .select(`
        *,
        suggested_user:suggested_user_id(id, email),
        capsule:capsule_id(color, intent, keywords)
      `)
      .eq('user_id', userId)
      .eq('is_viewed', false)
      .gte('match_score', 70)
      .gt('expires_at', new Date().toISOString())
      .order('match_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Mark suggestion as viewed
   */
  async markSuggestionViewed(suggestionId: string): Promise<void> {
    await this.supabase
      .from('rgy_match_suggestions')
      .update({ is_viewed: true })
      .eq('id', suggestionId)
  }

  /**
   * Accept a match suggestion
   */
  async acceptSuggestion(suggestionId: string): Promise<void> {
    await this.supabase
      .from('rgy_match_suggestions')
      .update({ is_accepted: true })
      .eq('id', suggestionId)
  }

  /**
   * Create a chat room from capsule
   */
  async createChatRoom(data: {
    name: string
    color: Color
    intent?: Intent
    keywords: string[]
    is_geofenced?: boolean
    latitude?: number
    longitude?: number
    radius_km?: number
    max_participants?: number
  }): Promise<ChatRoom> {
    const { data: room, error } = await this.supabase
      .from('rgy_chat_rooms')
      .insert({
        name: data.name,
        color: data.color,
        intent: data.intent || null,
        keywords: data.keywords,
        is_geofenced: data.is_geofenced || false,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        radius_km: data.radius_km || null,
        max_participants: data.max_participants || 50,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) throw error
    return room
  }

  /**
   * Get available chat rooms
   */
  async getChatRooms(filters?: {
    color?: Color
    intent?: Intent
    keywords?: string[]
  }): Promise<ChatRoom[]> {
    let query = this.supabase
      .from('rgy_chat_rooms')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (filters?.color) {
      query = query.eq('color', filters.color)
    }

    if (filters?.intent) {
      query = query.eq('intent', filters.intent)
    }

    const { data, error } = await query.order('participant_count', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Join a chat room
   */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.from('rgy_room_participants').insert({
      room_id: roomId,
      user_id: userId,
    })

    if (error) throw error
  }

  /**
   * Leave a chat room
   */
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('rgy_room_participants')
      .update({ is_active: false })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) throw error
  }

  /**
   * Send message in room
   */
  async sendRoomMessage(roomId: string, userId: string, message: string): Promise<void> {
    const { error } = await this.supabase.from('rgy_room_messages').insert({
      room_id: roomId,
      user_id: userId,
      message,
    })

    if (error) throw error
  }

  /**
   * Get room messages
   */
  async getRoomMessages(roomId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('rgy_room_messages')
      .select(`
        *,
        user:user_id(id, email)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).reverse()
  }

  /**
   * Subscribe to room messages
   */
  subscribeToRoom(roomId: string, callback: (message: any) => void) {
    return this.supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rgy_room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => callback(payload.new)
      )
      .subscribe()
  }

  /**
   * Format capsule as string: color:intent:keywords
   */
  formatCapsule(capsule: RGYCapsule): string {
    const parts: string[] = [capsule.color]
    if (capsule.intent) {
      parts.push(capsule.intent)
    }
    parts.push(capsule.keywords.join(','))
    return parts.join(':')
  }

  /**
   * Parse capsule string: color:intent:keywords
   */
  parseCapsule(capsuleString: string): {
    color: Color
    intent?: Intent
    keywords: string[]
  } {
    const parts = capsuleString.split(':')

    if (parts.length < 2) {
      throw new Error('Invalid capsule format')
    }

    const color = parts[0] as Color
    let intent: Intent | undefined
    let keywordsStr: string

    if (parts.length === 3) {
      intent = parts[1] as Intent
      keywordsStr = parts[2]
    } else {
      keywordsStr = parts[1]
    }

    const keywords = keywordsStr.split(',').filter((k) => k.trim())

    return { color, intent, keywords }
  }
}

export const capsuleManager = new CapsuleManager()
