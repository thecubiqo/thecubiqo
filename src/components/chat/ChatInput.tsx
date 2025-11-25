'use client'

/**
 * ChatInput - Message input with send button
 */

import { useState, useCallback, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
    }
  }, [message, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700
                   bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm
                   text-zinc-900 dark:text-white placeholder-zinc-500
                   focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium text-sm
                   hover:bg-orange-600 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
      >
        {disabled ? (
          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Send'
        )}
      </button>
    </div>
  )
}
