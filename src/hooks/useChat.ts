'use client'

/**
 * useChat Hook
 * Client-side chat with server API for authenticated users
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ColorName } from '@/config/colors'
import type { ConversationEntry, AIResponse } from '@/lib/ai'
import { BYO_STORAGE_KEY, type BYOConfig } from '@/lib/byo/types'

// Helper to get BYO headers from localStorage
function getBYOHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(BYO_STORAGE_KEY)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BYO Debug] localStorage raw:', stored)
    }
    if (!stored) return {}

    const config: BYOConfig = JSON.parse(stored)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BYO Debug] parsed config:', { enabled: config.enabled, hasClaudeKey: !!config.claudeApiKey })
    }
    if (!config.enabled) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[BYO Debug] BYO not enabled, returning empty headers')
      }
      return {}
    }

    const headers: Record<string, string> = {}
    if (config.claudeApiKey) {
      headers['x-byo-claude-key'] = config.claudeApiKey
      if (process.env.NODE_ENV === 'development') {
        console.log('[BYO Debug] Adding Claude key header')
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[BYO Debug] Final headers count:', Object.keys(headers).length)
    }
    return headers
  } catch (e) {
    console.error('[BYO] Error parsing config:', e)
    return {}
  }
}

interface UseChatOptions {
  sessionId: string | null
  isGuest?: boolean
  onColorChange?: (color: ColorName) => void
  regionId?: string | null
}

interface ChatState {
  isLoading: boolean
  error: string | null
  conversationHistory: ConversationEntry[]
  conversationId: string | null
  lastProvider: 'claude' | 'minimax' | 'mixtral' | 'llama' | null
  isInitialized: boolean
}

export function useChat(options: UseChatOptions) {
  const { sessionId, isGuest = false, onColorChange, regionId } = options
  const supabase = createClient()
  const supabaseRef = useRef(supabase)
  const lastSessionIdRef = useRef<string | null>(null)
  const onColorChangeRef = useRef(onColorChange)

  // Use a promise ref to dedup initialization calls
  const initPromiseRef = useRef<Promise<string | null> | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const conversationHistoryRef = useRef<ConversationEntry[]>([])

  const [state, setState] = useState<ChatState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
    conversationId: null,
    lastProvider: null,
    isInitialized: false
  })

  // Keep refs in sync with state and props
  useEffect(() => {
    onColorChangeRef.current = onColorChange
  }, [onColorChange])

  useEffect(() => {
    conversationIdRef.current = state.conversationId
  }, [state.conversationId])

  useEffect(() => {
    conversationHistoryRef.current = state.conversationHistory
  }, [state.conversationHistory])

  const ensureConversation = useCallback(async (currentSessionId: string): Promise<string | null> => {
    // If we already have a conversation for this session, return it
    if (conversationIdRef.current && lastSessionIdRef.current === currentSessionId) {
      return conversationIdRef.current
    }

    // If verification/creation is in progress, return the existing promise
    if (initPromiseRef.current) {
      return initPromiseRef.current
    }

    const init = async () => {
      try {
        let conversationId: string | null = null
        let colorState: string = 'ORANGE'

        // Always use server API for creating/managing conversations
        // This ensures consistent behavior and bypasses client-side RLS/env var issues
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ensure_conversation', sessionId: currentSessionId })
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create conversation')
        }

        const { conversation } = await res.json()
        conversationId = conversation.id
        colorState = conversation.color_state || 'ORANGE'

        if (!conversationId) throw new Error('Failed to get conversation ID')

        // Load existing messages via API
        let history: ConversationEntry[] = []

        const msgRes = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_messages', conversationId })
        })

        if (msgRes.ok) {
          const { messages } = await msgRes.json()
          if (messages) {
            const pairs: ConversationEntry[] = []
            for (let i = 0; i < messages.length; i += 2) {
              const userMsg = messages[i]
              const aiMsg = messages[i + 1]
              if (userMsg?.role === 'user' && aiMsg?.role === 'assistant') {
                pairs.push({
                  userMessage: userMsg.content,
                  aiResponse: aiMsg.content,
                  color: (aiMsg.color as ColorName) || 'ORANGE',
                  timestamp: userMsg.created_at || new Date().toISOString()
                })
              }
            }
            history = pairs
          }
        }

        const lastColor = history.length > 0
          ? history[history.length - 1].color
          : (colorState as ColorName) || 'ORANGE'

        if (onColorChangeRef.current && lastColor) {
          onColorChangeRef.current(lastColor)
        }

        setState(prev => ({
          ...prev,
          conversationId,
          conversationHistory: history,
          isInitialized: true,
          error: null
        }))

        return conversationId
      } catch (error) {
        console.warn('[useChat] Failed to initialize conversation (likely invalid keys). Falling back to temporary local session.', error)

        // Validation Fallback: Allow chat to work without persistence if Supabase fails
        const tempId = `temp-${Date.now()}`

        setState(prev => ({
          ...prev,
          conversationId: tempId,
          conversationHistory: [],
          isInitialized: true,
          error: null // Clear error to allow UI to render
        }))

        return tempId
      } finally {
        initPromiseRef.current = null
      }
    }

    initPromiseRef.current = init()
    return initPromiseRef.current
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabaseRef is stable, onColorChange used via ref pattern
  }, [isGuest])


  // Trigger initialization when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      // For guests without session yet, mark as initialized anyway
      // Conversation will be created lazily on first message
      setState(prev => ({ ...prev, isInitialized: true }))
      return
    }

    if (lastSessionIdRef.current === sessionId) return
    lastSessionIdRef.current = sessionId
    ensureConversation(sessionId)
  }, [sessionId, ensureConversation])


  const sendMessage = useCallback(async (
    message: string,
    currentColor: ColorName = 'ORANGE'
  ): Promise<AIResponse | null> => {

    // 1. Ensure we have a valid session to attach to
    if (!sessionId) {
      setState(prev => ({ ...prev, error: 'Session not ready. Please wait a moment.' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // 2. Ensure conversation is initialized (awaits if pending, retries if missing)
    let activeConversationId = conversationIdRef.current
    if (!activeConversationId) {
      try {
        activeConversationId = await ensureConversation(sessionId)
        if (!activeConversationId) throw new Error('Could not initialize conversation.')
      } catch (e) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to start conversation. Please refresh.' }))
        return null
      }
    }

    try {
      const currentHistory = conversationHistoryRef.current
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getBYOHeaders()
        },
        body: JSON.stringify({
          message,
          conversationHistory: currentHistory,
          currentColor,
          isGuest,
          messageCount: currentHistory.length + 1,
          sessionId, // Use sessionId from prop/closure
          region: regionId || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      const timestamp = new Date().toISOString()

      // Save messages (only if we have a real conversation)
      if (!activeConversationId.startsWith('temp-')) {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_messages_batch',
            conversationId: activeConversationId,
            messages: [
              { role: 'user', content: message, color: currentColor },
              { role: 'assistant', content: data.response, color: data.color }
            ]
          })
        }).catch(e => console.warn('Failed to save messages:', e))
      } else {
        console.log('[useChat] Skipping persistence for temporary session')
      }

      // Background memory extraction
      fetch('/api/extract-memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getBYOHeaders()
        },
        body: JSON.stringify({
          sessionId,
          userMessage: message,
          aiResponse: data.response
        })
      }).catch(console.warn)

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

      if (onColorChangeRef.current && data.color !== currentColor) {
        onColorChangeRef.current(data.color)
      }

      return { color: data.color, response: data.response }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs used for conversationId, conversationHistory, onColorChange
  }, [sessionId, isGuest, ensureConversation, regionId])

  const clearHistory = useCallback(async () => {
    setState(prev => ({ ...prev, conversationHistory: [], error: null }))
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
    lastProvider: state.lastProvider,
    isInitialized: state.isInitialized
  }
}
