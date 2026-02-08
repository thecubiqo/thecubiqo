/**
 * Feature Flags & Access Control System
 * 
 * Controls which features are available to different user types:
 * - Founders: Full access to everything (always)
 * - Regular users: Access to features marked as "released" in database
 * - Public/guest: Very limited access
 */

import { createClient } from '@/lib/supabase/server'

/**
 * All features in the system
 * This is the source of truth for what can be toggled
 */
export interface FeatureAccess {
  // Core Features (can be released)
  agents: boolean
  files: boolean
  memory: boolean
  codeExecution: boolean
  browser: boolean
  integrations: boolean
  
  // Admin Features (always founder-only)
  admin: boolean
  deploy: boolean
  featureGate: boolean
}

/**
 * Full access - what founders get
 * Founders always have access to everything
 */
export const FOUNDER_ACCESS: FeatureAccess = {
  agents: true,
  files: true,
  memory: true,
  codeExecution: true,
  browser: true,
  integrations: true,
  admin: true,
  deploy: true,
  featureGate: true,
}

/**
 * Public access - what non-authenticated users get
 * Very limited, read-only type access
 */
export const PUBLIC_ACCESS: FeatureAccess = {
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
 * Default access for new authenticated users
 * Start with nothing, features are released gradually
 */
export const DEFAULT_USER_ACCESS: FeatureAccess = {
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
 * Features that can NEVER be released to regular users
 * These stay founder-only permanently
 */
export const PERMANENTLY_FOUNDER_ONLY: (keyof FeatureAccess)[] = [
  'admin',
  'deploy',
  'featureGate',
]

/**
 * Features that CAN be released to regular users
 * These are the ones that appear in the feature gate admin UI
 */
export const RELEASABLE_FEATURES: (keyof FeatureAccess)[] = [
  'agents',
  'files',
  'memory',
  'codeExecution',
  'browser',
  'integrations',
]

/**
 * Get released features from database
 * This is what regular authenticated users get access to
 */
export async function getReleasedFeatures(): Promise<FeatureAccess> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('released_features')
      .select('feature_name, is_released')
      .eq('is_released', true)

    if (error) {
      console.error('Error fetching released features:', error)
      return DEFAULT_USER_ACCESS
    }

    // Start with default (everything false)
    const access: FeatureAccess = { ...DEFAULT_USER_ACCESS }

    // Enable released features
    if (data) {
      data.forEach((row) => {
        const featureName = row.feature_name as keyof FeatureAccess
        if (featureName in access) {
          access[featureName] = true
        }
      })
    }

    // Ensure admin features stay locked
    PERMANENTLY_FOUNDER_ONLY.forEach((feature) => {
      access[feature] = false
    })

    return access
  } catch (error) {
    console.error('Error in getReleasedFeatures:', error)
    return DEFAULT_USER_ACCESS
  }
}

/**
 * Feature metadata for UI display
 */
export interface FeatureMetadata {
  key: keyof FeatureAccess
  name: string
  description: string
  category: 'Core' | 'Admin'
  releasable: boolean
}

export const FEATURE_METADATA: FeatureMetadata[] = [
  {
    key: 'agents',
    name: 'AI Agents',
    description: 'Spawn and manage AI agents for complex tasks',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'files',
    name: 'File Management',
    description: 'Upload, manage, and process files',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'memory',
    name: 'Memory System',
    description: 'Long-term memory and context retention',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'codeExecution',
    name: 'Code Execution',
    description: 'Run code snippets and scripts',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'browser',
    name: 'Browser Control',
    description: 'Web automation and browser interaction',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'integrations',
    name: 'Integrations',
    description: 'Third-party service integrations',
    category: 'Core',
    releasable: true,
  },
  {
    key: 'admin',
    name: 'Admin Panel',
    description: 'System administration and monitoring',
    category: 'Admin',
    releasable: false,
  },
  {
    key: 'deploy',
    name: 'Deployment',
    description: 'Deploy and manage infrastructure',
    category: 'Admin',
    releasable: false,
  },
  {
    key: 'featureGate',
    name: 'Feature Gate',
    description: 'Control feature releases',
    category: 'Admin',
    releasable: false,
  },
]
