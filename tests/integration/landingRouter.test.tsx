import { render, screen } from '@testing-library/react'
import { LandingCubeRouter } from '@/components/LandingCubeRouter'

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('landing=plasma-wave'),
}))

// Mock children components to avoid Canvas issues in test env
jest.mock('@/components/LandingCube', () => ({
    LandingCube: () => <div data-testid="landing-cube">Plasma Wave</div>
}))

jest.mock('@/components/TechLandingCube', () => ({
    TechLandingCube: () => <div data-testid="tech-landing-cube">Tech Wireframe</div>
}))

describe('LandingCubeRouter', () => {
    it('renders plasma-wave when URL param requests it', () => {
        render(<LandingCubeRouter onComplete={jest.fn()} />)
        expect(screen.getByTestId('landing-cube')).toBeInTheDocument()
    })
})
