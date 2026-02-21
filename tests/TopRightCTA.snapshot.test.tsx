import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { TopRightCTA } from '@/components/TopRightCTA.client'

// Mock framer-motion for stable snapshot output
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, style }: any) => (
            <div className={className} style={style}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: any) => children,
}))

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>{children}</a>
    ),
}))

describe('TopRightCTA Snapshots', () => {
    it('matches desktop snapshot', () => {
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })

    it('matches mobile snapshot (simulated constraints)', () => {
        // Tailwind classes handle responsive breakpoints at runtime;
        // snapshot captures the same DOM structure with md: utility classes.
        const { container } = render(<TopRightCTA />)
        expect(container).toMatchSnapshot()
    })
})
