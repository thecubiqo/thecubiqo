/**
 * DesignSelector Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DesignSelector } from '@/components/founderspass/DesignSelector'

describe('DesignSelector', () => {
  const mockVariants = [
    {
      feature_key: 'design.plasma_wave',
      label: 'Plasma Wave Field',
      description: 'HD plasma wave animation',
      config: { icon: '🌊' },
      default_enabled: true,
      user_enabled: undefined,
      has_user_override: false
    },
    {
      feature_key: 'design.tech_wireframe',
      label: 'Tech Wireframe',
      description: 'Rotating isometric cube',
      config: { icon: '📦' },
      default_enabled: false,
      user_enabled: undefined,
      has_user_override: false
    }
  ]

  it('renders all design variants', () => {
    const onSelect = vi.fn()
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('Plasma Wave Field')).toBeDefined()
    expect(screen.getByText('Tech Wireframe')).toBeDefined()
    expect(screen.getByText('HD plasma wave animation')).toBeDefined()
  })

  it('shows active state correctly', () => {
    const onSelect = vi.fn()
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    const activeButton = screen.getByText('ACTIVE')
    expect(activeButton).toBeDefined()
  })

  it('shows custom badge for user overrides', () => {
    const customVariants = [
      { ...mockVariants[0], has_user_override: true, user_enabled: true }
    ]
    const onSelect = vi.fn()
    
    render(
      <DesignSelector
        variants={customVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('CUSTOM')).toBeDefined()
  })

  it('calls onSelect when clicking inactive variant', async () => {
    const onSelect = vi.fn().mockResolvedValue(undefined)
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    const techButton = screen.getByText('Tech Wireframe').closest('button')
    fireEvent.click(techButton!)

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('design.tech_wireframe')
    })
  })

  it('does not call onSelect when clicking active variant', () => {
    const onSelect = vi.fn()
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    const plasmaButton = screen.getByText('Plasma Wave Field').closest('button')
    fireEvent.click(plasmaButton!)

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('disables all buttons when disabled prop is true', () => {
    const onSelect = vi.fn()
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
        disabled={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button.getAttribute('disabled')).toBeDefined()
    })
  })

  it('shows activating state during selection', async () => {
    const onSelect = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <DesignSelector
        variants={mockVariants}
        activeDesign="design.plasma_wave"
        onSelect={onSelect}
      />
    )

    const techButton = screen.getByText('Tech Wireframe').closest('button')
    fireEvent.click(techButton!)

    await waitFor(() => {
      expect(screen.getByText('Activating...')).toBeDefined()
    })
  })
})
