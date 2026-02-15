'use client'

/**
 * useAdminAuth Hook
 * Checks if the current user has admin role via profile data.
 * Uses the existing useAuth hook and checks the profile's preferences
 * or a dedicated admin email list for role verification.
 */

import { useAuth } from './useAuth'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean)

export function useAdminAuth() {
  const auth = useAuth()

  const isAdmin =
    auth.isAuthenticated &&
    !!auth.user?.email &&
    ADMIN_EMAILS.includes(auth.user.email)

  return {
    ...auth,
    isAdmin,
  }
}
