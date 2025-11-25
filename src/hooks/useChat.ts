'use client'

/**
 * useChat Hook
 * Client-side chat functionality with AI
 */

import { useState, useCallback } from 'react'
import type { ColorName } from '@/config/colors'
import type { ConversationEntry, AIResponse } from '@/lib/ai'

interface UseChatOptions {
  onColorChange?: (color: ColorName) => void
}

interface ChatState {
  isLoading: boolean
  error: string | null
  conversationHistory: ConversationEntry[]
  lastProvider: 'claude' | 'openai' | null
}

export function useChat(options: UseChatOptions = {}) {
  const { onColorChange } = options

  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
    lastProvider: null
  })

  const sendMessage = useCallback(async (
    message: string,
    currentColor: ColorName = 'ORANGE'
  ): Promise<AIResponse | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationHistory: state.conversationHistory,
          currentColor
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()

      // Add to conversation history
      const newEntry: ConversationEntry = {
        userMessage: message,
        aiResponse: data.response,
        color: data.color,
        timestamp: new Date().toISOString()
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        conversationHistory: [...prev.conversationHistory, newEntry],
        lastProvider: data.provider
      }))

      // Notify color change
      if (onColorChange && data.color !== currentColor) {
        onColorChange(data.color)
      }

      return {
        color: data.color,
        response: data.response
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [state.conversationHistory, onColorChange])

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationHistory: [],
      error: null
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    sendMessage,
    clearHistory,
    clearError,
    isLoading: state.isLoading,
    error: state.error,
    conversationHistory: state.conversationHistory,
    lastProvider: state.lastProvider
  }
}
