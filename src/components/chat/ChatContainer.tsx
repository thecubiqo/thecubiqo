'use client'

/**
 * ChatContainer - Main chat interface with voice and persistence
 */

import { useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { AutopilotStatus } from './AutopilotStatus'
import { useChat } from '@/hooks/useChat'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
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
  const hasInitializedRef = useRef(false)

  const handleSpeakStart = useCallback(() => onSpeakingChange?.(true), [onSpeakingChange])
  const handleSpeakEnd = useCallback(() => onSpeakingChange?.(false), [onSpeakingChange])

  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS({
    colorName: currentColor,
    onStart: handleSpeakStart,
    onEnd: handleSpeakEnd
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
    if (!isInitialized || conversationHistory.length === 0) return

    const currentIndex = conversationHistory.length - 1

    // On first initialization, skip speaking loaded history
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      lastSpokenIndexRef.current = currentIndex
      return
    }

    if (!isSpeaking && currentIndex > lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = currentIndex
      const lastEntry = conversationHistory[currentIndex]
      speak(lastEntry.aiResponse)
    }
  }, [conversationHistory.length, speak, isInitialized, isSpeaking])

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
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {!isInitialized ? 'Loading...' : isLoading ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready'}
          </span>
          {isTTSLoading && (
            <div className="w-1 h-1 bg-orange-500 rounded-full animate-ping" />
          )}
        </div>
        {isSpeaking && (
          <button onClick={stop} className="text-xs text-red-500 hover:text-red-600 font-medium">
            Stop Audio
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
              <div key={index} className="space-y-4 mb-4">
                <ChatMessage role="user" content={entry.userMessage} timestamp={entry.timestamp || new Date().toISOString()} />
                <ChatMessage role="assistant" content={entry.aiResponse} color={entry.color} timestamp={entry.timestamp || new Date().toISOString()} />
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-red-600 dark:text-red-400 leading-tight">
              {error.includes('NO_PROVIDERS_CONFIGURED') || error.includes('ALL_PROVIDERS_FAILED')
                ? 'CubiQo is temporarily unable to respond. Please try again shortly.'
                : error}
            </p>
            <button onClick={clearError} className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
              <span className="sr-only">Dismiss</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Autopilot Status */}
      <AutopilotStatus sessionId={sessionId} />

      {/* Input Area */}
      <div className="shrink-0">
        <ChatInput onSend={handleSend} disabled={isLoading || !isInitialized} />
      </div>
    </div>
  )
}
