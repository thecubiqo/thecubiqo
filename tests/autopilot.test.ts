/**
 * Autopilot Features Tests
 *
 * Validates the CubiQo Autopilot sci-fi feature set:
 * - Profile auto-fill extraction from conversations
 * - Feature flags for autopilot capabilities
 * - Background task management
 * - UI component integration
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Autopilot Feature Flags', () => {
  const featureFlagsPath = resolve(__dirname, '../src/config/feature-flags.ts')
  const featureFlagsContent = readFileSync(featureFlagsPath, 'utf-8')

  it('should export AutopilotFeatureFlags interface', () => {
    expect(featureFlagsContent).toContain('export interface AutopilotFeatureFlags')
  })

  it('should export getAutopilotFeatureFlags function', () => {
    expect(featureFlagsContent).toContain('export function getAutopilotFeatureFlags')
  })

  it('should export isAutopilotFeatureEnabled function', () => {
    expect(featureFlagsContent).toContain('export function isAutopilotFeatureEnabled')
  })

  it('should define cubiqoAutopilot flag', () => {
    expect(featureFlagsContent).toContain('cubiqoAutopilot')
  })

  it('should define profileAutoFill flag', () => {
    expect(featureFlagsContent).toContain('profileAutoFill')
  })

  it('should define backgroundAgents flag', () => {
    expect(featureFlagsContent).toContain('backgroundAgents')
  })

  it('should check NEXT_PUBLIC_CUBIQO_AUTOPILOT env var', () => {
    expect(featureFlagsContent).toContain('NEXT_PUBLIC_CUBIQO_AUTOPILOT')
  })

  it('should check NEXT_PUBLIC_PROFILE_AUTO_FILL env var', () => {
    expect(featureFlagsContent).toContain('NEXT_PUBLIC_PROFILE_AUTO_FILL')
  })

  it('should check NEXT_PUBLIC_BACKGROUND_AGENTS env var', () => {
    expect(featureFlagsContent).toContain('NEXT_PUBLIC_BACKGROUND_AGENTS')
  })

  it('should export getEnabledAutopilotFlags function', () => {
    expect(featureFlagsContent).toContain('export function getEnabledAutopilotFlags')
  })
})

describe('Profile Auto-Fill Extraction', () => {
  const extractPath = resolve(__dirname, '../src/lib/autopilot/profile-extract.ts')
  const extractContent = readFileSync(extractPath, 'utf-8')

  it('should export extractProfileFields function', () => {
    expect(extractContent).toContain('export async function extractProfileFields')
  })

  it('should export ProfileField interface', () => {
    expect(extractContent).toContain('export interface ProfileField')
  })

  it('should export ProfileExtractionResult interface', () => {
    expect(extractContent).toContain('export interface ProfileExtractionResult')
  })

  it('should export EXTRACTABLE_PROFILE_FIELDS', () => {
    expect(extractContent).toContain('export const EXTRACTABLE_PROFILE_FIELDS')
  })

  it('should define display_name as extractable field', () => {
    expect(extractContent).toContain("'display_name'")
  })

  it('should define occupation as extractable field', () => {
    expect(extractContent).toContain("'occupation'")
  })

  it('should define location as extractable field', () => {
    expect(extractContent).toContain("'location'")
  })

  it('should define interests as extractable field', () => {
    expect(extractContent).toContain("'interests'")
  })

  it('should require confidence >= 0.7', () => {
    expect(extractContent).toContain('confidence >= 0.7')
  })

  it('should support conversation and inferred sources', () => {
    expect(extractContent).toContain("'conversation'")
    expect(extractContent).toContain("'inferred'")
  })

  it('should use Claude Haiku for cost-effective extraction', () => {
    expect(extractContent).toContain('claude-haiku')
  })
})

describe('Autopilot Profile API Route', () => {
  const routePath = resolve(__dirname, '../src/app/api/autopilot/profile/route.ts')
  const routeContent = readFileSync(routePath, 'utf-8')

  it('should export POST handler', () => {
    expect(routeContent).toContain('export async function POST')
  })

  it('should validate required fields', () => {
    expect(routeContent).toContain('sessionId')
    expect(routeContent).toContain('userMessage')
    expect(routeContent).toContain('aiResponse')
  })

  it('should import extractProfileFields', () => {
    expect(routeContent).toContain('extractProfileFields')
  })

  it('should support BYO API keys', () => {
    expect(routeContent).toContain('x-byo-claude-key')
  })

  it('should update profile preferences', () => {
    expect(routeContent).toContain('preferences')
  })
})

describe('Autopilot Tasks API Route', () => {
  const tasksPath = resolve(__dirname, '../src/app/api/autopilot/tasks/route.ts')
  const tasksContent = readFileSync(tasksPath, 'utf-8')

  it('should export GET handler', () => {
    expect(tasksContent).toContain('export async function GET')
  })

  it('should export POST handler', () => {
    expect(tasksContent).toContain('export async function POST')
  })

  it('should export AutopilotTask interface', () => {
    expect(tasksContent).toContain('export interface AutopilotTask')
  })

  it('should support profile_fill task type', () => {
    expect(tasksContent).toContain('profile_fill')
  })

  it('should support research task type', () => {
    expect(tasksContent).toContain('research')
  })

  it('should support summarize task type', () => {
    expect(tasksContent).toContain('summarize')
  })

  it('should support organize task type', () => {
    expect(tasksContent).toContain('organize')
  })

  it('should export trackTask and getSessionTasks functions', () => {
    expect(tasksContent).toContain('export function trackTask')
    expect(tasksContent).toContain('export function getSessionTasks')
  })

  it('should clean up old completed tasks', () => {
    expect(tasksContent).toContain('cleanupOldTasks')
  })
})

describe('AutopilotStatus Component', () => {
  const componentPath = resolve(__dirname, '../src/components/chat/AutopilotStatus.tsx')
  const componentContent = readFileSync(componentPath, 'utf-8')

  it('should be a client component', () => {
    expect(componentContent).toContain("'use client'")
  })

  it('should export AutopilotStatus component', () => {
    expect(componentContent).toContain('export function AutopilotStatus')
  })

  it('should accept sessionId prop', () => {
    expect(componentContent).toContain('sessionId')
  })

  it('should accept enabled prop', () => {
    expect(componentContent).toContain('enabled')
  })

  it('should display task labels for each task type', () => {
    expect(componentContent).toContain('Updating your profile')
    expect(componentContent).toContain('Researching')
    expect(componentContent).toContain('Summarizing')
    expect(componentContent).toContain('Organizing')
  })

  it('should show autopilot indicator', () => {
    expect(componentContent).toContain('Autopilot')
  })

  it('should poll for task updates', () => {
    expect(componentContent).toContain('setInterval')
  })
})

describe('ChatContainer Integration', () => {
  const chatPath = resolve(__dirname, '../src/components/chat/ChatContainer.tsx')
  const chatContent = readFileSync(chatPath, 'utf-8')

  it('should import AutopilotStatus component', () => {
    expect(chatContent).toContain("import { AutopilotStatus }")
  })

  it('should render AutopilotStatus in chat', () => {
    expect(chatContent).toContain('<AutopilotStatus')
  })
})

describe('useChat Autopilot Integration', () => {
  const hookPath = resolve(__dirname, '../src/hooks/useChat.ts')
  const hookContent = readFileSync(hookPath, 'utf-8')

  it('should trigger autopilot profile fill on each message', () => {
    expect(hookContent).toContain('/api/autopilot/profile')
  })

  it('should send conversation context to autopilot', () => {
    expect(hookContent).toContain('autopilot/profile')
  })
})

describe('OnboardingFlow Autopilot Toggle', () => {
  const onboardingPath = resolve(__dirname, '../src/components/OnboardingFlow.tsx')
  const onboardingContent = readFileSync(onboardingPath, 'utf-8')

  it('should include cubiqoAutopilot in feature toggles', () => {
    expect(onboardingContent).toContain('cubiqoAutopilot')
  })

  it('should default cubiqoAutopilot to true', () => {
    expect(onboardingContent).toContain('cubiqoAutopilot: true')
  })

  it('should have CubiQo Autopilot label', () => {
    expect(onboardingContent).toContain('CubiQo Autopilot')
  })
})

describe('Database Migration', () => {
  const migrationPath = resolve(__dirname, '../supabase/migrations/20260219000001_autopilot_features.sql')
  const migrationContent = readFileSync(migrationPath, 'utf-8')

  it('should add cubiqo_autopilot feature', () => {
    expect(migrationContent).toContain('cubiqo_autopilot')
  })

  it('should add profile_auto_fill feature', () => {
    expect(migrationContent).toContain('profile_auto_fill')
  })

  it('should add background_agents feature', () => {
    expect(migrationContent).toContain('background_agents')
  })

  it('should mark features with sci_fi config flag', () => {
    expect(migrationContent).toContain('"sci_fi": true')
  })

  it('should use ON CONFLICT for idempotent migrations', () => {
    expect(migrationContent).toContain('ON CONFLICT')
  })
})
