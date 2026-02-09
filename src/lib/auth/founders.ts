/**
 * Founder Authentication & Feature Access Control
 * 
 * This module defines founder emails - pure utility, no server deps
 */

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
