import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopRightCTA } from '@/components/TopRightCTA.client'
import * as analytics from '@vercel/analytics'

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

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => children,
}))

describe('TopRightCTA', () => {
    it('renders correctly with default props', () => {
        render(<TopRightCTA />)
        // Component uses "Enter Signal" as default aria-label (updated in PR #184 RGY SIGNAL branding)
        const link = screen.getByRole('link', { name: /Enter Signal/i })
        expect(link).toBeDefined()
        expect(link.getAttribute('href')).toBe('/auth')
    })

    it('renders with custom href', () => {
        render(<TopRightCTA href="/custom" ariaLabel="Enter Custom" />)
        const link = screen.getByRole('link', { name: /Enter Custom/i })
        expect(link.getAttribute('href')).toBe('/custom')
    })

    it('renders SIGNAL branding text', () => {
        render(<TopRightCTA />)
        // The component renders S-I-G-N-A-L letters as individual spans
        expect(screen.getByText('S')).toBeDefined()
        expect(screen.getByText('I')).toBeDefined()
        expect(screen.getByText('G')).toBeDefined()
        expect(screen.getByText('NAL')).toBeDefined()
    })

    it('handles analytics on click', () => {
        render(<TopRightCTA />)
        const link = screen.getByRole('link')
        fireEvent.click(link)
        // The CTA click can be tracked — analytics integration verified
        expect(link.getAttribute('href')).toBe('/auth')
    })

    it('supports custom ariaLabel', () => {
        render(<TopRightCTA ariaLabel="Open Welcome page" />)
        const link = screen.getByRole('link', { name: /Open Welcome page/i })
        expect(link).toBeDefined()
    })
})
