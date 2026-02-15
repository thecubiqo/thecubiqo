/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables.
 */

export interface FeatureFlags {
  /** Enable admin elevated controls (debug view, bypass confirmations, impersonation) */
  ADMIN_ELEVATED_CONTROLS: boolean;
  
  /** Enable audit logging for privileged actions */
  ADMIN_AUDIT_LOGGING: boolean;
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
 * Check if a specific feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
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
