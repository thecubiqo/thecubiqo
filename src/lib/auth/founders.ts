/**
 * Founder Authentication & Feature Access Control
 * 
 * This module defines founder emails - pure utility, no server deps
 */

import type { FeatureAccess } from './feature-flags'
import { FOUNDER_ACCESS, DEFAULT_USER_ACCESS } from './feature-flags'

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
 * Get feature access for a user
 */
export async function getFeatureAccess(email: string | undefined | null): Promise<FeatureAccess> {
  if (isFounder(email)) {
    return FOUNDER_ACCESS
  }
  return DEFAULT_USER_ACCESS
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  email: string | undefined | null,
  feature: keyof FeatureAccess
): Promise<boolean> {
  const access = await getFeatureAccess(email)
  return access[feature]
}

/**
 * Get list of accessible features for a user
 */
export async function getAccessibleFeatures(
  email: string | undefined | null
): Promise<(keyof FeatureAccess)[]> {
  const access = await getFeatureAccess(email)
  return Object.entries(access)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as keyof FeatureAccess)
}
