'use client'

/**
 * useDirectMessages - Hook for direct messaging
 * Handles sending, receiving, and managing direct messages
 */

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DirectMessageWithProfile } from '@/types/cq'

export function useDirectMessages(friendId?: string) {
  const [messages, setMessages] = useState<DirectMessageWithProfile[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch messages with a specific friend
  const fetchMessages = useCallback(async () => {
    if (!friendId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessages([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender_profile:profiles!direct_messages_sender_id_fkey(handle, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages((data || []) as DirectMessageWithProfile[])
    } catch (err) {
      console.error('[useDirectMessages] Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [friendId, supabase])

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUnreadCount(0)
        return
      }

      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(count || 0)
    } catch (err) {
      console.error('[useDirectMessages] Error fetching unread count:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchMessages()
    fetchUnreadCount()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const newMessage = payload.new as DirectMessageWithProfile

          // If this message is for the current conversation, add it
          if (
            friendId &&
            ((newMessage.sender_id === user.id && newMessage.receiver_id === friendId) ||
              (newMessage.sender_id === friendId && newMessage.receiver_id === user.id))
          ) {
            // Fetch sender profile
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('handle, display_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single()

            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                sender_profile: senderProfile || {
                  handle: 'Unknown',
                  display_name: null,
                  avatar_url: null,
                },
              },
            ])
          }

          // Update unread count
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [friendId, fetchMessages, fetchUnreadCount, supabase])

  // Send a message
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!friendId) {
        setError('No friend selected')
        return false
      }

      try {
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Not authenticated')
          return false
        }

        const { error } = await supabase.from('direct_messages').insert({
          sender_id: user.id,
          receiver_id: friendId,
          content,
        })

        if (error) throw error

        return true
      } catch (err) {
        console.error('[useDirectMessages] Error sending message:', err)
        setError(err instanceof Error ? err.message : 'Failed to send message')
        return false
      }
    },
    [friendId, supabase]
  )

  // Mark messages as read
  const markAsRead = useCallback(async (): Promise<boolean> => {
    if (!friendId) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', friendId)
        .eq('is_read', false)

      if (error) throw error

      fetchUnreadCount()
      return true
    } catch (err) {
      console.error('[useDirectMessages] Error marking as read:', err)
      return false
    }
  }, [friendId, supabase, fetchUnreadCount])

  // Mark message as voice delivered
  const markAsVoiceDelivered = useCallback(
    async (messageId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('direct_messages')
          .update({ is_voice_delivered: true })
          .eq('id', messageId)

        if (error) throw error

        // Update local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, is_voice_delivered: true } : msg
          )
        )

        return true
      } catch (err) {
        console.error('[useDirectMessages] Error marking as voice delivered:', err)
        return false
      }
    },
    [supabase]
  )

  return {
    messages,
    unreadCount,
    loading,
    error,
    sendMessage,
    markAsRead,
    markAsVoiceDelivered,
    refetch: fetchMessages,
  }
}
