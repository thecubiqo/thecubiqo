/**
 * Adaptation Engine
 * 
 * Generates personalized recommendations based on the user's adaptive model.
 * Uses the learned behavior weights to modify:
 * - System prompt personality and style
 * - Voice settings and encouragement
 * - Conversation depth and approach
 * - Color/mood suggestions
 * 
 * The engine acts as the "inference" step after the user model "training".
 */

import type {
  UserAdaptiveModel,
  BehaviorWeights,
  AdaptationRecommendation,
} from './types'
import {
  isModelReady,
  getTopCategories,
  getPreferredColor,
  getPeakTimeSlot,
} from './user-model'

/**
 * Generate adaptation recommendations based on user model
 * This is the core inference function that translates learned weights
 * into actionable personalization.
 */
export function generateAdaptation(
  model: UserAdaptiveModel
): AdaptationRecommendation {
  // Default recommendation for new users
  if (!isModelReady(model)) {
    return {
      promptModifiers: [],
      suggestedColor: null,
      voiceEncouragement: true,  // Always encourage voice for new users
      conversationStyle: 'moderate',
      engagementStrategy: 'nurturing',
    }
  }

  const weights = model.weights
  const promptModifiers: string[] = []

  // Determine conversation style from engagement depth
  const conversationStyle = getConversationStyle(weights)

  // Determine engagement strategy from behavioral patterns
  const engagementStrategy = getEngagementStrategy(weights)

  // Voice encouragement based on voice preference score
  const voiceEncouragement = weights.voicePreference < 0.6

  // Suggest color based on learned affinity
  const suggestedColor = getPreferredColor(weights)

  // Build adaptive prompt modifiers
  promptModifiers.push(...buildPromptModifiers(weights, model))

  return {
    promptModifiers,
    suggestedColor,
    voiceEncouragement,
    conversationStyle,
    engagementStrategy,
  }
}

/**
 * Determine conversation style from engagement depth
 */
function getConversationStyle(
  weights: BehaviorWeights
): 'brief' | 'moderate' | 'elaborate' {
  if (weights.engagementDepth > 0.7) return 'elaborate'
  if (weights.engagementDepth > 0.4) return 'moderate'
  return 'brief'
}

/**
 * Determine engagement strategy from behavior patterns
 */
function getEngagementStrategy(
  weights: BehaviorWeights
): 'nurturing' | 'challenging' | 'supportive' | 'playful' {
  const topCategories = getTopCategories(weights, 2)
  const primary = topCategories[0]

  if (primary === 'emotional' || primary === 'intimate') return 'nurturing'
  if (primary === 'intellectual') return 'challenging'
  if (primary === 'goal') return 'supportive'
  return 'playful'
}

/**
 * Build system prompt modifiers based on learned user patterns
 */
function buildPromptModifiers(
  weights: BehaviorWeights,
  model: UserAdaptiveModel
): string[] {
  const modifiers: string[] = []
  const topCategories = getTopCategories(weights, 3)

  // Conversation depth adaptation
  if (weights.engagementDepth > 0.7) {
    modifiers.push(
      'This person values deep, thoughtful conversations. Take your time with responses and explore topics fully.'
    )
  } else if (weights.engagementDepth < 0.3) {
    modifiers.push(
      'This person prefers quick, concise exchanges. Keep responses short and punchy.'
    )
  }

  // Category-specific adaptations
  if (topCategories.includes('emotional')) {
    modifiers.push(
      'This person often shares emotions. Be especially empathetic and validating.'
    )
  }
  if (topCategories.includes('intellectual')) {
    modifiers.push(
      'This person enjoys intellectual depth. Offer thoughtful analysis and nuanced perspectives.'
    )
  }
  if (topCategories.includes('creative')) {
    modifiers.push(
      'This person is creative. Use vivid language and encourage imaginative thinking.'
    )
  }
  if (topCategories.includes('goal')) {
    modifiers.push(
      'This person is goal-oriented. Help them track progress and celebrate milestones.'
    )
  }

  // Time-aware adaptation
  const peakSlot = getPeakTimeSlot(weights)
  if (peakSlot === 'night') {
    modifiers.push(
      'This person often chats at night. Be warm and calming during late-night conversations.'
    )
  } else if (peakSlot === 'morning') {
    modifiers.push(
      'This person is a morning person. Bring positive energy to start their day.'
    )
  }

  // Voice preference signaling
  if (weights.voicePreference > 0.7) {
    modifiers.push(
      'This person loves voice conversations. Your responses are optimized for being spoken aloud. Use natural speech patterns.'
    )
  }

  // Returning user warmth
  if (model.totalInteractions > 20) {
    modifiers.push(
      'You have a strong connection with this person. They keep coming back. Show you value their presence.'
    )
  } else if (model.totalInteractions > 10) {
    modifiers.push(
      'You are building a meaningful connection with this person. Reference past conversations naturally.'
    )
  }

  return modifiers
}

/**
 * Build the adaptive context section to append to the system prompt
 */
export function buildAdaptiveContext(
  model: UserAdaptiveModel
): string {
  const recommendation = generateAdaptation(model)

  if (recommendation.promptModifiers.length === 0) {
    return ''
  }

  let context = '\n\nADAPTIVE PERSONALIZATION (learned from past interactions):\n'
  for (const modifier of recommendation.promptModifiers) {
    context += `- ${modifier}\n`
  }

  // Add voice encouragement hint
  if (recommendation.voiceEncouragement) {
    context += '- Gently encourage this person to try voice conversation if they haven\'t been using it. Voice creates a deeper connection.\n'
  }

  // Add conversation style guidance
  const styleGuide: Record<string, string> = {
    brief: 'Keep responses concise - under 40 words when possible.',
    moderate: 'Balance depth with brevity - aim for 40-80 words.',
    elaborate: 'Feel free to explore topics in depth - up to 100 words when the moment calls for it.',
  }
  context += `- Response style: ${styleGuide[recommendation.conversationStyle]}\n`

  return context
}
