/**
 * Auth Module Export
 */

export {
  getOrCreateGuestSession,
  getSession,
  isSessionValid,
  convertGuestToAuthenticated,
  getUserSessions,
  updateSessionActivity,
  cleanupExpiredSessions,
} from './session'

export {
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getCurrentProfile,
  ensureProfile,
  updateProfile,
  deleteAccount,
} from './actions'

export {
  isFounder,
  getFeatureAccess,
  hasFeatureAccess,
  getAccessibleFeatures,
} from './founders'

export {
  PUBLIC_ACCESS,
  FOUNDER_ACCESS,
  DEFAULT_USER_ACCESS,
  PERMANENTLY_FOUNDER_ONLY,
  RELEASABLE_FEATURES,
  FEATURE_METADATA,
  getReleasedFeatures,
} from './feature-flags'

export type { AuthResult } from './actions'
export type { FeatureAccess, FeatureMetadata } from './feature-flags'
