/**
 * User Behavior Model
 * 
 * ML-inspired pattern recognition for user adaptation.
 * Uses exponential moving averages and weighted scoring to learn
 * user preferences from interaction signals over time.
 * 
 * Core algorithm: Exponential Moving Average (EMA)
 *   newWeight = (1 - learningRate) * oldWeight + learningRate * newSignal
 * 
 * This allows the model to:
 * - Adapt quickly to new users (high learning rate initially)
 * - Stabilize over time (learning rate decays with interactions)
 * - Always reflect recent behavior while retaining long-term patterns
 */

import type {
  InteractionSignal,
  InteractionCategory,
  UserAdaptiveModel,
  BehaviorWeights,
  TimeSlot,
  EngagementLevel,
} from './types'
import { DEFAULT_BEHAVIOR_WEIGHTS } from './types'

/** Minimum interactions before adaptation kicks in */
const MIN_INTERACTIONS_FOR_ADAPTATION = 3

/** Learning rate decay factor - how fast we stabilize */
const LEARNING_RATE_DECAY = 0.95

/** Initial learning rate for new users */
const INITIAL_LEARNING_RATE = 0.3

/** Minimum learning rate floor */
const MIN_LEARNING_RATE = 0.05

/**
 * Create a new adaptive model for a user
 */
export function createUserModel(userId: string): UserAdaptiveModel {
  return {
    userId,
    weights: { ...DEFAULT_BEHAVIOR_WEIGHTS },
    totalInteractions: 0,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    learningRate: INITIAL_LEARNING_RATE,
    version: 1,
  }
}

/**
 * Classify engagement level from message characteristics
 */
export function classifyEngagement(
  messageLength: number,
  hasQuestions: boolean,
  sharedPersonalInfo: boolean
): EngagementLevel {
  let score = 0

  // Message length scoring
  if (messageLength > 200) score += 3
  else if (messageLength > 100) score += 2
  else if (messageLength > 30) score += 1

  if (hasQuestions) score += 1
  if (sharedPersonalInfo) score += 2

  if (score >= 5) return 'deep'
  if (score >= 3) return 'high'
  if (score >= 1) return 'medium'
  return 'low'
}

/**
 * Determine time slot from a timestamp
 */
export function getTimeSlot(timestamp: string): TimeSlot {
  const hour = new Date(timestamp).getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Classify the interaction category from message content
 */
export function classifyInteractionCategory(message: string): InteractionCategory {
  const lower = message.toLowerCase()

  const categoryKeywords: Record<InteractionCategory, string[]> = {
    intimate: ['love', 'miss you', 'desire', 'passion', 'romantic', 'heart', 'feeling close'],
    emotional: ['feel', 'sad', 'happy', 'angry', 'scared', 'worried', 'anxious', 'stressed', 'grateful'],
    intellectual: ['think', 'analyze', 'explain', 'theory', 'research', 'philosophy', 'debate', 'logic'],
    creative: ['create', 'imagine', 'design', 'story', 'art', 'music', 'write', 'build', 'idea'],
    goal: ['goal', 'plan', 'achieve', 'improve', 'habit', 'progress', 'milestone', 'career', 'fitness'],
    casual: ['hey', 'what\'s up', 'how are', 'weather', 'food', 'weekend', 'funny', 'cool'],
  }

  let bestCategory: InteractionCategory = 'casual'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      bestCategory = category as InteractionCategory
    }
  }

  return bestCategory
}

/**
 * Exponential Moving Average update
 * Blends the new signal value with the existing weight
 */
function ema(currentWeight: number, newSignal: number, learningRate: number): number {
  return (1 - learningRate) * currentWeight + learningRate * newSignal
}

/**
 * Update the user model with a new interaction signal
 * This is the core learning function - called after each conversation turn
 */
export function updateUserModel(
  model: UserAdaptiveModel,
  signal: InteractionSignal
): UserAdaptiveModel {
  const newModel = { ...model }
  const weights = { ...model.weights }
  const lr = model.learningRate

  // Update category preferences
  const categoryPreferences = { ...weights.categoryPreferences }
  for (const category of Object.keys(categoryPreferences) as InteractionCategory[]) {
    const signalValue = category === signal.category ? 1.0 : 0.0
    categoryPreferences[category] = ema(categoryPreferences[category], signalValue, lr)
  }
  weights.categoryPreferences = categoryPreferences

  // Update color affinities
  const colorAffinities = { ...weights.colorAffinities }
  for (const color of Object.keys(colorAffinities)) {
    const signalValue = color === signal.color ? 1.0 : 0.0
    colorAffinities[color] = ema(colorAffinities[color] || 0, signalValue, lr)
  }
  weights.colorAffinities = colorAffinities

  // Update voice preference
  weights.voicePreference = ema(weights.voicePreference, signal.usedVoice ? 1.0 : 0.0, lr)

  // Update engagement depth
  const engagementMap: Record<EngagementLevel, number> = {
    low: 0.1,
    medium: 0.4,
    high: 0.7,
    deep: 1.0,
  }
  weights.engagementDepth = ema(
    weights.engagementDepth,
    engagementMap[signal.responseEngagement],
    lr
  )

  // Update average message length (simple moving average)
  weights.averageMessageLength = ema(
    weights.averageMessageLength,
    signal.messageLength,
    lr
  )

  // Update peak time slots
  const peakTimeSlots = { ...weights.peakTimeSlots }
  for (const slot of Object.keys(peakTimeSlots) as TimeSlot[]) {
    const signalValue = slot === signal.timeSlot ? 1.0 : 0.0
    peakTimeSlots[slot] = ema(peakTimeSlots[slot], signalValue, lr)
  }
  weights.peakTimeSlots = peakTimeSlots

  // Update adaptation score (increases over time)
  const newAdaptationScore = Math.min(
    1.0,
    weights.adaptationScore + (1 - weights.adaptationScore) * 0.05
  )
  weights.adaptationScore = newAdaptationScore

  // Decay learning rate
  newModel.learningRate = Math.max(
    MIN_LEARNING_RATE,
    model.learningRate * LEARNING_RATE_DECAY
  )

  newModel.weights = weights
  newModel.totalInteractions = model.totalInteractions + 1
  newModel.lastSeenAt = signal.timestamp

  return newModel
}

/**
 * Check if the model has enough data for meaningful adaptation
 */
export function isModelReady(model: UserAdaptiveModel): boolean {
  return model.totalInteractions >= MIN_INTERACTIONS_FOR_ADAPTATION
}

/**
 * Get the top N preferred categories for this user
 */
export function getTopCategories(
  weights: BehaviorWeights,
  n: number = 3
): InteractionCategory[] {
  return (Object.entries(weights.categoryPreferences) as [InteractionCategory, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([category]) => category)
}

/**
 * Get the user's preferred color (highest affinity)
 */
export function getPreferredColor(weights: BehaviorWeights): string {
  const entries = Object.entries(weights.colorAffinities)
  if (entries.length === 0) return 'ORANGE'
  return entries.reduce((best, [color, score]) =>
    score > best[1] ? [color, score] : best
  )[0]
}

/**
 * Get the user's peak activity time
 */
export function getPeakTimeSlot(weights: BehaviorWeights): TimeSlot {
  return (Object.entries(weights.peakTimeSlots) as [TimeSlot, number][])
    .reduce((best, [slot, score]) =>
      score > best[1] ? [slot, score] : best
    )[0] as TimeSlot
}
