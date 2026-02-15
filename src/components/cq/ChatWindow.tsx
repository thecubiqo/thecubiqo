'use client'

/**
 * ChatWindow - Direct message conversation view with a specific friend
 */

import { useEffect, useRef } from 'react'
import { useDirectMessages } from '@/hooks/useDirectMessages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { CallControls } from './CallControls'
import type { FriendWithProfile } from '@/types/cq'

interface ChatWindowProps {
  friend: FriendWithProfile
  currentUserId: string
  onBack: () => void
}

export function ChatWindow({ friend, currentUserId, onBack }: ChatWindowProps) {
  const { messages, loading, sendMessage, markAsRead, markAsVoiceDelivered } = useDirectMessages(
    friend.friend_id
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when viewing
  useEffect(() => {
    markAsRead()
  }, [friend.friend_id, markAsRead])

  const handleSend = async (content: string) => {
    await sendMessage(content)
  }

  const handleVoicePlay = async (messageId: string) => {
    await markAsVoiceDelivered(messageId)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-zinc-800 rounded transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
            {friend.friend_profile?.avatar_url ? (
              <img
                src={friend.friend_profile.avatar_url}
                alt={friend.friend_profile.display_name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <svg className="w-6 h-6 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>

          <div>
            <p className="text-white font-medium text-sm">
              {friend.friend_profile?.display_name || 'User'}
            </p>
            <p className="text-zinc-400 text-xs font-mono">
              {friend.friend_profile?.handle}
            </p>
          </div>
        </div>

        <CallControls />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm text-center">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
                onVoicePlay={handleVoicePlay}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  )
}
