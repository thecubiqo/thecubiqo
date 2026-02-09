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
  // Navigation Features
  home: boolean
  chat: boolean
  settings: boolean
  cubikey: boolean
  
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
  home: true,
  chat: true,
  settings: true,
  cubikey: true,
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
  home: true,
  chat: false,
  settings: false,
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
 * Default access for new authenticated users
 * Start with nothing, features are released gradually
 */
export const DEFAULT_USER_ACCESS: FeatureAccess = {
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
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] getReleasedFeatures')
  return DEFAULT_USER_ACCESS
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

/**
 * Get all feature flags (for admin panel)
 * Returns current state of all features from database
 */
export async function getAllFeatureFlags(): Promise<FeatureAccess> {
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] getAllFeatureFlags')
  return { ...FOUNDER_ACCESS }
}

/**
 * Update a feature flag's released status (admin only)
 */
export async function updateFeatureFlag(
  feature: keyof FeatureAccess,
  released: boolean
): Promise<boolean> {
  // TODO: Replace with real DB after migrations
  console.log('[MOCK] updateFeatureFlag:', feature, released)
  return true
}
