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

export type { AuthResult } from './actions'
