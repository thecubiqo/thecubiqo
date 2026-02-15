'use client'

/**
 * MessageBubble - Individual message with timestamp, read status, and voice playback
 */

import { useState } from 'react'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import type { DirectMessageWithProfile } from '@/types/cq'

interface MessageBubbleProps {
  message: DirectMessageWithProfile
  isOwn: boolean
  onVoicePlay?: (messageId: string) => void
}

export function MessageBubble({ message, isOwn, onVoicePlay }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const { speak, isSpeaking } = useElevenLabsTTS()

  const handlePlayVoice = async () => {
    if (isSpeaking) return

    setIsPlaying(true)
    await speak(message.content)
    setIsPlaying(false)

    if (onVoicePlay && !message.is_voice_delivered) {
      onVoicePlay(message.id)
    }
  }

  const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isOwn
            ? 'bg-[#FF6F00] text-white'
            : 'bg-zinc-800 text-white'
        }`}
      >
        {!isOwn && message.sender_profile && (
          <p className="text-xs text-zinc-400 mb-1 font-medium">
            {message.sender_profile.display_name || message.sender_profile.handle}
          </p>
        )}
        
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        <div className={`flex items-center gap-2 mt-2 text-xs ${isOwn ? 'text-white/70' : 'text-zinc-500'}`}>
          <span>{timestamp}</span>
          
          {!isOwn && (
            <button
              onClick={handlePlayVoice}
              disabled={isPlaying}
              className={`flex items-center gap-1 hover:text-[#FF6F00] transition-colors ${
                isPlaying ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Play in Cubiqo Voice"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              {message.is_voice_delivered && <span className="text-[10px]">✓</span>}
            </button>
          )}

          {isOwn && (
            <span className="text-[10px]">{message.is_read ? '✓✓' : '✓'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
