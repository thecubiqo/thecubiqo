/**
 * PlasmaWaveField Tests
 * 
 * Tests for wave-to-cube morph behavior controlled by speaker state.
 * 
 * NOTE: PlasmaWaveField now uses vanilla Three.js (not R3F), so we test
 * it as a standalone component without Canvas wrapper.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PlasmaWaveField } from '../src/components/cube/PlasmaWaveField'

describe('PlasmaWaveField Wave-to-Cube Morph', () => {
  it('should render without errors when disabled (wave mode)', () => {
    const { container } = render(
      <PlasmaWaveField isEnabled={false} aiState="neutral" />
    )
    expect(container).toBeTruthy()
  })

  it('should render without errors when enabled (cube mode)', () => {
    const { container } = render(
      <PlasmaWaveField isEnabled={true} aiState="listening" />
    )
    expect(container).toBeTruthy()
  })

  it('should accept different AI states', () => {
    const states: Array<'neutral' | 'thinking' | 'speaking' | 'listening' | 'error'> = [
      'neutral',
      'thinking',
      'speaking',
      'listening',
      'error'
    ]

    states.forEach(state => {
      const { container } = render(
        <PlasmaWaveField isEnabled={false} aiState={state} />
      )
      expect(container).toBeTruthy()
    })
  })

  it('should have a container div with correct test id', () => {
    const { container } = render(
      <PlasmaWaveField isEnabled={false} aiState="neutral" />
    )
    const divElement = container.querySelector('[data-testid="plasma-wave-field"]')
    expect(divElement).toBeTruthy()
  })
})
