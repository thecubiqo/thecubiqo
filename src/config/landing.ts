/**
 * Landing Page Configuration
 * 
 * Controls which landing cube design is used on the main app launch.
 * This configuration makes it easy to switch between different designs
 * without breaking existing functionality.
 */

export type LandingCubeVariant = 'plasma-wave' | 'tech-wireframe' | 'silver-wireframe' | 'particle'

export interface LandingConfig {
  /**
   * The default landing cube variant to use.
   *
   * Options:
   * - 'plasma-wave': Beautiful flowing plasma waves with gradient colors (default)
   * - 'tech-wireframe': High-tech wireframe energy cube with voice-reactive animations
   * - 'silver-wireframe': Chrome/silver wireframe cube with cube→sphere morph animation
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
 * Current landing configuration
 * 
 * To switch designs, simply change defaultVariant:
 * - 'plasma-wave' (current) - Flowing plasma waves
 * - 'tech-wireframe' - Wireframe energy cube
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_LANDING_DEFAULT: Set default variant ('plasma-wave' | 'tech-wireframe')
 * - NEXT_PUBLIC_LANDING_ENABLE: Enable/disable landing animation ('true' | 'false')
 */
export const landingConfig: LandingConfig = {
  defaultVariant: (() => {
    const envVariant = process.env.NEXT_PUBLIC_LANDING_DEFAULT
    // Validate environment variable value
    if (envVariant === 'plasma-wave' || envVariant === 'tech-wireframe' || envVariant === 'silver-wireframe') {
      return envVariant
    }
    // Default to plasma-wave if not set or invalid
    return 'plasma-wave'
  })(),
  allowUrlOverride: true,
  enableLanding: process.env.NEXT_PUBLIC_LANDING_ENABLE === 'false' ? false : true,
}

/**
 * Get the landing variant to use based on config and URL params
 */
export function getLandingVariant(searchParams?: URLSearchParams): LandingCubeVariant {
  // Check URL override if enabled
  if (landingConfig.allowUrlOverride && searchParams) {
    const urlVariant = searchParams.get('landing')
    if (urlVariant === 'plasma-wave' || urlVariant === 'tech-wireframe' || urlVariant === 'silver-wireframe') {
      return urlVariant
    }
  }

  return landingConfig.defaultVariant
}
