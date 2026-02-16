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
  hasFeature,
  updateUserAccess,
  getUserAccessState,
  FOUNDER_ACCESS,
  type FeatureAccess,
  type FeatureMetadata,
  FEATURE_METADATA,
} from './feature-gate-simple'

export type { AuthResult } from './actions'
