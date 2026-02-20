/**
 * Adaptive Learning Tests
 * 
 * Validates the ML-inspired user adaptation system:
 * - User model creation and updates
 * - Interaction classification
 * - Behavior weight learning via EMA
 * - Adaptation engine recommendations
 */

import { describe, it, expect } from 'vitest'
import {
  createUserModel,
  updateUserModel,
  classifyEngagement,
  classifyInteractionCategory,
  getTimeSlot,
  isModelReady,
  getTopCategories,
  getPreferredColor,
  getPeakTimeSlot,
} from '@/lib/adaptive-learning/user-model'
import {
  generateAdaptation,
  buildAdaptiveContext,
} from '@/lib/adaptive-learning/adaptation-engine'
import { DEFAULT_BEHAVIOR_WEIGHTS } from '@/lib/adaptive-learning/types'
import type { InteractionSignal } from '@/lib/adaptive-learning/types'

describe('User Model', () => {
  it('should create a new model with default weights', () => {
    const model = createUserModel('test-user')
    expect(model.userId).toBe('test-user')
    expect(model.totalInteractions).toBe(0)
    expect(model.learningRate).toBe(0.3)
    expect(model.version).toBe(1)
    expect(model.weights.voicePreference).toBe(0.5)
  })

  it('should classify engagement levels correctly', () => {
    expect(classifyEngagement(10, false, false)).toBe('low')
    expect(classifyEngagement(50, true, false)).toBe('medium')
    expect(classifyEngagement(150, true, false)).toBe('high')
    expect(classifyEngagement(250, true, true)).toBe('deep')
  })

  it('should classify time slots correctly', () => {
    expect(getTimeSlot('2025-01-01T08:00:00Z')).toBe('morning')
    expect(getTimeSlot('2025-01-01T14:00:00Z')).toBe('afternoon')
    expect(getTimeSlot('2025-01-01T19:00:00Z')).toBe('evening')
    expect(getTimeSlot('2025-01-01T23:00:00Z')).toBe('night')
  })

  it('should classify interaction categories from message content', () => {
    expect(classifyInteractionCategory('I feel so happy today')).toBe('emotional')
    expect(classifyInteractionCategory('Can you analyze this theory?')).toBe('intellectual')
    expect(classifyInteractionCategory('Let me create a new design')).toBe('creative')
    expect(classifyInteractionCategory('I want to achieve my fitness goal')).toBe('goal')
    expect(classifyInteractionCategory('hey what\'s up')).toBe('casual')
  })

  it('should update model with interaction signal using EMA', () => {
    const model = createUserModel('test-user')
    const signal: InteractionSignal = {
      category: 'emotional',
      color: 'RED',
      messageLength: 100,
      responseEngagement: 'high',
      timestamp: '2025-01-01T20:00:00Z',
      timeSlot: 'evening',
      usedVoice: true,
    }

    const updated = updateUserModel(model, signal)

    expect(updated.totalInteractions).toBe(1)
    expect(updated.weights.categoryPreferences.emotional).toBeGreaterThan(
      model.weights.categoryPreferences.emotional
    )
    expect(updated.weights.colorAffinities.RED).toBeGreaterThan(
      model.weights.colorAffinities.RED
    )
    expect(updated.weights.voicePreference).toBeGreaterThan(model.weights.voicePreference)
    expect(updated.learningRate).toBeLessThan(model.learningRate)
    expect(updated.weights.adaptationScore).toBeGreaterThan(0)
  })

  it('should decay learning rate with each interaction', () => {
    let model = createUserModel('test-user')
    const initialLR = model.learningRate

    const signal: InteractionSignal = {
      category: 'casual',
      color: 'YELLOW',
      messageLength: 30,
      responseEngagement: 'medium',
      timestamp: '2025-01-01T12:00:00Z',
      timeSlot: 'afternoon',
      usedVoice: false,
    }

    for (let i = 0; i < 10; i++) {
      model = updateUserModel(model, signal)
    }

    expect(model.learningRate).toBeLessThan(initialLR)
    expect(model.learningRate).toBeGreaterThan(0.05) // Should not go below MIN_LEARNING_RATE
  })

  it('should not be ready before minimum interactions', () => {
    const model = createUserModel('test-user')
    expect(isModelReady(model)).toBe(false)
  })

  it('should be ready after minimum interactions', () => {
    let model = createUserModel('test-user')
    const signal: InteractionSignal = {
      category: 'casual',
      color: 'YELLOW',
      messageLength: 30,
      responseEngagement: 'medium',
      timestamp: '2025-01-01T12:00:00Z',
      timeSlot: 'afternoon',
      usedVoice: false,
    }

    for (let i = 0; i < 3; i++) {
      model = updateUserModel(model, signal)
    }

    expect(isModelReady(model)).toBe(true)
  })

  it('should return top categories sorted by weight', () => {
    const weights = { ...DEFAULT_BEHAVIOR_WEIGHTS }
    weights.categoryPreferences = {
      casual: 0.1,
      emotional: 0.9,
      intellectual: 0.7,
      creative: 0.3,
      goal: 0.5,
      intimate: 0.2,
    }

    const top = getTopCategories(weights, 3)
    expect(top[0]).toBe('emotional')
    expect(top[1]).toBe('intellectual')
    expect(top[2]).toBe('goal')
  })

  it('should return preferred color from weights', () => {
    const weights = { ...DEFAULT_BEHAVIOR_WEIGHTS }
    weights.colorAffinities = {
      RED: 0.8,
      YELLOW: 0.2,
      GREEN_BLUE: 0.1,
      ORANGE: 0.3,
    }

    expect(getPreferredColor(weights)).toBe('RED')
  })

  it('should return peak time slot', () => {
    const weights = { ...DEFAULT_BEHAVIOR_WEIGHTS }
    weights.peakTimeSlots = {
      morning: 0.1,
      afternoon: 0.2,
      evening: 0.8,
      night: 0.3,
    }

    expect(getPeakTimeSlot(weights)).toBe('evening')
  })
})

describe('Adaptation Engine', () => {
  it('should return default recommendations for new users', () => {
    const model = createUserModel('new-user')
    const recommendation = generateAdaptation(model)

    expect(recommendation.promptModifiers).toHaveLength(0)
    expect(recommendation.suggestedColor).toBeNull()
    expect(recommendation.voiceEncouragement).toBe(true)
    expect(recommendation.conversationStyle).toBe('moderate')
    expect(recommendation.engagementStrategy).toBe('nurturing')
  })

  it('should generate personalized recommendations for mature models', () => {
    let model = createUserModel('mature-user')

    // Simulate many emotional, deep interactions at night with voice
    const signal: InteractionSignal = {
      category: 'emotional',
      color: 'RED',
      messageLength: 200,
      responseEngagement: 'deep',
      timestamp: '2025-01-01T23:00:00Z',
      timeSlot: 'night',
      usedVoice: true,
    }

    for (let i = 0; i < 10; i++) {
      model = updateUserModel(model, signal)
    }

    const recommendation = generateAdaptation(model)

    expect(recommendation.promptModifiers.length).toBeGreaterThan(0)
    expect(recommendation.suggestedColor).toBe('RED')
    expect(recommendation.conversationStyle).toBe('elaborate')
    expect(recommendation.engagementStrategy).toBe('nurturing')
  })

  it('should build adaptive context string for system prompt', () => {
    let model = createUserModel('test-user')

    // Simulate interactions to build up the model
    for (let i = 0; i < 5; i++) {
      model = updateUserModel(model, {
        category: 'intellectual',
        color: 'GREEN_BLUE',
        messageLength: 150,
        responseEngagement: 'high',
        timestamp: '2025-01-01T10:00:00Z',
        timeSlot: 'morning',
        usedVoice: false,
      })
    }

    const context = buildAdaptiveContext(model)

    expect(context).toContain('ADAPTIVE PERSONALIZATION')
    expect(context).toContain('intellectual')
  })

  it('should return empty context for new users', () => {
    const model = createUserModel('new-user')
    const context = buildAdaptiveContext(model)
    expect(context).toBe('')
  })
})
