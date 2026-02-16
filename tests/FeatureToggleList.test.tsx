/**
 * FeatureToggleList Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FeatureToggleList, type Feature } from '@/components/founderspass/FeatureToggleList'

describe('FeatureToggleList', () => {
  const mockFeatures: Feature[] = [
    {
      id: '1',
      feature_key: 'social.share_journey',
      label: 'Share Journey',
      description: 'Share your journey on social media',
      category: 'social',
      feature_type: 'toggle',
      default_enabled: false,
      risk_level: 'safe',
      config: { icon: '📱' },
      user_enabled: undefined,
      has_user_override: false
    },
    {
      id: '2',
      feature_key: 'communication.email_integration',
      label: 'Email Integration',
      description: 'Read and respond to emails',
      category: 'communication',
      feature_type: 'toggle',
      default_enabled: false,
      risk_level: 'dangerous',
      config: { icon: '📧' },
      user_enabled: true,
      has_user_override: true
    }
  ]

  it('renders features in the specified category', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="social"
        onToggle={onToggle}
      />
    )

    expect(screen.getByText('Share Journey')).toBeDefined()
    expect(screen.queryByText('Email Integration')).toBeNull()
  })

  it('shows risk level badges correctly', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="communication"
        onToggle={onToggle}
      />
    )

    expect(screen.getByText('DANGEROUS')).toBeDefined()
  })

  it('shows custom badge for user overrides', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="communication"
        onToggle={onToggle}
      />
    )

    expect(screen.getByText('CUSTOM')).toBeDefined()
  })

  it('displays global default and user override states', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="communication"
        onToggle={onToggle}
      />
    )

    expect(screen.getByText(/Global Default:/)).toBeDefined()
    expect(screen.getByText(/Your Override:/)).toBeDefined()
  })

  it('calls onToggle when clicking toggle switch', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="social"
        onToggle={onToggle}
      />
    )

    const toggleButton = screen.getAllByRole('button')[0]
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith(
        expect.objectContaining({ feature_key: 'social.share_journey' }),
        true // Should toggle to enabled since default is false
      )
    })
  })

  it('filters by search query', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="social"
        onToggle={onToggle}
        searchQuery="journey"
      />
    )

    expect(screen.getByText('Share Journey')).toBeDefined()
  })

  it('shows empty state when no features match', () => {
    const onToggle = vi.fn()
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="social"
        onToggle={onToggle}
        searchQuery="nonexistent"
      />
    )

    expect(screen.getByText('No features match your search')).toBeDefined()
  })

  it('shows saving state during toggle', async () => {
    const onToggle = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <FeatureToggleList
        features={mockFeatures}
        category="social"
        onToggle={onToggle}
      />
    )

    const toggleButton = screen.getAllByRole('button')[0]
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeDefined()
    })
  })

  it('uses user override value when present', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <FeatureToggleList
        features={mockFeatures}
        category="communication"
        onToggle={onToggle}
      />
    )

    // Email Integration has user_enabled: true, so toggle should be on
    const toggleButton = screen.getAllByRole('button')[0]
    expect(toggleButton.className).toContain('bg-green-500')
  })
})
