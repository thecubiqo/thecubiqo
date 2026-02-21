import { ENV } from '@/lib/config/env'

// Use Haiku for cost-effective extraction
const EXTRACTION_MODEL = 'claude-3-5-haiku-20241022'

export interface ProfileField {
  field: string
  value: string
  confidence: number
  source: 'conversation' | 'inferred'
}

export interface ProfileExtractionResult {
  fields: ProfileField[]
  hasUpdates: boolean
}

/**
 * Profile fields that can be extracted from conversation
 */
export const EXTRACTABLE_PROFILE_FIELDS = [
  'display_name',
  'occupation',
  'location',
  'timezone',
  'interests',
  'bio',
  'preferred_language',
  'communication_style',
] as const

export type ExtractableField = typeof EXTRACTABLE_PROFILE_FIELDS[number]

const PROFILE_EXTRACTION_PROMPT = `You are a profile extraction agent for CubiQo, an AI companion.
Analyze this conversation and extract any profile-relevant information the user has shared.

Return ONLY a JSON array of profile fields. If no profile-relevant info found, return [].

Rules:
- Only extract explicitly stated or strongly implied information
- Don't invent or assume facts not supported by the conversation
- Assign confidence >= 0.7 only for clearly stated facts
- Mark source as "conversation" for directly stated facts, "inferred" for implied ones

Extractable fields:
- display_name: The user's preferred name or nickname
- occupation: Their job, role, or profession
- location: City, country, or region they live in
- timezone: Their timezone (infer from location if mentioned)
- interests: Comma-separated list of hobbies/interests mentioned
- bio: A brief bio based on what they've shared (max 100 chars)
- preferred_language: Language they prefer to communicate in
- communication_style: How they prefer to interact (casual, formal, etc.)

Format (return ONLY valid JSON array, no markdown):
[
  { "field": "display_name", "value": "Alex", "confidence": 0.95, "source": "conversation" },
  { "field": "interests", "value": "music, coding, hiking", "confidence": 0.8, "source": "conversation" }
]

Conversation:
[USER]: {userMessage}
[CUBIQO]: {aiResponse}

Previously known profile data:
{existingProfile}`

/**
 * Extract profile fields from a conversation turn
 */
export async function extractProfileFields(
  userMessage: string,
  aiResponse: string,
  existingProfile: Record<string, string> = {},
  apiKey?: string
): Promise<ProfileExtractionResult> {
  const key = apiKey || ENV.ai.anthropic

  if (!key) {
    console.error('[Autopilot] No API key available for profile extraction')
    return { fields: [], hasUpdates: false }
  }

  const profileContext = Object.keys(existingProfile).length > 0
    ? Object.entries(existingProfile).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : 'None yet'

  const prompt = PROFILE_EXTRACTION_PROMPT
    .replace('{userMessage}', userMessage)
    .replace('{aiResponse}', aiResponse)
    .replace('{existingProfile}', profileContext)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        max_tokens: 512,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Autopilot] Profile extraction API error:', error)
      return { fields: [], hasUpdates: false }
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || '[]'

    return parseProfileResult(content)
  } catch (error) {
    console.error('[Autopilot] Profile extraction error:', error)
    return { fields: [], hasUpdates: false }
  }
}

/**
 * Parse profile extraction result from Claude
 */
function parseProfileResult(content: string): ProfileExtractionResult {
  try {
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
      return { fields: [], hasUpdates: false }
    }

    const validFields = parsed.filter((item: unknown): item is ProfileField => {
      if (typeof item !== 'object' || item === null) return false
      const field = item as Record<string, unknown>
      return (
        typeof field.field === 'string' &&
        typeof field.value === 'string' &&
        field.field.length > 0 &&
        field.value.length > 0 &&
        EXTRACTABLE_PROFILE_FIELDS.includes(field.field as ExtractableField) &&
        (typeof field.confidence !== 'number' || field.confidence >= 0.7)
      )
    }).map(item => ({
      field: item.field,
      value: item.value,
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.8,
      source: (item.source === 'inferred' ? 'inferred' : 'conversation') as 'conversation' | 'inferred'
    }))

    return {
      fields: validFields,
      hasUpdates: validFields.length > 0
    }
  } catch (error) {
    console.error('[Autopilot] Profile parse error:', error)
    return { fields: [], hasUpdates: false }
  }
}
