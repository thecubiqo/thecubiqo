/**
 * EnergyCubeScene Tests
 * 
 * Tests for the scene wrapper that controls wave-to-cube morph based on animation state
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EnergyCubeScene } from '../src/components/cube/EnergyCubeScene'

describe('EnergyCubeScene Speaker State Integration', () => {
  it('should render in idle state (wave mode)', () => {
    const { container } = render(
      <EnergyCubeScene animationState="idle" colorName="ORANGE" />
    )
    expect(container).toBeTruthy()
  })

  it('should render in listening state (cube mode)', () => {
    const { container } = render(
      <EnergyCubeScene animationState="listening" colorName="CYAN" />
    )
    expect(container).toBeTruthy()
  })

  it('should render in speaking state (cube mode)', () => {
    const { container } = render(
      <EnergyCubeScene animationState="speaking" colorName="GREEN" />
    )
    expect(container).toBeTruthy()
  })

  it('should render in thinking state (wave mode)', () => {
    const { container } = render(
      <EnergyCubeScene animationState="thinking" colorName="BLUE" />
    )
    expect(container).toBeTruthy()
  })
})
