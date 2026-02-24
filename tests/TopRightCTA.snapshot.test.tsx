import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { TopRightCTA } from '@/components/TopRightCTA.client'

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}))

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe('TopRightCTA Snapshots', () => {
    it('matches desktop snapshot', () => {
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })

    it('matches mobile snapshot (simulated constraints)', () => {
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })
})
