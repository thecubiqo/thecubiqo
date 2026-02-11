'use client'

/**
 * ChatContainer - Main chat interface with voice and persistence
 */

import { useRef, useEffect, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { DuoModeToggle } from './DuoModeToggle'
import { useChat } from '@/hooks/useChat'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import type { ColorName } from '@/config/colors'

interface ChatContainerProps {
  sessionId: string | null
  currentColor: ColorName
  onColorChange: (color: ColorName) => void
  onSpeakingChange?: (isSpeaking: boolean) => void
  regionId?: string | null
  initialContext?: string
  isExtension?: boolean
  isGuest?: boolean
}

export function ChatContainer({ sessionId, currentColor, onColorChange, onSpeakingChange, regionId, initialContext, isExtension, isGuest = false }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSpokenIndexRef = useRef<number>(-1)
  const [isDuoModeEnabled, setIsDuoModeEnabled] = useState(false)

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
    regionId,
    isGuest
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
    await sendMessage(message, currentColor, {
      duoMode: isDuoModeEnabled,
      context: initialContext // Pass the current context (URL/Title)
    })
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
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {!isInitialized ? 'Loading...' : isLoading ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready'}
          </span>
          <DuoModeToggle isEnabled={isDuoModeEnabled} onToggle={setIsDuoModeEnabled} />
        </div>
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
                <ChatMessage
                  role="assistant"
                  content={entry.aiResponse}
                  color={entry.color}
                  timestamp={entry.timestamp}
                  onActionConfirm={async (actionId, action) => {
                    console.log('Action confirmed:', actionId, action)

                    let resultMessage = `[System Note] I have confirmed the action: ${action.title}`

                    try {
                      if (action.type === 'system_command') {
                        const result = await executeSystemCommand(action)
                        resultMessage += `\n\nExecution Result:\n${result}`
                      } else if (action.type === 'file_operation') {
                        const result = await executeFileOperation(action)
                        resultMessage += `\n\nOperation Result:\n${result}`
                      }
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
                      resultMessage += `\n\n❌ Error: ${errorMessage}`
                    }

                    await handleSend(resultMessage)
                  }}
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

// --- Execution Helpers ---

async function executeSystemCommand(action: any): Promise<string> {
  const response = await fetch('/api/code/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'bash',
      code: action.command,
      context: {
        workdir: action.workingDirectory
      }
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Execution failed')
  }

  if (data.exitCode === 0) {
    return `✅ Success\nOutput:\n${data.stdout || '(no output)'}`
  } else {
    return `⚠️ Failed (Exit Code: ${data.exitCode})\nStderr:\n${data.stderr}\nStdout:\n${data.stdout}`
  }
}

async function executeFileOperation(action: any): Promise<string> {
  const operationMap: Record<string, string> = {
    'create': 'write',
    'edit': 'write',
    'delete': 'delete',
    'list': 'list',
    'move': 'move', // Not directly supported by simple API yet, might fail
    'rename': 'move'
  }

  const apiOp = operationMap[action.operation]

  if (!apiOp) {
    return `⚠️ Operation '${action.operation}' is not fully supported yet.`
  }

  // Special handling for move/rename if not supported by API, or map to 'write' if it's a create
  // The current API supports: read, write, delete, list, create-dir

  if (['move', 'rename'].includes(apiOp)) {
    return `⚠️ Operation '${action.operation}' is not supported by the backend yet.`
  }

  const payload: any = {
    operation: apiOp,
    path: action.path
  }

  if (apiOp === 'write') {
    payload.content = action.content || ''
  }

  const response = await fetch('/api/code/file-ops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Operation failed')
  }

  if (data.success) {
    return `✅ Success: ${action.operation} on ${action.path}`
  } else {
    return `⚠️ Failed: ${data.error}`
  }
}
