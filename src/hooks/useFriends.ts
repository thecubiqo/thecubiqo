'use client'

/**
 * useFriends - Hook for friend management
 * Handles friend requests, acceptance, blocking, and removal
 */

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FriendWithProfile, FriendStatus } from '@/types/cq'

export function useFriends() {
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch friends and pending requests
  const fetchFriends = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setFriends([])
        setPendingRequests([])
        setLoading(false)
        return
      }

      // Get accepted friends
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(handle, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (acceptedError) throw acceptedError

      // Get pending incoming requests (where current user is friend_id)
      const { data: pendingData, error: pendingError } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_user_id_fkey(handle, display_name, avatar_url)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      setFriends((acceptedData || []) as FriendWithProfile[])
      setPendingRequests((pendingData || []) as FriendWithProfile[])
    } catch (err) {
      console.error('[useFriends] Error fetching friends:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  // Send friend request by CQ number
  const sendFriendRequest = useCallback(async (cqNumber: string): Promise<boolean> => {
    try {
      setError(null)

      // First, lookup the user by CQ number
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', cqNumber)
        .single()

      if (profileError || !profileData) {
        setError('User not found')
        return false
      }

      // Check if already friends or request exists
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return false
      }

      // Can't friend yourself
      if (profileData.id === user.id) {
        setError('Cannot send friend request to yourself')
        return false
      }

      // Check if relationship already exists
      const { data: existingFriend } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user.id})`)
        .single()

      if (existingFriend) {
        setError('Friend request already exists or you are already friends')
        return false
      }

      // Send friend request
      const { error: insertError } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: profileData.id,
          status: 'pending',
        })

      if (insertError) throw insertError

      await fetchFriends()
      return true
    } catch (err) {
      console.error('[useFriends] Error sending friend request:', err)
      setError(err instanceof Error ? err.message : 'Failed to send friend request')
      return false
    }
  }, [fetchFriends])

  // Accept friend request
  const acceptFriendRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
      return true
    } catch (err) {
      console.error('[useFriends] Error accepting friend request:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept friend request')
      return false
    }
  }, [fetchFriends])

  // Decline friend request
  const declineFriendRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
      return true
    } catch (err) {
      console.error('[useFriends] Error declining friend request:', err)
      setError(err instanceof Error ? err.message : 'Failed to decline friend request')
      return false
    }
  }, [fetchFriends])

  // Block user
  const blockUser = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('friends')
        .update({ status: 'blocked', updated_at: new Date().toISOString() })
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
      return true
    } catch (err) {
      console.error('[useFriends] Error blocking user:', err)
      setError(err instanceof Error ? err.message : 'Failed to block user')
      return false
    }
  }, [fetchFriends])

  // Remove friend
  const removeFriend = useCallback(async (friendshipId: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
      return true
    } catch (err) {
      console.error('[useFriends] Error removing friend:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove friend')
      return false
    }
  }, [fetchFriends])

  return {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    blockUser,
    removeFriend,
    refetch: fetchFriends,
  }
}
