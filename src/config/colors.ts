/**
 * Cubiqo Color System
 *
 * Each color represents an emotional dimension aligned with the philosophy of the Fourth Way.
 * The cube's color reflects the emotional context of the conversation.
 */

export type ColorName = 'RED' | 'YELLOW' | 'GREEN_BLUE' | 'ORANGE'

export type BlinkStyle = 'double' | 'rhythmic' | 'steady' | 'slow'

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
  blinkStyle: BlinkStyle
  blinkSpeed: number
  mouseFollowSpeed: number
}

export const COLORS: Record<ColorName, ColorConfig> = {
  RED: {
    name: 'RED',
    displayName: 'Tamas',
    hex: 0xC2185B,
    emissive: 0x8B0A3D,
    emotion: 'desire, indulgence, rebellion',
    tone: 'seductive, slow, impulsive',
    voiceTone: 'deep, slow, sensual whisper; confident teasing',
    description: 'Tamas - The force of desire and material attachment',
    animationSpeed: 0.2,
    glowIntensity: 0.9,
    breathingSpeed: 1.0,
    blinkStyle: 'double',
    blinkSpeed: 0.3,
    mouseFollowSpeed: 0.15
  },

  YELLOW: {
    name: 'YELLOW',
    displayName: 'Rajas',
    hex: 0xFFA000,
    emissive: 0xE68A00,
    emotion: 'activity, energy, curiosity',
    tone: 'warm, conversational, energetic',
    voiceTone: 'warm, relaxed, friendly pace',
    description: 'Rajas - The energy of action and daily life',
    animationSpeed: 0.5,
    glowIntensity: 0.7,
    breathingSpeed: 1.5,
    blinkStyle: 'rhythmic',
    blinkSpeed: 0.15,
    mouseFollowSpeed: 0.10
  },

  GREEN_BLUE: {
    name: 'GREEN_BLUE',
    displayName: 'Sattva',
    hex: 0x00897B,
    emissive: 0x005A52,
    emotion: 'growth, wellness, ambition',
    tone: 'purposeful, clear, inspired',
    voiceTone: 'clear, motivating, balanced',
    description: 'Sattva - The quality of harmony and growth',
    animationSpeed: 0.4,
    glowIntensity: 0.6,
    breathingSpeed: 1.4,
    blinkStyle: 'steady',
    blinkSpeed: 0.15,
    mouseFollowSpeed: 0.12
  },

  ORANGE: {
    name: 'ORANGE',
    displayName: 'Fourth Way',
    hex: 0xFF6F00,
    emissive: 0xCC5900,
    emotion: 'stillness, awareness, reflection',
    tone: 'philosophical, calm, grounding',
    voiceTone: 'gentle, resonant, meditative',
    description: 'The Fourth Way - Conscious presence beyond the three forces',
    animationSpeed: 0.15,
    glowIntensity: 0.5,
    breathingSpeed: 0.8,
    blinkStyle: 'slow',
    blinkSpeed: 0.25,
    mouseFollowSpeed: 0.05
  }
}

/**
 * Get color configuration by name
 */
export function getColor(colorName: ColorName): ColorConfig {
  return COLORS[colorName] || COLORS.ORANGE
}

/**
 * Get all available color names
 */
export function getColorNames(): ColorName[] {
  return Object.keys(COLORS) as ColorName[]
}

/**
 * Check if a string is a valid color name
 */
export function isValidColor(name: string): name is ColorName {
  return name in COLORS
}
