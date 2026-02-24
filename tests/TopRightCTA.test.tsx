import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopRightCTA } from '@/components/TopRightCTA.client'

// Mock dependencies
vi.mock('@vercel/analytics', () => ({
    track: vi.fn(),
}))

vi.mock('next/link', () => ({
    default: ({ children, href, onClick, ...props }: any) => (
        <a href={href} onClick={onClick} {...props}>
            {children}
        </a>
    ),
}))

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}))

describe('TopRightCTA', () => {
    it('renders correctly with default props', () => {
        render(<TopRightCTA />)
        const link = screen.getByRole('link', { name: /Enter Signal/i })
        expect(link).toBeDefined()
        expect(link.getAttribute('href')).toBe('/auth')
    })

    it('renders with custom props', () => {
        render(<TopRightCTA href="/custom" ariaLabel="Custom Label" />)
        const link = screen.getByRole('link', { name: /Custom Label/i })
        expect(link.getAttribute('href')).toBe('/custom')
    })

    it('contains SIGNAL branding text', () => {
        render(<TopRightCTA />)
        expect(screen.getByText('S')).toBeDefined()
        expect(screen.getByText('NAL')).toBeDefined()
    })

    it('renders with default aria-label', () => {
        render(<TopRightCTA />)
        const link = screen.getByRole('link')
        expect(link.getAttribute('aria-label')).toBe('Enter Signal')
    })
})
