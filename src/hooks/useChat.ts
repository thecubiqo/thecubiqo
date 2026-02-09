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
    console.log('[BYO Debug] localStorage raw:', stored)
    if (!stored) return {}

    const config: BYOConfig = JSON.parse(stored)
    console.log('[BYO Debug] parsed config:', { enabled: config.enabled, hasClaudeKey: !!config.claudeApiKey, hasOpenaiKey: !!config.openaiApiKey })
    if (!config.enabled) {
      console.log('[BYO Debug] BYO not enabled, returning empty headers')
      return {}
    }

    const headers: Record<string, string> = {}
    if (config.claudeApiKey) {
      headers['x-byo-claude-key'] = config.claudeApiKey
      console.log('[BYO Debug] Adding Claude key header')
    }
    if (config.openaiApiKey) {
      headers['x-byo-openai-key'] = config.openaiApiKey
      console.log('[BYO Debug] Adding OpenAI key header')
    }
    console.log('[BYO Debug] Final headers count:', Object.keys(headers).length)
    return headers
  } catch (e) {
    console.error('[BYO Debug] Error parsing config:', e)
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
  lastProvider: 'claude' | 'openai' | null
  isInitialized: boolean
}

export function useChat(options: UseChatOptions) {
  const { sessionId, isGuest = false, onColorChange, regionId } = options
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
    if (!sessionId || lastSessionIdRef.current === sessionId) return
    lastSessionIdRef.current = sessionId

    const initConversation = async () => {
      try {
        let conversationId: string | null = null
        let colorState: string = 'ORANGE'

        if (isGuest) {
          // Guest users: direct Supabase (RLS allows anonymous)
          const { data: existingConv, error: findError } = await supabase
            .from('conversations')
            .select('id, color_state')
            .eq('session_id', sessionId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (existingConv) {
            conversationId = existingConv.id
            colorState = existingConv.color_state || 'ORANGE'
          } else {
            const { data: newConv, error: createError } = await supabase
              .from('conversations')
              .insert({ session_id: sessionId, color_state: 'ORANGE' })
              .select('id')
              .single()

            if (createError) {
              setState(prev => ({
                ...prev,
                isInitialized: true,
                error: `Failed to create conversation: ${createError.message}`
              }))
              return
            }
            conversationId = newConv.id
          }
        } else {
          // Authenticated users: use server API
          const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ensure_conversation', sessionId })
          })

          if (!res.ok) {
            const error = await res.json()
            setState(prev => ({
              ...prev,
              isInitialized: true,
              error: error.error || 'Failed to create conversation'
            }))
            return
          }

          const { conversation } = await res.json()
          conversationId = conversation.id
          colorState = conversation.color_state || 'ORANGE'
        }

        if (!conversationId) {
          setState(prev => ({
            ...prev,
            isInitialized: true,
            error: 'Failed to get conversation ID'
          }))
          return
        }

        // Load existing messages
        let history: ConversationEntry[] = []

        if (isGuest) {
          const { data: messages } = await supabase
            .from('messages')
            .select('role, content, color, created_at')
            .eq('conversation_id', conversationId!)
            .order('created_at', { ascending: true })

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
        } else {
          // Get messages via API
          const msgRes = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_messages', conversationId })
          })

          if (msgRes.ok) {
            const { messages } = await msgRes.json()
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
          }
        }

        const lastColor = history.length > 0
          ? history[history.length - 1].color
          : (colorState as ColorName) || 'ORANGE'

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
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    initConversation()
  }, [sessionId, isGuest, supabase, onColorChange])

  const sendMessage = useCallback(async (
    message: string,
    currentColor: ColorName = 'ORANGE',
    options?: { duoMode?: boolean }
  ): Promise<AIResponse | null> => {
    if (!state.conversationId) {
      setState(prev => ({ ...prev, error: 'No conversation initialized. Please refresh the page.' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getBYOHeaders() // Add BYO API keys if enabled
        },
        body: JSON.stringify({
          message,
          conversationHistory: state.conversationHistory,
          currentColor,
          isGuest,
          messageCount: state.conversationHistory.length + 1,
          sessionId,
          region: regionId || undefined,
          duoMode: options?.duoMode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      const timestamp = new Date().toISOString()

      // Save messages via API (bypasses RLS)
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_message',
          conversationId: state.conversationId,
          role: 'user',
          content: message,
          color: currentColor
        })
      })

      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_message',
          conversationId: state.conversationId,
          role: 'assistant',
          content: data.response,
          color: data.color
        })
      })

      // Trigger memory extraction in background (fire-and-forget)
      if (sessionId) {
        fetch('/api/extract-memories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getBYOHeaders() // Add BYO API keys if enabled
          },
          body: JSON.stringify({
            sessionId,
            userMessage: message,
            aiResponse: data.response
          })
        }).catch(() => { }) // Silently ignore extraction errors
      }

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
  }, [state.conversationId, state.conversationHistory, isGuest, onColorChange])

  const clearHistory = useCallback(async () => {
    if (!state.conversationId) return

    // For now, just clear local state
    // Could add API endpoint to delete messages if needed
    setState(prev => ({
      ...prev,
      conversationHistory: [],
      error: null
    }))
  }, [state.conversationId])

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
