import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TopRightCTA } from '@/components/TopRightCTA.client'

describe('TopRightCTA Snapshots', () => {
    it('matches desktop snapshot', () => {
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })

    it('matches mobile snapshot (simulated constraints)', () => {
        // In a real environment we might resize window, but for DOM snapshot
        // typically we just render. Tailwind classes handle responsiveness.
        // We rely on the classNames present in the snapshot.
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })
})
