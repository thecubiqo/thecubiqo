/**
 * Region Configuration System
 *
 * Loads and manages regional configs for multi-domain support.
 * Supports both static JSON files and database-backed configs.
 */

import { getRegionByRegionId } from "@/app/api/services/route"
import { get } from "http"

export interface RegionConfig {
  id: string
  countryCode: string
  name: string
  locale: string

  routing: {
    path: string
    domain: string | null
    defaultRoute: 'main' | 'regional'
    mainEnabled: boolean
    regionalEnabled: boolean
  }

  localization: {
    timezone: string
    currency: string
    dateFormat: string
    dialects: string[]
  }

  cultural: {
    festivals: Array<{
      name: string
      date: string
      type: 'national' | 'religious' | 'cultural'
    }>
    greetings: {
      morning: string
      afternoon: string
      evening: string
    }
    references: string[]
  }

  appearance: {
    defaultColor: 'ORANGE' | 'RED' | 'YELLOW' | 'GREEN_BLUE'
    performanceMode: 'full' | 'reduced'
    theme: 'dark' | 'light' | 'system'
  }

  features: {
    voice: boolean
    chat: boolean
    memory: boolean
    auth: boolean
  }

  ai: {
    systemPromptAdditions: string
    toneModifiers: string[]
  }
}

// Static region configs (loaded at build time)
const staticConfigs: Record<string, RegionConfig> = {}

// Runtime cache for database-backed configs
const configCache = new Map<string, { config: RegionConfig; timestamp: number }>()
const CACHE_TTL = 3600 * 1000 // 1 hour

/**
 * Load a region config by ID (e.g., 'uk', 'in')
 */
export async function getRegionConfig(regionId: string): Promise<RegionConfig | null> {
  // Check static configs first
  if (staticConfigs[regionId]) {
    return staticConfigs[regionId]
  }

  // Check cache
  const cached = configCache.get(regionId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }

  // Try to load from JSON file (static import)
  try {

    const config = await getRegionByRegionId(regionId);
    // const config = await import(`../../../generator/config/regions/${regionId}.json`)
    console.log("config is",config);



    const regionConfig = config as RegionConfig
console.log("reginconfig", regionConfig);
    // Cache it
    configCache.set(regionId, { config: regionConfig, timestamp: Date.now() })

    return regionConfig
  } catch { 
    console.warn(`Region config not found: ${regionId}`)
    return null
  }
}

/**
 * Get region config by country code (e.g., 'GB' → 'uk')
 */
export async function getRegionByCountry(countryCode: string): Promise<RegionConfig | null> {
  // Map country codes to region IDs
  const countryToRegion: Record<string, string> = {
    'GB': 'uk',
    'IN': 'in',
    'JP': 'jp',
    'US': 'us',
    // Add more mappings as regions are added
  }

  const regionId = countryToRegion[countryCode]
  if (!regionId) {
    return null
  }

  return getRegionConfig(regionId)
}

/**
 * Get all available regions
 */
export async function getAllRegions(): Promise<RegionConfig[]> {
  const regionIds = ['uk','in'] // Add more as they're created
  const configs = await Promise.all(
    regionIds.map(id => getRegionConfig(id))
  )
  return configs.filter((c): c is RegionConfig => c !== null)
}

/**
 * Build AI system prompt additions for a region
 */
export function buildRegionalPrompt(config: RegionConfig): string {
  const parts: string[] = []

  // Location context
  parts.push(`User is from ${config.name} (${config.countryCode}).`)
  parts.push(`Timezone: ${config.localization.timezone}`)

  // Language/dialect
  if (config.localization.dialects.length > 0) {
    parts.push(`Use ${config.localization.dialects[0]} dialect and spelling.`)
  }

  // Cultural additions
  if (config.ai.systemPromptAdditions) {
    parts.push(config.ai.systemPromptAdditions)
  }

  // Upcoming festivals (next 30 days)
  const upcomingFestivals = getUpcomingFestivals(config.cultural.festivals)
  if (upcomingFestivals.length > 0) {
    parts.push(`Upcoming events: ${upcomingFestivals.join(', ')}`)
  }

  // Tone modifiers
  if (config.ai.toneModifiers.length > 0) {
    parts.push(`Tone: ${config.ai.toneModifiers.join(', ')}`)
  }

  return parts.join('\n')
}

/**
 * Get festivals happening in the next 30 days
 */
function getUpcomingFestivals(festivals: RegionConfig['cultural']['festivals']): string[] {
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

/**
 * Get appropriate greeting based on time of day
 */
export function getGreeting(config: RegionConfig): string {
  const now = new Date()
  const hour = now.getHours()

  if (hour < 12) {
    return config.cultural.greetings.morning
  } else if (hour < 17) {
    return config.cultural.greetings.afternoon
  } else {
    return config.cultural.greetings.evening
  }
}
