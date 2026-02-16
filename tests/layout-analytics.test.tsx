import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Layout Analytics', () => {
    let layoutContent: string

    beforeAll(() => {
        const layoutPath = join(__dirname, '../src/app/layout.tsx')
        layoutContent = readFileSync(layoutPath, 'utf-8')
    })

    it('imports Analytics from @vercel/analytics/next', () => {
        expect(layoutContent).toContain('import { Analytics } from "@vercel/analytics/next"')
    })

    it('imports SpeedInsights from @vercel/speed-insights/next', () => {
        expect(layoutContent).toContain('import { SpeedInsights } from "@vercel/speed-insights/next"')
    })

    it('renders Analytics component in layout', () => {
        expect(layoutContent).toContain('<Analytics />')
    })

    it('renders SpeedInsights component in layout', () => {
        expect(layoutContent).toContain('<SpeedInsights />')
    })

    it('maintains dynamic = force-dynamic export', () => {
        expect(layoutContent).toContain("export const dynamic = 'force-dynamic'")
    })
})
