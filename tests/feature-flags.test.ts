/**
 * Feature Flags Tests
 * 
 * Validates UI feature flags for landing page and particle scene.
 * Related PRs: #36 (AI model footer), #37 (Particle landing toggle)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('UI Feature Flags', () => {
  const featureFlagsPath = resolve(__dirname, '../src/config/feature-flags.ts')
  const featureFlagsContent = readFileSync(featureFlagsPath, 'utf-8')

  it('should export UIFeatureFlags interface', () => {
    expect(featureFlagsContent).toContain('export interface UIFeatureFlags')
  })

  it('should export getUIFeatureFlags function', () => {
    expect(featureFlagsContent).toContain('export function getUIFeatureFlags')
  })

  it('should export isUIFeatureEnabled function', () => {
    expect(featureFlagsContent).toContain('export function isUIFeatureEnabled')
  })

  it('should define showLandingModelFooter flag', () => {
    expect(featureFlagsContent).toContain('showLandingModelFooter')
  })

  it('should define useParticleLandingAsHome flag', () => {
    expect(featureFlagsContent).toContain('useParticleLandingAsHome')
  })

  it('should check NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER env var', () => {
    expect(featureFlagsContent).toContain('NEXT_PUBLIC_SHOW_LANDING_MODEL_FOOTER')
  })

  it('should check NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME env var', () => {
    expect(featureFlagsContent).toContain('NEXT_PUBLIC_USE_PARTICLE_LANDING_HOME')
  })
})

describe('LandingModelFooter Component', () => {
  const footerPath = resolve(__dirname, '../src/components/LandingModelFooter.tsx')
  const footerContent = readFileSync(footerPath, 'utf-8')

  it('should export LandingModelFooter component', () => {
    expect(footerContent).toContain('export function LandingModelFooter')
  })

  it('should accept models prop', () => {
    expect(footerContent).toContain('models')
  })

  it('should accept className prop', () => {
    expect(footerContent).toContain('className')
  })

  it('should have default models list', () => {
    expect(footerContent).toContain('DEFAULT_MODELS')
  })

  it('should use framer-motion for animations', () => {
    expect(footerContent).toContain('from \'framer-motion\'')
  })

  it('should be client-side component', () => {
    expect(footerContent).toContain('\'use client\'')
  })
})

describe('Documentation Files', () => {
  it('should have SPARK_AI_COMPARISON.md', () => {
    const docPath = resolve(__dirname, '../docs/SPARK_AI_COMPARISON.md')
    const docContent = readFileSync(docPath, 'utf-8')
    
    expect(docContent).toContain('Provider Comparison')
    expect(docContent).toContain('OpenClaw')
    expect(docContent).toContain('ANTHROPIC_API_KEY')
  })

  it('should have PR45_NOTE.md', () => {
    const docPath = resolve(__dirname, '../docs/PR45_NOTE.md')
    const docContent = readFileSync(docPath, 'utf-8')
    
    expect(docContent).toContain('PR #45')
    expect(docContent).toContain('no code changes')
  })

  it('should have HOW_TO_PREVIEW.md', () => {
    const docPath = resolve(__dirname, '../HOW_TO_PREVIEW.md')
    const docContent = readFileSync(docPath, 'utf-8')
    
    expect(docContent).toContain('Quick Start')
    expect(docContent).toContain('Vercel')
    expect(docContent).toContain('Troubleshooting')
  })
})
