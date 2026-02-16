/**
 * Integration Test: LandingCubeRouter
 * 
 * Tests that the LandingCubeRouter correctly routes to the appropriate
 * landing cube design based on configuration and URL parameters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LandingCubeRouter } from '@/components/LandingCubeRouter'
import * as landingConfig from '@/config/landing'

// Mock dependencies
const mockUseSearchParams = vi.fn(() => new URLSearchParams())

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="three-canvas">{children}</div>,
  useFrame: vi.fn(),
}))

vi.mock('three', () => ({
  Color: class Color {
    constructor(public value: string) {}
  },
  MathUtils: {
    lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  },
  AdditiveBlending: 2,
}))

// Mock the landing cube components
vi.mock('@/components/LandingCube', () => ({
  LandingCube: ({ onComplete }: any) => (
    <div data-testid="landing-cube-plasma">
      <button onClick={onComplete}>Complete Plasma Landing</button>
    </div>
  ),
}))

vi.mock('@/components/TechLandingCube', () => ({
  TechLandingCube: ({ onComplete, isVoiceActive }: any) => (
    <div data-testid="landing-cube-tech">
      <button onClick={onComplete}>Complete Tech Landing</button>
      <span data-testid="voice-active">{isVoiceActive ? 'active' : 'inactive'}</span>
    </div>
  ),
}))

describe('LandingCubeRouter Integration', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    mockOnComplete.mockClear()
    mockUseSearchParams.mockReturnValue(new URLSearchParams())
  })

  describe('Default Variant Routing', () => {
    it('should render plasma-wave variant by default', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      const plasmaLanding = screen.getByTestId('landing-cube-plasma')
      expect(plasmaLanding).toBeDefined()
    })

    it('should render tech-wireframe variant when specified', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      
      const techLanding = screen.getByTestId('landing-cube-tech')
      expect(techLanding).toBeDefined()
    })

    it('should render plasma-wave variant when explicitly specified', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="plasma-wave" />)
      
      const plasmaLanding = screen.getByTestId('landing-cube-plasma')
      expect(plasmaLanding).toBeDefined()
    })
  })

  describe('URL Parameter Override', () => {
    it('should respect URL parameter for plasma-wave', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('landing=plasma-wave'))

      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      const plasmaLanding = screen.getByTestId('landing-cube-plasma')
      expect(plasmaLanding).toBeDefined()
    })

    it('should respect URL parameter for tech-wireframe', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('landing=tech-wireframe'))

      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      const techLanding = screen.getByTestId('landing-cube-tech')
      expect(techLanding).toBeDefined()
    })

    it('should ignore invalid URL parameters', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('landing=invalid-variant'))

      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      // Should fall back to default (plasma-wave)
      const plasmaLanding = screen.getByTestId('landing-cube-plasma')
      expect(plasmaLanding).toBeDefined()
    })
  })

  describe('Voice Activity Props', () => {
    it('should pass isVoiceActive prop to tech-wireframe variant', () => {
      render(
        <LandingCubeRouter 
          onComplete={mockOnComplete} 
          variant="tech-wireframe"
          isVoiceActive={true}
        />
      )
      
      const voiceStatus = screen.getByTestId('voice-active')
      expect(voiceStatus.textContent).toBe('active')
    })

    it('should default isVoiceActive to false', () => {
      render(
        <LandingCubeRouter 
          onComplete={mockOnComplete} 
          variant="tech-wireframe"
        />
      )
      
      const voiceStatus = screen.getByTestId('voice-active')
      expect(voiceStatus.textContent).toBe('inactive')
    })
  })

  describe('Completion Callback', () => {
    it('should call onComplete when plasma variant completes', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="plasma-wave" />)
      
      const completeButton = screen.getByText('Complete Plasma Landing')
      completeButton.click()
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onComplete when tech variant completes', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      
      const completeButton = screen.getByText('Complete Tech Landing')
      completeButton.click()
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Configuration Integration', () => {
    it('should use getLandingVariant from config when no variant prop', () => {
      const getLandingVariantSpy = vi.spyOn(landingConfig, 'getLandingVariant')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      expect(getLandingVariantSpy).toHaveBeenCalled()
    })

    it('should prioritize variant prop over config', () => {
      const getLandingVariantSpy = vi.spyOn(landingConfig, 'getLandingVariant')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      
      // Should render tech variant regardless of config
      const techLanding = screen.getByTestId('landing-cube-tech')
      expect(techLanding).toBeDefined()
    })
  })

  describe('Rendering Stability', () => {
    it('should not crash with null searchParams', () => {
      mockUseSearchParams.mockReturnValue(null)

      expect(() => {
        render(<LandingCubeRouter onComplete={mockOnComplete} />)
      }).not.toThrow()
    })

    it('should handle multiple re-renders without issues', () => {
      const { rerender } = render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      rerender(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      rerender(<LandingCubeRouter onComplete={mockOnComplete} variant="plasma-wave" />)
      
      const plasmaLanding = screen.getByTestId('landing-cube-plasma')
      expect(plasmaLanding).toBeDefined()
    })
  })
})
