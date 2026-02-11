'use client'

/**
 * ChatMessage - Individual message bubble with Action Card support
 * Parses AI responses for action blocks and renders them as interactive cards
 */

import { useState, useMemo } from 'react'
import type { ColorName } from '@/config/colors'
import { COLORS } from '@/config/colors'
import { parseActionsFromResponse } from '@/lib/actions/action-parser'
import { ActionCard } from '@/components/actions/ActionCard'
import type { Action } from '@/lib/actions/action-types'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  color?: ColorName
  timestamp?: string
  onActionConfirm?: (actionId: string, action: Action) => Promise<void>
  onActionCancel?: (actionId: string) => void
}

export function ChatMessage({
  role,
  content,
  color = 'ORANGE',
  timestamp,
  onActionConfirm,
  onActionCancel
}: ChatMessageProps) {
  const isUser = role === 'user'
  const colorConfig = COLORS[color]

  // Parse the response for action cards (only for assistant messages)
  const { text, actions: parsedActions } = useMemo(() => {
    if (isUser) return { text: content, actions: [] }
    return parseActionsFromResponse(content)
  }, [content, isUser])

  // Track action states locally
  const [actions, setActions] = useState<Action[]>(parsedActions)

  const handleConfirm = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId)
    if (!action) return

    // Update local state
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'confirmed' as const } : a
    ))

    // Call external handler if provided
    if (onActionConfirm) {
      await onActionConfirm(actionId, action)
    }
  }

  const handleCancel = (actionId: string) => {
    setActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'cancelled' as const } : a
    ))
    onActionCancel?.(actionId)
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[85%] space-y-2">
        {/* Text content */}
        {text && (
          <div
            className={`rounded-2xl px-4 py-3 ${isUser
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-br-md'
                : 'rounded-bl-md'
              }`}
            style={
              !isUser
                ? {
                  backgroundColor: `${colorConfig.hex}20`,
                  borderLeft: `3px solid ${colorConfig.hex}`
                }
                : undefined
            }
          >
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${!isUser ? 'text-zinc-900 dark:text-white' : ''}`}>
              {text}
            </p>
            {timestamp && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {new Date(timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        )}

        {/* Action Cards */}
        {actions.length > 0 && (
          <div className="space-y-2">
            {actions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
