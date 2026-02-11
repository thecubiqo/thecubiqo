/**
 * Authentication & Feature Gate
 * Simple exports - no complexity
 */

export { 
  isFounder,
  getFeatureAccess,
  getUserAccessState,
  updateUserAccess,
  hasFeature,
  FOUNDER_ACCESS,
  USER_ACCESS,
  FEATURE_METADATA,
  type FeatureAccess,
  type FeatureMetadata
} from './feature-gate-simple'
