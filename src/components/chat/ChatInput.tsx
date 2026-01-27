'use client'

/**
 * ChatInput - Message input with send and voice buttons
 */

import { useState, useCallback, useEffect, type KeyboardEvent } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type or speak...'
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleVoiceResult = useCallback((transcript: string) => {
    setMessage(transcript)
  }, [])

  const {
    startListening,
    stopListening,
    isListening,
    isSupported: voiceSupported,
    transcript
  } = useSpeechRecognition({
    lang: 'en-US',
    onResult: handleVoiceResult
  })

  // Update message when transcript changes (interim results)
  useEffect(() => {
    if (isListening && transcript) {
      setMessage(transcript)
    }
  }, [transcript, isListening])

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

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return (
    <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Voice Button */}
      {voiceSupported && (
        <button
          onClick={toggleVoice}
          disabled={disabled}
          className={`p-3 rounded-xl transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}

      {/* Text Input */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isListening ? 'Listening...' : placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700
                   bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm
                   text-zinc-900 dark:text-white placeholder-zinc-500
                   focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {/* Send Button */}
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  )
}
