/**
 * Client-side Feature Flags
 * Use this in client components
 */

import { createClient } from '@/lib/supabase/client'
import type { FeatureAccess } from './feature-flags'

// Re-declare defaults here to avoid importing server code
const DEFAULT_USER_ACCESS: FeatureAccess = {
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
 * Get all feature flags (client-side)
 */
export async function getAllFeatureFlagsClient(): Promise<FeatureAccess> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('feature, released')
    
    if (error) {
      console.warn('Failed to fetch all feature flags:', error)
      return { ...DEFAULT_USER_ACCESS }
    }
    
    // Start with default
    const flags: FeatureAccess = { ...DEFAULT_USER_ACCESS }
    
    // Override with database values if they exist
    if (data) {
      for (const row of data) {
        if (row.feature in flags) {
          flags[row.feature as keyof FeatureAccess] = row.released
        }
      }
    }
    
    return flags
  } catch (err) {
    console.warn('Error fetching all feature flags:', err)
    return { ...DEFAULT_USER_ACCESS }
  }
}

/**
 * Update a feature flag (client-side)
 */
export async function updateFeatureFlagClient(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('feature_flags')
      .upsert({
        feature,
        released,
        updated_at: new Date().toISOString(),
      })
    
    if (error) {
      console.error('Failed to update feature flag:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error updating feature flag:', err)
    return false
  }
}

/**
 * Get released features for a user (client-side)
 */
export async function getReleasedFeaturesClient(): Promise<FeatureAccess> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('feature_flags')
      .select('feature, released')
      .eq('released', true)
    
    if (error) {
      console.warn('Failed to fetch released features:', error)
      return DEFAULT_USER_ACCESS
    }
    
    const access: FeatureAccess = { ...DEFAULT_USER_ACCESS }
    
    if (data) {
      for (const row of data) {
        if (row.feature in access) {
          access[row.feature as keyof FeatureAccess] = true
        }
      }
    }
    
    return access
  } catch (err) {
    console.warn('Error fetching released features:', err)
    return DEFAULT_USER_ACCESS
  }
}
