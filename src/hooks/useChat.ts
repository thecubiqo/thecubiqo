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
  isGuest?: boolean
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
  const { sessionId, isGuest = false, onColorChange } = options
  const supabase = createClient()
  const lastSessionIdRef = useRef<string | null>(null)

  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
    conversationId: null,
    lastProvider: null,
    isInitialized: false
  })

  // Load or create conversation when sessionId changes
  useEffect(() => {
    // Skip if no sessionId or already initialized for this session
    if (!sessionId || lastSessionIdRef.current === sessionId) return
    lastSessionIdRef.current = sessionId

    const initConversation = async () => {
      console.log('[useChat] Initializing conversation for session:', sessionId)

      try {
        // Try to find existing conversation for this session
        const { data: existingConv, error: findError } = await supabase
          .from('conversations')
          .select('id, color_state')
          .eq('session_id', sessionId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle() // Use maybeSingle to avoid error when no rows

        if (findError) {
          console.error('[useChat] Error finding conversation:', findError)
        }

        let conversationId = existingConv?.id

        if (!conversationId) {
          console.log('[useChat] Creating new conversation')
          // Create new conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ session_id: sessionId, color_state: 'ORANGE' })
            .select('id')
            .single()

          if (createError) {
            console.error('[useChat] Error creating conversation:', createError)
            setState(prev => ({
              ...prev,
              isInitialized: true,
              error: `Failed to create conversation: ${createError.message}`
            }))
            return
          }
          conversationId = newConv.id
        }

        console.log('[useChat] Conversation ID:', conversationId)

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

        console.log('[useChat] Loaded', history.length, 'messages')

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
          isInitialized: true,
          error: null
        }))

      } catch (error) {
        console.error('[useChat] Failed to init conversation:', error)
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    initConversation()
  }, [sessionId, supabase, onColorChange])

  const sendMessage = useCallback(async (
    message: string,
    currentColor: ColorName = 'ORANGE'
  ): Promise<AIResponse | null> => {
    if (!state.conversationId) {
      console.error('[useChat] No conversation ID, state:', state)
      setState(prev => ({ ...prev, error: 'No conversation initialized. Please refresh the page.' }))
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
          currentColor,
          isGuest,
          messageCount: state.conversationHistory.length + 1
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      const timestamp = new Date().toISOString()

      // Save user message
      const { error: userMsgError } = await supabase.from('messages').insert({
        conversation_id: state.conversationId,
        role: 'user',
        content: message,
        color: currentColor
      })
      if (userMsgError) console.error('[useChat] Error saving user message:', userMsgError)

      // Save AI response
      const { error: aiMsgError } = await supabase.from('messages').insert({
        conversation_id: state.conversationId,
        role: 'assistant',
        content: data.response,
        color: data.color
      })
      if (aiMsgError) console.error('[useChat] Error saving AI message:', aiMsgError)

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
