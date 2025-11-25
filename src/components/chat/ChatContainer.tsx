'use client'

/**
 * ChatContainer - Main chat interface
 */

import { useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'
import type { ColorName } from '@/config/colors'

interface ChatContainerProps {
  currentColor: ColorName
  onColorChange: (color: ColorName) => void
}

export function ChatContainer({ currentColor, onColorChange }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    sendMessage,
    isLoading,
    error,
    conversationHistory,
    clearError
  } = useChat({
    onColorChange
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  const handleSend = async (message: string) => {
    await sendMessage(message, currentColor)
  }

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversationHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
            Start a conversation with CubiQo
          </div>
        ) : (
          <>
            {conversationHistory.map((entry, index) => (
              <div key={index}>
                {/* User Message */}
                <ChatMessage
                  role="user"
                  content={entry.userMessage}
                  timestamp={entry.timestamp}
                />
                {/* AI Response */}
                <ChatMessage
                  role="assistant"
                  content={entry.aiResponse}
                  color={entry.color}
                  timestamp={entry.timestamp}
                />
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  )
}
