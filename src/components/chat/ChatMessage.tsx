'use client'

/**
 * ChatMessage - Individual message bubble
 */

import type { ColorName } from '@/config/colors'
import { COLORS } from '@/config/colors'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  color?: ColorName
  timestamp?: string
}

export function ChatMessage({ role, content, color = 'ORANGE', timestamp }: ChatMessageProps) {
  const isUser = role === 'user'
  const colorConfig = COLORS[color]

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-br-md'
            : 'rounded-bl-md'
        }`}
        style={
          !isUser
            ? {
                backgroundColor: `${colorConfig.hex}20`,
                borderLeft: `3px solid ${colorConfig.hex}`
              }
            : undefined
        }
      >
        <p className={`text-sm leading-relaxed ${!isUser ? 'text-zinc-900 dark:text-white' : ''}`}>
          {content}
        </p>
        {timestamp && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {new Date(timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  )
}
