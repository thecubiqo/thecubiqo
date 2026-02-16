/**
 * Landing Page Configuration
 * 
 * Controls which landing cube design is used on the main app launch.
 * This configuration makes it easy to switch between different designs
 * without breaking existing functionality.
 */

export type LandingCubeVariant = 'plasma-wave' | 'tech-wireframe'

export interface LandingConfig {
  /**
   * The default landing cube variant to use.
   * 
   * Options:
   * - 'plasma-wave': Beautiful flowing plasma waves with gradient colors (default)
   * - 'tech-wireframe': High-tech wireframe energy cube with voice-reactive animations
   */
  defaultVariant: LandingCubeVariant
  
  /**
   * Allow URL parameter override for testing/preview
   * Example: ?landing=tech-wireframe
   */
  allowUrlOverride: boolean
  
  /**
   * Enable landing cube animation on app launch
   */
  enableLanding: boolean
}

/**
 * Get landing configuration from environment variables with safe fallbacks
 */
function getLandingConfigFromEnv(): LandingConfig {
  // Read environment variables
  const envDefault = process.env.NEXT_PUBLIC_LANDING_DEFAULT as LandingCubeVariant | undefined
  const envEnable = process.env.NEXT_PUBLIC_LANDING_ENABLE
  
  // Validate and apply defaults
  const defaultVariant: LandingCubeVariant = 
    (envDefault === 'plasma-wave' || envDefault === 'tech-wireframe') 
      ? envDefault 
      : 'plasma-wave' // Default to plasma-wave for production
  
  const enableLanding = envEnable !== 'false' // Enabled by default unless explicitly 'false'
  
  return {
    defaultVariant,
    allowUrlOverride: true, // Always allow URL override for testing
    enableLanding,
  }
}

/**
 * Current landing configuration
 * 
 * Configuration priority:
 * 1. Environment variables (NEXT_PUBLIC_LANDING_DEFAULT, NEXT_PUBLIC_LANDING_ENABLE)
 * 2. Default fallbacks (plasma-wave, enabled)
 * 
 * Environment variables:
 * - NEXT_PUBLIC_LANDING_DEFAULT: 'plasma-wave' | 'tech-wireframe' (default: 'plasma-wave')
 * - NEXT_PUBLIC_LANDING_ENABLE: 'true' | 'false' (default: 'true')
 */
export const landingConfig: LandingConfig = getLandingConfigFromEnv()

/**
 * Get the landing variant to use based on config and URL params
 */
export function getLandingVariant(searchParams?: URLSearchParams): LandingCubeVariant {
  // Check URL override if enabled
  if (landingConfig.allowUrlOverride && searchParams) {
    const urlVariant = searchParams.get('landing')
    if (urlVariant === 'plasma-wave' || urlVariant === 'tech-wireframe') {
      return urlVariant
    }
  }
  
  return landingConfig.defaultVariant
}
