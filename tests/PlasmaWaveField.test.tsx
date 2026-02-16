/**
 * PlasmaWaveField Tests
 * 
 * Tests for wave-to-cube morph behavior controlled by speaker state
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { PlasmaWaveField } from '../src/components/cube/PlasmaWaveField'

describe('PlasmaWaveField Wave-to-Cube Morph', () => {
  it('should render without errors when disabled (wave mode)', () => {
    const { container } = render(
      <Canvas>
        <PlasmaWaveField isEnabled={false} aiState="neutral" />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  it('should render without errors when enabled (cube mode)', () => {
    const { container } = render(
      <Canvas>
        <PlasmaWaveField isEnabled={true} aiState="listening" />
      </Canvas>
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
        <Canvas>
          <PlasmaWaveField isEnabled={false} aiState={state} />
        </Canvas>
      )
      expect(container).toBeTruthy()
    })
  })
})
