/**
 * Client-side Feature Flags - MOCK MODE
 * Use this in client components
 */

import type { FeatureAccess } from './feature-flags'

// Mock defaults - everything enabled for founder, limited for users
const MOCK_FEATURES: FeatureAccess = {
  home: true,
  chat: true,
  settings: true,
  cubikey: false,
  agents: false,
  files: false,
  memory: false,
  codeExecution: false,
  browser: false,
  integrations: false,
  admin: false,
  deploy: false,
  featureGate: false,
}

/**
 * Get all feature flags (mock mode)
 */
export async function getAllFeatureFlagsClient(): Promise<FeatureAccess> {
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] getAllFeatureFlagsClient')
  return { ...MOCK_FEATURES }
}

/**
 * Update a feature flag (mock mode)
 */
export async function updateFeatureFlagClient(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] updateFeatureFlagClient:', feature, released)
  MOCK_FEATURES[feature] = released
  return true
}

/**
 * Get released features for a user (mock mode)
 */
export async function getReleasedFeaturesClient(): Promise<FeatureAccess> {
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] getReleasedFeaturesClient')
  return { ...MOCK_FEATURES }
}
