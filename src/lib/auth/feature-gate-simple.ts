/**
 * SIMPLE FEATURE GATE - No Database Required
 * Just controls what features are visible based on founder status
 */

export interface FeatureAccess {
  home: boolean
  chat: boolean
  agents: boolean
  files: boolean
  memory: boolean
  codeExecution: boolean
  browser: boolean
  integrations: boolean
  cubikey: boolean
  settings: boolean
  admin: boolean
  deploy: boolean
  featureGate: boolean
}

// What founders see (everything)
export const FOUNDER_ACCESS: FeatureAccess = {
  home: true,
  chat: true,
  agents: true,
  files: true,
  memory: true,
  codeExecution: true,
  browser: true,
  integrations: true,
  cubikey: true,
  settings: true,
  admin: true,
  deploy: true,
  featureGate: true,
}

// What regular users see (limited)
export const USER_ACCESS: FeatureAccess = {
  home: true,
  chat: true,
  agents: false,
  files: false,
  memory: false,
  codeExecution: false,
  browser: false,
  integrations: false,
  cubikey: false,
  settings: true,
  admin: false,
  deploy: false,
  featureGate: false,
}

// Founder emails
const FOUNDER_EMAILS = ['aditya@cubiqo.ai']

export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false
  return FOUNDER_EMAILS.includes(email.toLowerCase())
}

export function getFeatureAccess(email: string | null | undefined): FeatureAccess {
  return isFounder(email) ? FOUNDER_ACCESS : USER_ACCESS
}

export function hasFeature(email: string | null | undefined, feature: keyof FeatureAccess): boolean {
  const access = getFeatureAccess(email)
  return access[feature]
}
