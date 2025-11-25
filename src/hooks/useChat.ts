'use client'

/**
 * useChat Hook
 * Client-side chat with Supabase persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ColorName } from '@/config/colors'
import type { ConversationEntry, AIResponse } from '@/lib/ai'

interface UseChatOptions {
  sessionId: string | null
  onColorChange?: (color: ColorName) => void
}

interface ChatState {
  isLoading: boolean
  error: string | null
  conversationHistory: ConversationEntry[]
  conversationId: string | null
  lastProvider: 'claude' | 'openai' | null
  isInitialized: boolean
}

export function useChat(options: UseChatOptions) {
  const { sessionId, onColorChange } = options
  const supabase = createClient()
  const initRef = useRef(false)

  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
    conversationId: null,
    lastProvider: null,
    isInitialized: false
  })

  // Load or create conversation on mount
  useEffect(() => {
    if (!sessionId || initRef.current) return
    initRef.current = true

    const initConversation = async () => {
      try {
        // Try to find existing conversation for this session
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id, color_state')
          .eq('session_id', sessionId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        let conversationId = existingConv?.id

        if (!conversationId) {
          // Create new conversation
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({ session_id: sessionId, color_state: 'ORANGE' })
            .select('id')
            .single()

          if (error) throw error
          conversationId = newConv.id
        }

        // Load existing messages
        const { data: messages } = await supabase
          .from('messages')
          .select('role, content, color, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        // Convert to conversation history format
        const history: ConversationEntry[] = []
        if (messages) {
          for (let i = 0; i < messages.length; i += 2) {
            const userMsg = messages[i]
            const aiMsg = messages[i + 1]
            if (userMsg && aiMsg && userMsg.role === 'user' && aiMsg.role === 'assistant') {
              history.push({
                userMessage: userMsg.content,
                aiResponse: aiMsg.content,
                color: (aiMsg.color as ColorName) || 'ORANGE',
                timestamp: userMsg.created_at || new Date().toISOString()
              })
            }
          }
        }

        // Set initial color from last message or conversation state
        const lastColor = history.length > 0
          ? history[history.length - 1].color
          : (existingConv?.color_state as ColorName) || 'ORANGE'

        if (onColorChange && lastColor) {
          onColorChange(lastColor)
        }

        setState(prev => ({
          ...prev,
          conversationId,
          conversationHistory: history,
          isInitialized: true
        }))

      } catch (error) {
        console.error('Failed to init conversation:', error)
        setState(prev => ({ ...prev, isInitialized: true }))
      }
    }

    initConversation()
  }, [sessionId, supabase, onColorChange])

  const sendMessage = useCallback(async (
    message: string,
    currentColor: ColorName = 'ORANGE'
  ): Promise<AIResponse | null> => {
    if (!state.conversationId) {
      setState(prev => ({ ...prev, error: 'No conversation initialized' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const timestamp = new Date().toISOString()

      // Save user message
      await supabase.from('messages').insert({
        conversation_id: state.conversationId,
        role: 'user',
        content: message,
        color: currentColor
      })

      // Save AI response
      await supabase.from('messages').insert({
        conversation_id: state.conversationId,
        role: 'assistant',
        content: data.response,
        color: data.color
      })

      // Update conversation color state
      await supabase
        .from('conversations')
        .update({ color_state: data.color, updated_at: timestamp })
        .eq('id', state.conversationId)

      const newEntry: ConversationEntry = {
        userMessage: message,
        aiResponse: data.response,
        color: data.color,
        timestamp
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        conversationHistory: [...prev.conversationHistory, newEntry],
        lastProvider: data.provider
      }))

      if (onColorChange && data.color !== currentColor) {
        onColorChange(data.color)
      }

      return { color: data.color, response: data.response }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [state.conversationId, state.conversationHistory, supabase, onColorChange])

  const clearHistory = useCallback(async () => {
    if (!state.conversationId) return

    // Delete messages from database
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', state.conversationId)

    setState(prev => ({
      ...prev,
      conversationHistory: [],
      error: null
    }))
  }, [state.conversationId, supabase])

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
    lastProvider: state.lastProvider,
    isInitialized: state.isInitialized
  }
}
