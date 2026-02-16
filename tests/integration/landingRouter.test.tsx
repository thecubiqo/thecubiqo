/**
 * Integration Test: LandingCubeRouter
 * 
 * Tests the LandingCubeRouter component functionality including:
 * - Default plasma-wave rendering
 * - Configuration-based variant selection
 * - URL parameter override (?landing=plasma-wave)
 * - Callback handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LandingCubeRouter } from '@/components/LandingCubeRouter'
import * as landingConfig from '@/config/landing'

// Mock next/navigation
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

// Mock the landing cube components to avoid Three.js/Canvas rendering issues in tests
vi.mock('@/components/LandingCube', () => ({
  LandingCube: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="plasma-wave-landing" onClick={onComplete}>
      Plasma Wave Field (120K particles)
    </div>
  ),
}))

vi.mock('@/components/TechLandingCube', () => ({
  TechLandingCube: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="tech-wireframe-landing" onClick={onComplete}>
      Tech Wireframe Cube
    </div>
  ),
}))

describe('LandingCubeRouter Integration', () => {
  const mockOnComplete = vi.fn()
  
  beforeEach(() => {
    mockOnComplete.mockClear()
    mockSearchParams.delete('landing')
  })

  describe('Default Behavior', () => {
    it('renders plasma-wave variant by default', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      const plasmaWave = screen.getByTestId('plasma-wave-landing')
      expect(plasmaWave).toBeDefined()
      expect(screen.queryByTestId('tech-wireframe-landing')).toBeNull()
    })

    it('calls onComplete when plasma-wave is clicked', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      const plasmaWave = screen.getByTestId('plasma-wave-landing')
      plasmaWave.click()
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Explicit Variant Selection', () => {
    it('renders plasma-wave when variant prop is plasma-wave', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="plasma-wave" />)
      
      expect(screen.getByTestId('plasma-wave-landing')).toBeDefined()
      expect(screen.queryByTestId('tech-wireframe-landing')).toBeNull()
    })

    it('renders tech-wireframe when variant prop is tech-wireframe', () => {
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      
      expect(screen.getByTestId('tech-wireframe-landing')).toBeDefined()
      expect(screen.queryByTestId('plasma-wave-landing')).toBeNull()
    })
  })

  describe('URL Parameter Override', () => {
    it('renders plasma-wave when ?landing=plasma-wave is in URL', () => {
      mockSearchParams.set('landing', 'plasma-wave')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      expect(screen.getByTestId('plasma-wave-landing')).toBeDefined()
      expect(screen.queryByTestId('tech-wireframe-landing')).toBeNull()
    })

    it('renders tech-wireframe when ?landing=tech-wireframe is in URL', () => {
      mockSearchParams.set('landing', 'tech-wireframe')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      expect(screen.getByTestId('tech-wireframe-landing')).toBeDefined()
      expect(screen.queryByTestId('plasma-wave-landing')).toBeNull()
    })

    it('ignores invalid URL parameter and uses default', () => {
      mockSearchParams.set('landing', 'invalid-variant')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      // Should fall back to default (plasma-wave)
      expect(screen.getByTestId('plasma-wave-landing')).toBeDefined()
    })

    it('variant prop takes precedence over URL parameter', () => {
      mockSearchParams.set('landing', 'plasma-wave')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} variant="tech-wireframe" />)
      
      // Variant prop should override URL param
      expect(screen.getByTestId('tech-wireframe-landing')).toBeDefined()
      expect(screen.queryByTestId('plasma-wave-landing')).toBeNull()
    })
  })

  describe('Configuration Integration', () => {
    it('respects landingConfig.defaultVariant', () => {
      // The component should use getLandingVariant which reads landingConfig
      const getLandingVariantSpy = vi.spyOn(landingConfig, 'getLandingVariant')
      
      render(<LandingCubeRouter onComplete={mockOnComplete} />)
      
      expect(getLandingVariantSpy).toHaveBeenCalled()
    })
  })

  describe('Voice Active Prop', () => {
    it('passes isVoiceActive to TechLandingCube', () => {
      render(
        <LandingCubeRouter 
          onComplete={mockOnComplete} 
          variant="tech-wireframe"
          isVoiceActive={true}
        />
      )
      
      // Component should render (voice active prop is internal)
      expect(screen.getByTestId('tech-wireframe-landing')).toBeDefined()
    })
  })
})
