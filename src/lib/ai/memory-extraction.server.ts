/**
 * Memory Extraction Module (SERVER-ONLY)
 * Extracts and saves user facts from conversations using AI
 *
 * This file should only be imported in server components/routes
 */

// Use Haiku 4.5 for cost-effective extraction
const EXTRACTION_MODEL = 'claude-haiku-4-5-20251001'

export interface ExtractedMemory {
  key: string
  value: string
  zone: 'green' | 'yellow' | 'red'
  confidence: number
}

const EXTRACTION_PROMPT = `Analyze this conversation and extract factual information about the user.
Return ONLY a JSON array of facts. If no new facts, return [].

Rules:
- Only extract explicitly stated or strongly implied facts
- Don't invent or assume facts not supported by the conversation
- Use consistent key naming (snake_case)
- Assign zone: "green" (general info), "yellow" (personal), "red" (sensitive)
- Only include facts with confidence >= 0.7

Categories to look for:
- Identity: name, age, gender, location, occupation
- Preferences: food, music, colors, hobbies, interests
- Dates: birthday, anniversary, important events
- Personality: communication style, personality traits, psychotype
- Relationships: family members, friends, pets
- Sensitive: health conditions, traumas (zone: "red")

Format (return ONLY valid JSON array, no markdown):
[
  { "key": "name", "value": "Alex", "zone": "green", "confidence": 0.95 },
  { "key": "birthday", "value": "March 15", "zone": "green", "confidence": 0.8 }
]

Conversation:
[USER]: {userMessage}
[CUBIQO]: {aiResponse}

Previous known facts about user:
{existingMemories}`

/**
 * Extract memories from a conversation turn
 */
export async function extractMemories(
  userMessage: string,
  aiResponse: string,
  existingMemories: Array<{ key: string; value: string }> = []
): Promise<ExtractedMemory[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('[MemoryExtraction] No API key available')
    return []
  }

  // Format existing memories for context
  const memoriesContext = existingMemories.length > 0
    ? existingMemories.map(m => `- ${m.key}: ${m.value}`).join('\n')
    : 'None yet'

  // Build the prompt
  const prompt = EXTRACTION_PROMPT
    .replace('{userMessage}', userMessage)
    .replace('{aiResponse}', aiResponse)
    .replace('{existingMemories}', memoriesContext)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[MemoryExtraction] API error:', error)
      return []
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || '[]'

    return parseExtractionResult(content)
  } catch (error) {
    console.error('[MemoryExtraction] Error:', error)
    return []
  }
}

/**
 * Parse extraction result from Claude
 */
function parseExtractionResult(content: string): ExtractedMemory[] {
  try {
    // Clean up potential markdown formatting
    let cleaned = content.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      return []
    }

    // Filter and validate
    return parsed.filter((item: unknown): item is ExtractedMemory => {
      if (typeof item !== 'object' || item === null) return false
      const mem = item as Record<string, unknown>
      return (
        typeof mem.key === 'string' &&
        typeof mem.value === 'string' &&
        mem.key.length > 0 &&
        mem.value.length > 0 &&
        (typeof mem.confidence !== 'number' || mem.confidence >= 0.7)
      )
    }).map(item => ({
      key: item.key,
      value: item.value,
      zone: (['green', 'yellow', 'red'].includes(item.zone) ? item.zone : 'green') as 'green' | 'yellow' | 'red',
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.8
    }))
  } catch (error) {
    console.error('[MemoryExtraction] Parse error:', error)
    return []
  }
}

/**
 * Build memory context section for system prompt
 */
export function buildMemoryContext(
  memories: Array<{ key: string; value: string; zone?: string }>
): string {
  if (!memories || memories.length === 0) {
    return ''
  }

  const memoryLines = memories.map(m => {
    const formattedKey = m.key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    return `- ${formattedKey}: ${m.value}`
  })

  return `

WHAT YOU KNOW ABOUT THIS PERSON:
${memoryLines.join('\n')}

Use this information naturally to personalize your responses:
- Address them by name if you know it
- Reference their interests, preferences when relevant
- Remember and acknowledge important dates
- Adapt your style to their personality
Don't explicitly announce what you know - just use it naturally in conversation.`
}
