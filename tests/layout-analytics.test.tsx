import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Layout Analytics', () => {
    it('imports Analytics from @vercel/analytics/next', () => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        const layoutContent = readFileSync(layoutPath, 'utf-8')
        
        expect(layoutContent).toContain('import { Analytics } from "@vercel/analytics/next"')
    })

    it('imports SpeedInsights from @vercel/speed-insights/next', () => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        const layoutContent = readFileSync(layoutPath, 'utf-8')
        
        expect(layoutContent).toContain('import { SpeedInsights } from "@vercel/speed-insights/next"')
    })

    it('renders Analytics component in layout', () => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        const layoutContent = readFileSync(layoutPath, 'utf-8')
        
        expect(layoutContent).toContain('<Analytics />')
    })

    it('renders SpeedInsights component in layout', () => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        const layoutContent = readFileSync(layoutPath, 'utf-8')
        
        expect(layoutContent).toContain('<SpeedInsights />')
    })

    it('maintains dynamic = force-dynamic export', () => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        const layoutContent = readFileSync(layoutPath, 'utf-8')
        
        expect(layoutContent).toContain("export const dynamic = 'force-dynamic'")
    })
})
