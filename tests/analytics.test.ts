/**
 * Analytics Integration Tests
 * 
 * Validates that Vercel Analytics and Speed Insights are properly integrated.
 * Related PR: #7 (Vercel Analytics)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Vercel Analytics Integration', () => {
  const layoutPath = resolve(__dirname, '../src/app/layout.tsx')
  const layoutContent = readFileSync(layoutPath, 'utf-8')

  it('should import @vercel/analytics/next', () => {
    expect(layoutContent).toContain('from "@vercel/analytics/next"')
  })

  it('should import @vercel/speed-insights/next', () => {
    expect(layoutContent).toContain('from "@vercel/speed-insights/next"')
  })

  it('should render Analytics component', () => {
    expect(layoutContent).toContain('<Analytics')
  })

  it('should render SpeedInsights component', () => {
    expect(layoutContent).toContain('<SpeedInsights')
  })

  it('should import Analytics and SpeedInsights from correct packages', () => {
    const analyticsImport = layoutContent.match(/import\s+{\s*Analytics\s*}\s+from\s+"@vercel\/analytics\/next"/);
    const speedInsightsImport = layoutContent.match(/import\s+{\s*SpeedInsights\s*}\s+from\s+"@vercel\/speed-insights\/next"/);
    
    expect(analyticsImport).toBeTruthy()
    expect(speedInsightsImport).toBeTruthy()
  })
})

describe('Analytics Package Dependencies', () => {
  const packageJsonPath = resolve(__dirname, '../package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  it('should have @vercel/analytics as a dependency', () => {
    expect(packageJson.dependencies['@vercel/analytics']).toBeDefined()
  })

  it('should have @vercel/speed-insights as a dependency', () => {
    expect(packageJson.dependencies['@vercel/speed-insights']).toBeDefined()
  })
})
