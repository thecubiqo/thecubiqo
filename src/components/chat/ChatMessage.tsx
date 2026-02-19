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
  imageUrl?: string
}

// Regex to detect image URLs in message content
const IMAGE_URL_PATTERN = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|webp)[^\s)]*)\)/g

function renderContentWithImages(content: string) {
  const parts: (string | { alt: string; url: string })[] = []
  let lastIndex = 0
  let match

  const regex = new RegExp(IMAGE_URL_PATTERN)
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    parts.push({ alt: match[1], url: match[2] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  if (parts.length === 1 && typeof parts[0] === 'string') {
    return null // No images found, use default rendering
  }

  return parts.map((part, i) => {
    if (typeof part === 'string') {
      return <span key={i}>{part}</span>
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={i}
        src={part.url}
        alt={part.alt}
        className="max-w-full rounded-lg mt-2 mb-1"
        loading="lazy"
      />
    )
  })
}

export function ChatMessage({ role, content, color = 'ORANGE', timestamp, imageUrl }: ChatMessageProps) {
  const isUser = role === 'user'
  const colorConfig = COLORS[color]
  const richContent = renderContentWithImages(content)

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
        {richContent ? (
          <div className={`text-sm leading-relaxed ${!isUser ? 'text-zinc-900 dark:text-white' : ''}`}>
            {richContent}
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${!isUser ? 'text-zinc-900 dark:text-white' : ''}`}>
            {content}
          </p>
        )}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Generated image"
            className="max-w-full rounded-lg mt-2"
            loading="lazy"
          />
        )}
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
