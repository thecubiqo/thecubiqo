/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import { PoweredByLogos, PoweredByLogosCompact } from '../PoweredByLogos'

describe('PoweredByLogos', () => {
  describe('PoweredByLogos Component', () => {
    it('renders both Claude and OpenAI logos', () => {
      render(<PoweredByLogos />)
      
      expect(screen.getByText('Claude')).toBeInTheDocument()
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
    })

    it('has correct links to official sites', () => {
      render(<PoweredByLogos />)
      
      const claudeLink = screen.getByLabelText('Powered by Claude AI')
      const openaiLink = screen.getByLabelText('Powered by OpenAI')
      
      expect(claudeLink).toHaveAttribute('href', 'https://www.anthropic.com/claude')
      expect(openaiLink).toHaveAttribute('href', 'https://openai.com')
    })

    it('opens links in new tab with security attributes', () => {
      render(<PoweredByLogos />)
      
      const links = screen.getAllByRole('link')
      
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('applies dark theme styles by default', () => {
      const { container } = render(<PoweredByLogos />)
      
      // Check if dark theme classes are present
      const poweredByText = container.querySelectorAll('.text-white\\/40')
      expect(poweredByText.length).toBeGreaterThan(0)
    })

    it('applies light theme styles when isDark=false', () => {
      const { container } = render(<PoweredByLogos isDark={false} />)
      
      // Check if light theme classes are present
      const poweredByText = container.querySelectorAll('.text-gray-500')
      expect(poweredByText.length).toBeGreaterThan(0)
    })

    it('renders in footer position by default', () => {
      const { container } = render(<PoweredByLogos />)
      
      const wrapper = container.querySelector('[data-testid="powered-by-logos"]')
      expect(wrapper).toHaveClass('inline-flex')
    })

    it('renders in corner position when specified', () => {
      const { container } = render(<PoweredByLogos position="corner" />)
      
      const wrapper = container.querySelector('[data-testid="powered-by-logos"]')
      expect(wrapper).toHaveClass('fixed')
      expect(wrapper).toHaveClass('bottom-6')
      expect(wrapper).toHaveClass('right-6')
    })
  })

  describe('PoweredByLogosCompact Component', () => {
    it('renders both Claude and OpenAI in compact format', () => {
      render(<PoweredByLogosCompact />)
      
      expect(screen.getByText('Claude')).toBeInTheDocument()
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
      
      // Should have two "Powered by" labels in compact format
      const poweredByLabels = screen.getAllByText('Powered by')
      expect(poweredByLabels).toHaveLength(2)
    })

    it('has correct links in compact format', () => {
      render(<PoweredByLogosCompact />)
      
      const claudeLink = screen.getByText('Claude').closest('a')
      const openaiLink = screen.getByText('OpenAI').closest('a')
      
      expect(claudeLink).toHaveAttribute('href', 'https://www.anthropic.com/claude')
      expect(openaiLink).toHaveAttribute('href', 'https://openai.com')
    })

    it('renders with data-testid for testing', () => {
      const { container } = render(<PoweredByLogosCompact />)
      
      const wrapper = container.querySelector('[data-testid="powered-by-logos-compact"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('applies dark theme by default in compact mode', () => {
      const { container } = render(<PoweredByLogosCompact />)
      
      const poweredByText = container.querySelectorAll('.text-white\\/30')
      expect(poweredByText.length).toBeGreaterThan(0)
    })

    it('applies light theme in compact mode when isDark=false', () => {
      const { container } = render(<PoweredByLogosCompact isDark={false} />)
      
      const poweredByText = container.querySelectorAll('.text-gray-400')
      expect(poweredByText.length).toBeGreaterThan(0)
    })
  })
})
