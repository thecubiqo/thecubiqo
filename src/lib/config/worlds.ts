/**
 * World Configuration System
 *
 * Unified config system for both product worlds (Headlines, Vocspad)
 * and regional worlds (UK, India). Replaces the old regions.ts.
 */

// === TYPES ===

export type WorldType = 'region' | 'product'

export interface WorldConfig {
  // === CORE ===
  id: string                    // 'uk', 'headlines', 'vocspad'
  type: WorldType               // 'region' or 'product'
  name: string                  // "United Kingdom", "Headlines Cube"
  description: string           // Description for UI and team

  // === ROUTING ===
  routing: {
    path: string                // '/uk', '/headlines'
    domain: string | null       // 'headlines.ai' (optional)
    geoTrigger?: string         // ISO country code for geo-routing ('GB')
  }

  // === APPEARANCE ===
  appearance: {
    defaultColor: 'ORANGE' | 'RED' | 'YELLOW' | 'GREEN_BLUE'
    theme: 'dark' | 'light' | 'system'
    cubeVariant?: string        // 'default', 'headlines', 'vocspad'
  }

  // === FEATURES ===
  features: {
    voice: boolean
    chat: boolean
    memory: boolean
    auth: boolean
    keyboard?: boolean          // For Vocspad
    debate?: boolean            // For Headlines
  }

  // === AI ===
  ai: {
    systemPrompt: string        // Full system prompt for world
    toneModifiers: string[]     // ['polite', 'debate', 'concise']
    voiceProfiles?: Array<{     // For Headlines (Hari/Ingle)
      id: string
      name: string
      gender: 'male' | 'female'
      tone: string
    }>
  }

  // === REGIONAL (only for type: 'region') ===
  regional?: {
    countryCode: string         // 'GB', 'IN'
    locale: string              // 'en-GB', 'hi-IN'
    timezone: string            // 'Europe/London'
    currency: string            // 'GBP'
    dialects: string[]          // ['British English']
    festivals: Array<{
      name: string
      date: string              // 'MM-DD' or 'variable'
      type: 'national' | 'religious' | 'cultural'
    }>
    greetings: {
      morning: string
      afternoon: string
      evening: string
    }
  }
}

// === REGISTRY ===

// All registered worlds - add new worlds here
const VALID_WORLDS = ['uk', 'headlines', 'vocspad'] as const
type ValidWorld = typeof VALID_WORLDS[number]

// === CACHE ===

const configCache = new Map<string, { config: WorldConfig; timestamp: number }>()
const CACHE_TTL = 3600 * 1000 // 1 hour

// === PUBLIC API ===

/**
 * Get all registered world IDs
 */
export function getAllWorlds(): string[] {
  return [...VALID_WORLDS]
}

/**
 * Get only product world IDs (not regional)
 * Used for [world] route to avoid conflict with [region]
 */
export function getProductWorlds(): string[] {
  // Return only product worlds - regions are handled by [region] route
  return ['headlines', 'vocspad']
}

/**
 * Check if a world ID is valid
 */
export function isValidWorld(id: string): id is ValidWorld {
  return VALID_WORLDS.includes(id as ValidWorld)
}

/**
 * Load a world config by ID
 */
export async function getWorldConfig(worldId: string): Promise<WorldConfig | null> {
  if (!isValidWorld(worldId)) return null

  // Check cache
  const cached = configCache.get(worldId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }

  try {
    const config = await import(`../../../generator/config/worlds/${worldId}.json`)
    const worldConfig = config.default as WorldConfig
    configCache.set(worldId, { config: worldConfig, timestamp: Date.now() })
    return worldConfig
  } catch (e) {
    console.warn(`World config not found: ${worldId}`, e)
    return null
  }
}

/**
 * Find world by geo trigger (country code)
 * Used for geo-routing in middleware
 */
export async function getWorldByGeoTrigger(countryCode: string): Promise<WorldConfig | null> {
  for (const worldId of VALID_WORLDS) {
    const config = await getWorldConfig(worldId)
    if (config?.routing.geoTrigger === countryCode) {
      return config
    }
  }
  return null
}

/**
 * Build AI system prompt for a world
 */
export function buildWorldPrompt(config: WorldConfig): string {
  const parts: string[] = [config.ai.systemPrompt]

  // Tone modifiers
  if (config.ai.toneModifiers.length > 0) {
    parts.push(`\nTone: ${config.ai.toneModifiers.join(', ')}`)
  }

  // Regional context (only for type: 'region')
  if (config.type === 'region' && config.regional) {
    parts.push(`\nUser is from ${config.name} (${config.regional.countryCode}).`)
    parts.push(`Timezone: ${config.regional.timezone}`)
    if (config.regional.dialects.length > 0) {
      parts.push(`Use ${config.regional.dialects[0]} dialect and spelling.`)
    }

    // Upcoming festivals
    const upcoming = getUpcomingFestivals(config.regional.festivals)
    if (upcoming.length > 0) {
      parts.push(`Upcoming events: ${upcoming.join(', ')}`)
    }
  }

  // Voice profiles (for Headlines)
  if (config.ai.voiceProfiles && config.ai.voiceProfiles.length > 0) {
    const profiles = config.ai.voiceProfiles
      .map(p => `${p.name} (${p.gender}, ${p.tone})`)
      .join(', ')
    parts.push(`\nVoice personas: ${profiles}`)
  }

  return parts.join('\n')
}

/**
 * Get appropriate greeting based on time of day (for regional worlds)
 */
export function getGreeting(config: WorldConfig): string {
  if (!config.regional?.greetings) {
    return 'Hello'
  }

  const hour = new Date().getHours()
  if (hour < 12) {
    return config.regional.greetings.morning
  } else if (hour < 17) {
    return config.regional.greetings.afternoon
  } else {
    return config.regional.greetings.evening
  }
}

// === HELPERS ===

/**
 * Get festivals happening in the next 30 days
 */
function getUpcomingFestivals(
  festivals: NonNullable<WorldConfig['regional']>['festivals']
): string[] {
  const now = new Date()
  const upcoming: string[] = []

  for (const festival of festivals) {
    if (festival.date === 'variable') continue
    if (festival.date.includes('-')) {
      const [month, day] = festival.date.split('-').map(Number)
      const festivalDate = new Date(now.getFullYear(), month - 1, day)

      // Check if within next 30 days
      const diffDays = (festivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays >= 0 && diffDays <= 30) {
        upcoming.push(`${festival.name} (${festival.date})`)
      }
    }
  }

  return upcoming
}

// === BACKWARD COMPATIBILITY ===

// Re-export as RegionConfig for legacy code
export type RegionConfig = WorldConfig

// Legacy function names
export const getRegionConfig = getWorldConfig
export const buildRegionalPrompt = buildWorldPrompt
