/**
 * AI Service
 * Message building, response parsing, temporal context
 */

import type { ColorName } from '@/config/colors'
import { COLORS } from '@/config/colors'
import type { ChatMessage, ConversationEntry, AIResponse } from './types'

/**
 * Format timestamp as full date/time (for first message in history)
 * Example: "Monday, Oct 22, 2025 09:30 AM"
 */
export function formatFullTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}

/**
 * Format timestamp as relative time (for recent messages)
 * Example: "5h ago", "2d ago", "Just now"
 */
export function formatTimeAgo(timestamp: string): string {
  const now = Date.now()
  const past = new Date(timestamp).getTime()
  const deltaMs = now - past

  const seconds = Math.floor(deltaMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Build messages array for API request with temporal context
 */
export function buildMessages(
  currentMessage: string,
  history: ConversationEntry[],
  currentColor: ColorName
): ChatMessage[] {
  const messages: ChatMessage[] = []

  // Add conversation history (last 10 messages for context)
  history.slice(-10).forEach((entry, index) => {
    // First message gets FULL timestamp (for season/day context)
    // Other messages get RELATIVE timestamp
    const timePrefix = index === 0
      ? `[${formatFullTimestamp(entry.timestamp)}]`
      : `[${formatTimeAgo(entry.timestamp)}]`

    messages.push({
      role: 'user',
      content: `${timePrefix} ${entry.userMessage}`
    })
    messages.push({
      role: 'assistant',
      content: JSON.stringify({
        color: entry.color,
        response: entry.aiResponse
      })
    })
  })

  // Add current message with FULL timestamp (so AI knows the current date/time)
  const currentTimestamp = formatFullTimestamp(new Date().toISOString())
  const currentContent = `[${currentTimestamp}] Current color: ${currentColor}\n\nUser message: ${currentMessage}`

  messages.push({
    role: 'user',
    content: currentContent
  })

  return messages
}

/**
 * Get valid color names
 */
function getColorNames(): ColorName[] {
  return Object.keys(COLORS) as ColorName[]
}

/**
 * Parse AI response (expects JSON with color and response)
 */
export function parseResponse(content: string): AIResponse {
  try {
    // Remove markdown code blocks if present (```json ... ```)
    let cleanContent = content.trim()

    // Check if wrapped in markdown code block
    if (cleanContent.startsWith('```')) {
      // Extract content between ``` markers
      const match = cleanContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (match) {
        cleanContent = match[1].trim()
      }
    }

    // Try to parse as JSON
    const parsed = JSON.parse(cleanContent)

    // Validate color
    const validColors = getColorNames()
    if (!validColors.includes(parsed.color)) {
      console.warn(`Invalid color "${parsed.color}", defaulting to ORANGE`)
      parsed.color = 'ORANGE'
    }

    return {
      color: parsed.color as ColorName,
      response: parsed.response
    }
  } catch (error) {
    // Fallback if response is not valid JSON
    console.error('Failed to parse AI response:', error)
    console.error('Raw content:', content)
    return {
      color: 'ORANGE',
      response: content // Use raw response
    }
  }
}
