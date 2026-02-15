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
 * Current landing configuration
 * 
 * To switch designs, simply change defaultVariant:
 * - 'plasma-wave' (current) - Flowing plasma waves
 * - 'tech-wireframe' - Wireframe energy cube
 */
export const landingConfig: LandingConfig = {
  defaultVariant: 'plasma-wave',
  allowUrlOverride: true,
  enableLanding: true,
}

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
