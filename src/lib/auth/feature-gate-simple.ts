/**
 * SIMPLE FEATURE GATE - No Database Required
 * Pure UI toggles that update what regular users see
 */

export interface FeatureAccess {
  home: boolean
  chat: boolean
  agents: boolean
  files: boolean
  memory: boolean
  coder: boolean
  codeExecution: boolean
  browser: boolean
  integrations: boolean
  gmail: boolean
  gmailWrite: boolean
  calendar: boolean
  calendarWrite: boolean
  slack: boolean
  discord: boolean
  github: boolean
  coder: boolean
  cubikey: boolean
  settings: boolean
  admin: boolean
  // New features
  voice_mode: boolean
  duo_mode: boolean
  action_cards: boolean
  sidekick_mode: boolean
  cope_mode: boolean
}

// Founder emails - only these see the Founder Portal button
const FOUNDER_EMAILS = ['aditya@cubiqo.ai', 'av.loy07@gmail.com']

// What founders see (everything - this never changes)
export const FOUNDER_ACCESS: FeatureAccess = {
  home: true,
  chat: true,
  agents: true,
  files: true,
  memory: true,
  coder: true,
  codeExecution: true,
  browser: true,
  integrations: true,
  gmail: true,
  gmailWrite: true,
  calendar: true,
  calendarWrite: true,
  slack: true,
  discord: true,
  github: true,
  coder: true,
  cubikey: true,
  settings: true,
  admin: true,
  voice_mode: true,
  duo_mode: true,
  action_cards: true,
  sidekick_mode: true,
  cope_mode: true,
}

// What regular users see (controlled by toggles in Founder Portal)
// This object gets modified by the Founder Portal toggles
export let USER_ACCESS: FeatureAccess = {
  home: true,
  chat: true,
  agents: false,
  files: false,
  memory: false,
  coder: true,
  codeExecution: false,
  browser: false,
  integrations: false,
  gmail: false,
  gmailWrite: false,
  calendar: false,
  calendarWrite: false,
  slack: false,
  discord: false,
  github: false,
  coder: false,
  cubikey: false,
  settings: true,
  admin: false,
  voice_mode: true,
  duo_mode: false,
  action_cards: true,
  sidekick_mode: false,
  cope_mode: false,
}

// Check if email is a founder
export function isFounder(email: string | null | undefined): boolean {
  // Allow simulation of generic user for testing
  if (typeof window !== 'undefined' && localStorage.getItem('cubiqo_simulate_user') === 'true') {
    return false
  }

  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  return FOUNDER_EMAILS.some(f => f.toLowerCase() === normalizedEmail)
}

// Get feature access for a user
export function getFeatureAccess(email: string | null | undefined): FeatureAccess {
  // Force reload from local storage to ensure fresh state
  const state = getUserAccessState()
  return isFounder(email) ? FOUNDER_ACCESS : state
}

// Check if user has a specific feature
export function hasFeature(email: string | null | undefined, feature: keyof FeatureAccess): boolean {
  const access = getFeatureAccess(email)
  return access[feature]
}

// Update user access (called from Founder Portal)
export function updateUserAccess(updates: Partial<FeatureAccess>): void {
  USER_ACCESS = { ...USER_ACCESS, ...updates }
  // Persist to localStorage if in browser
  if (typeof window !== 'undefined') {
    localStorage.setItem('userAccess', JSON.stringify(USER_ACCESS))
  }
}

// Get current user access state
export function getUserAccessState(): FeatureAccess {
  // Load from localStorage if available
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('userAccess')
    if (stored) {
      try {
        USER_ACCESS = JSON.parse(stored)
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }
  return USER_ACCESS
}

// Feature metadata for display in Founder Portal
export interface FeatureMetadata {
  id: keyof FeatureAccess
  name: string
  description: string
  category: 'Navigation' | 'Agent Features' | 'Integrations'
}

export const FEATURE_METADATA: FeatureMetadata[] = [
  // Navigation Features
  { id: 'home', name: 'Home', description: 'Landing page', category: 'Navigation' },
  { id: 'chat', name: 'Chat', description: 'Chat interface', category: 'Navigation' },
  { id: 'agents', name: 'Agents', description: 'Agent dashboard', category: 'Navigation' },
  { id: 'coder', name: 'Coder', description: 'Coding IDE with editor, terminal, and AI chat', category: 'Navigation' },
  { id: 'files', name: 'Files', description: 'File browser', category: 'Navigation' },
  { id: 'memory', name: 'Memory', description: 'Memory search', category: 'Navigation' },
  { id: 'coder', name: 'Coder', description: 'Code editor & execution', category: 'Navigation' },
  { id: 'integrations', name: 'Integrations', description: 'Integration settings', category: 'Navigation' },
  { id: 'cubikey', name: 'CubiKey', description: 'API key management', category: 'Navigation' },
  { id: 'settings', name: 'Settings', description: 'User settings', category: 'Navigation' },
  { id: 'admin', name: 'Admin', description: 'Admin dashboard (Founder only)', category: 'Navigation' },

  // Agent Features
  { id: 'codeExecution', name: 'Code Execution', description: 'Execute code in agents', category: 'Agent Features' },
  { id: 'browser', name: 'Browser Control', description: 'Browser automation', category: 'Agent Features' },

  // Integrations
  { id: 'gmail', name: 'Gmail (Read)', description: 'Read emails', category: 'Integrations' },
  { id: 'gmailWrite', name: 'Gmail (Write)', description: 'Send emails', category: 'Integrations' },
  { id: 'calendar', name: 'Calendar (Read)', description: 'Read calendar events', category: 'Integrations' },
  { id: 'calendarWrite', name: 'Calendar (Write)', description: 'Create calendar events', category: 'Integrations' },
  { id: 'slack', name: 'Slack', description: 'Slack integration', category: 'Integrations' },
  { id: 'discord', name: 'Discord', description: 'Discord integration', category: 'Integrations' },
  { id: 'github', name: 'GitHub', description: 'GitHub integration', category: 'Integrations' },
]
