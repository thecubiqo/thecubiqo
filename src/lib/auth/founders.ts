/**
 * Founder Authentication & Feature Access Control
 * 
 * This module defines founder emails and determines feature access levels
 * for different user types (founder vs regular users).
 */

import type { User } from '@supabase/supabase-js'
import type { FeatureAccess } from './feature-flags'
import { FOUNDER_ACCESS, PUBLIC_ACCESS, getReleasedFeatures } from './feature-flags'

/**
 * Hardcoded founder emails
 * These users get full access to all features
 */
const FOUNDER_EMAILS = ['aditya@cubiqo.ai']

/**
 * Check if an email belongs to a founder
 */
export function isFounder(email: string | undefined | null): boolean {
  if (!email) return false
  return FOUNDER_EMAILS.includes(email.toLowerCase())
}

/**
 * Get feature access level for a user
 * - Founders: Full access to everything
 * - Regular users: Access to released features only
 * - Not authenticated: Public access (very limited)
 */
export async function getFeatureAccess(user: User | null): Promise<FeatureAccess> {
  if (!user) {
    return PUBLIC_ACCESS
  }

  if (isFounder(user.email)) {
    return FOUNDER_ACCESS
  }

  // Regular authenticated user - get released features from database
  return await getReleasedFeatures()
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  user: User | null, 
  feature: keyof FeatureAccess
): Promise<boolean> {
  const access = await getFeatureAccess(user)
  return access[feature] || false
}

/**
 * Filter features based on user access
 * Returns only the features that are accessible to the user
 */
export async function getAccessibleFeatures(user: User | null): Promise<Partial<FeatureAccess>> {
  const fullAccess = await getFeatureAccess(user)
  
  // Filter out features that are false
  return Object.entries(fullAccess).reduce((acc, [key, value]) => {
    if (value) {
      acc[key as keyof FeatureAccess] = value
    }
    return acc
  }, {} as Partial<FeatureAccess>)
}
