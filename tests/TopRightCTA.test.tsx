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

describe('TopRightCTA', () => {
    it('renders correctly with default props', () => {
        render(<TopRightCTA />)
        const link = screen.getByRole('link', { name: /Open Welcome page/i })
        expect(link).toBeDefined()
        expect(link.getAttribute('href')).toBe('/welcome')
    })

    it('renders with custom props', () => {
        render(<TopRightCTA href="/custom" label="Custom" />)
        const link = screen.getByRole('link', { name: /Open Custom page/i })
        expect(link.getAttribute('href')).toBe('/custom')
        expect(screen.getByText('Custom')).toBeDefined()
    })

    it('handles analytics on click', () => {
        render(<TopRightCTA />)
        const link = screen.getByRole('link')
        fireEvent.click(link)
        expect(analytics.track).toHaveBeenCalledWith('top_right_cta_click', expect.objectContaining({
            pr: 'top-right',
            label: 'Welcome'
        }))
    })

    it('supports new tab opening', () => {
        render(<TopRightCTA openInNewTab={true} />)
        const link = screen.getByRole('link')
        expect(link.getAttribute('target')).toBe('_blank')
        expect(link.getAttribute('rel')).toContain('noopener noreferrer')
    })
})
