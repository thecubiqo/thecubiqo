/**
 * CubiQo Color System
 * Each color represents an emotional dimension aligned with the Fourth Way philosophy
 */

export type ColorName = 'RED' | 'YELLOW' | 'TEAL' | 'ORANGE'

export interface ColorConfig {
  name: ColorName
  displayName: string
  hex: number
  emissive: number
  emotion: string
  tone: string
  voiceTone: string
  description: string
  animationSpeed: number
  glowIntensity: number
  breathingSpeed: number
  blinkStyle: 'double' | 'rhythmic' | 'steady' | 'slow'
  blinkSpeed: number
  mouseFollowSpeed: number
}

export const COLORS: Record<ColorName, ColorConfig> = {
  RED: {
    name: 'RED',
    displayName: 'Explicit',
    hex: 0xc2185b,
    emissive: 0x8b0a3d,
    emotion: 'age-gated, critical, goal-oriented',
    tone: 'discreet, low-volume',
    voiceTone: 'deep, slow, sensual whisper; discreet',
    description: 'RED - Age-gated or explicit critical tasks',
    animationSpeed: 0.2,
    glowIntensity: 0.9,
    breathingSpeed: 1.0,
    blinkStyle: 'double',
    blinkSpeed: 0.3,
    mouseFollowSpeed: 0.15,
  },

  YELLOW: {
    name: 'YELLOW',
    displayName: 'Casual',
    hex: 0xffa000,
    emissive: 0xe68a00,
    emotion: 'casual, general, curious',
    tone: 'friendly, relaxed, non-leading',
    voiceTone: 'warm, relaxed, friendly pace',
    description: 'YELLOW - Casual conversation and general chat',
    animationSpeed: 0.5,
    glowIntensity: 0.7,
    breathingSpeed: 1.5,
    blinkStyle: 'rhythmic',
    blinkSpeed: 0.15,
    mouseFollowSpeed: 0.1,
  },

  TEAL: {
    name: 'TEAL',
    displayName: 'Goal',
    hex: 0x00897b,
    emissive: 0x005a52,
    emotion: 'ambition, growth, professionalism',
    tone: 'professional, decisive, goal-oriented',
    voiceTone: 'clear, motivating, balanced',
    description: 'TEAL - Goal-oriented help and growth',
    animationSpeed: 0.4,
    glowIntensity: 0.6,
    breathingSpeed: 1.4,
    blinkStyle: 'steady',
    blinkSpeed: 0.15,
    mouseFollowSpeed: 0.12,
  },

  ORANGE: {
    name: 'ORANGE',
    displayName: 'Fourth Way',
    hex: 0xff6f00,
    emissive: 0xcc5900,
    emotion: 'stillness, awareness, reflection',
    tone: 'philosophical, calm, grounding',
    voiceTone: 'gentle, resonant, meditative',
    description: 'The Fourth Way - Conscious presence beyond the three forces',
    animationSpeed: 0.15,
    glowIntensity: 0.5,
    breathingSpeed: 0.8,
    blinkStyle: 'slow',
    blinkSpeed: 0.25,
    mouseFollowSpeed: 0.05,
  },
}

export function getColor(colorName: ColorName): ColorConfig {
  return COLORS[colorName] || COLORS.ORANGE
}

export function getColorNames(): ColorName[] {
  return Object.keys(COLORS) as ColorName[]
}
