'use client'

/**
 * ChatContainer - Main chat interface with voice and persistence
 */

import { useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import type { ColorName } from '@/config/colors'

interface ChatContainerProps {
  sessionId: string | null
  currentColor: ColorName
  onColorChange: (color: ColorName) => void
  onSpeakingChange?: (isSpeaking: boolean) => void
  regionId?: string | null
}

export function ChatContainer({ sessionId, currentColor, onColorChange, onSpeakingChange, regionId }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSpokenIndexRef = useRef<number>(-1)

  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis({
    rate: 0.95,
    pitch: 1,
    onStart: () => onSpeakingChange?.(true),
    onEnd: () => onSpeakingChange?.(false)
  })

  const {
    sendMessage,
    isLoading,
    error,
    conversationHistory,
    clearError,
    isInitialized
  } = useChat({
    sessionId,
    onColorChange,
    regionId
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory.length])

  // Speak only NEW AI responses (not loaded from DB)
  useEffect(() => {
    const currentIndex = conversationHistory.length - 1
    if (
      ttsSupported &&
      isInitialized &&
      conversationHistory.length > 0 &&
      currentIndex > lastSpokenIndexRef.current
    ) {
      lastSpokenIndexRef.current = currentIndex
      const lastEntry = conversationHistory[currentIndex]
      speak(lastEntry.aiResponse)
    }
  }, [conversationHistory.length, ttsSupported, speak, isInitialized])

  // Reset spoken index when initialized with existing history
  useEffect(() => {
    if (isInitialized && conversationHistory.length > 0) {
      lastSpokenIndexRef.current = conversationHistory.length - 1
    }
  }, [isInitialized])

  const handleSend = async (message: string) => {
    if (isSpeaking) {
      stop()
    }
    await sendMessage(message, currentColor)
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 items-center justify-center">
        <span className="text-zinc-500 text-sm">Initializing session...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {!isInitialized ? 'Loading...' : isLoading ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready'}
        </span>
        {ttsSupported && isSpeaking && (
          <button onClick={stop} className="text-xs text-red-500 hover:text-red-600">
            Stop
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isInitialized ? (
          <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading conversation...
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
            Start a conversation with CubiQo
          </div>
        ) : (
          <>
            {conversationHistory.map((entry, index) => (
              <div key={index}>
                <ChatMessage role="user" content={entry.userMessage} timestamp={entry.timestamp} />
                <ChatMessage role="assistant" content={entry.aiResponse} color={entry.color} timestamp={entry.timestamp} />
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
            <p className="text-sm text-red-600 dark:text-red-400">
              {error.includes('NO_PROVIDERS_CONFIGURED') || error.includes('ALL_PROVIDERS_FAILED')
                ? 'CubiQo is temporarily unable to respond. Please try again shortly.'
                : error}
            </p>
            <button onClick={clearError} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSend={handleSend} disabled={isLoading || !isInitialized} />
    </div>
  )
}
