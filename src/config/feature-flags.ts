/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables.
 * 
 * Related PRs: #36 (AI model footer), #37 (Particle landing toggle)
 */

export interface FeatureFlags {
  /** Enable admin elevated controls (debug view, bypass confirmations, impersonation) */
  ADMIN_ELEVATED_CONTROLS: boolean;
  
  /** Enable audit logging for privileged actions */
  ADMIN_AUDIT_LOGGING: boolean;
}

/**
 * UI Feature Flags
 * Controls visual features and experimental UI components
 */
export interface UIFeatureFlags {
  /** Show AI model footer on landing page (default: false) */
  showLandingModelFooter: boolean;
  
  /** Use ParticleLanding as home page instead of default (default: false) */
  useParticleLandingAsHome: boolean;
}

/**
 * Get the current feature flags configuration
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    // Enable admin elevated controls by default in development, or via env var
    ADMIN_ELEVATED_CONTROLS: 
      process.env.NEXT_PUBLIC_ENABLE_ADMIN_CONTROLS === 'true' || 
      process.env.NODE_ENV === 'development',
    
    // Audit logging is always enabled
    ADMIN_AUDIT_LOGGING: true,
  };
}

/**
 * Get UI feature flags configuration
 */
export function getUIFeatureFlags(): UIFeatureFlags {
  return {
    // AI model footer on landing (PR #36)
    showLandingModelFooter: 
      process.env.NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER === 'true',
    
    // Use ParticleLanding as home (PR #37)
    useParticleLandingAsHome: 
      process.env.NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME === 'true',
  };
}

/**
 * Check if a specific feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flag];
}

/**
 * Check if a specific UI feature flag is enabled
 */
export function isUIFeatureEnabled(flag: keyof UIFeatureFlags): boolean {
  const flags = getUIFeatureFlags();
  return flags[flag];
}

/**
 * Get all enabled feature flags
 */
export function getEnabledFlags(): Array<keyof FeatureFlags> {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as keyof FeatureFlags);
}

/**
 * Get all enabled UI feature flags
 */
export function getEnabledUIFlags(): Array<keyof UIFeatureFlags> {
  const flags = getUIFeatureFlags();
  return Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag as keyof UIFeatureFlags);
}
