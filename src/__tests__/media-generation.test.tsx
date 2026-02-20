/**
 * Media Generation Tests
 * Tests for image/video generation API routes and components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MediaGenerator } from '@/components/media/MediaGenerator'
import { MediaPreview } from '@/components/media/MediaPreview'
import type { ImageGenerationResponse, VideoGenerationResponse } from '@/types/media'

// --- Mock fetch globally ---
const mockFetch = vi.fn()
global.fetch = mockFetch

// --- MediaPreview Tests ---

describe('MediaPreview', () => {
  it('renders image preview with metadata', () => {
    const imageData: ImageGenerationResponse = {
      url: 'https://example.com/generated-image.png',
      prompt: 'a sunset over mountains',
      revisedPrompt: 'A beautiful sunset over majestic mountain peaks',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      provider: 'openai',
      createdAt: new Date().toISOString()
    }

    render(<MediaPreview type="image" data={imageData} />)

    // Check image is rendered
    const img = screen.getByAltText('A beautiful sunset over majestic mountain peaks')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/generated-image.png')

    // Check metadata is shown
    expect(screen.getByText('1024x1024')).toBeInTheDocument()
    expect(screen.getByText('standard')).toBeInTheDocument()
    expect(screen.getByText('vivid')).toBeInTheDocument()

    // Check open full size link
    expect(screen.getByText('Open full size ↗')).toHaveAttribute('href', 'https://example.com/generated-image.png')
  })

  it('renders video coming soon status', () => {
    const videoData: VideoGenerationResponse = {
      status: 'pending',
      message: 'Video generation is coming soon.',
      prompt: 'a cat playing piano',
      createdAt: new Date().toISOString()
    }

    render(<MediaPreview type="video" data={videoData} />)

    expect(screen.getByText('🎬 Coming Soon')).toBeInTheDocument()
    expect(screen.getByText('Video generation is coming soon.')).toBeInTheDocument()
  })
})

// --- MediaGenerator Tests ---

describe('MediaGenerator', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('renders the generator with image tab selected by default', () => {
    render(<MediaGenerator />)

    expect(screen.getByText('Generate Media')).toBeInTheDocument()
    expect(screen.getByText('🖼️ Image')).toBeInTheDocument()
    expect(screen.getByText('🎬 Video')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe the image you want to create...')).toBeInTheDocument()
  })

  it('switches to video tab and updates placeholder', () => {
    render(<MediaGenerator />)

    fireEvent.click(screen.getByText('🎬 Video'))

    expect(screen.getByPlaceholderText('Describe the video you want to create...')).toBeInTheDocument()
  })

  it('shows image options when image tab is selected', () => {
    render(<MediaGenerator />)

    // Should show size, quality, and style selects
    expect(screen.getByLabelText('Image size')).toBeInTheDocument()
    expect(screen.getByLabelText('Image quality')).toBeInTheDocument()
    expect(screen.getByLabelText('Image style')).toBeInTheDocument()
  })

  it('hides image options when video tab is selected', () => {
    render(<MediaGenerator />)

    fireEvent.click(screen.getByText('🎬 Video'))

    expect(screen.queryByLabelText('Image size')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Image quality')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Image style')).not.toBeInTheDocument()
  })

  it('disables generate button when prompt is empty', () => {
    render(<MediaGenerator />)

    const buttons = screen.getAllByRole('button')
    const generateButton = buttons[buttons.length - 1] // Last button is generate
    expect(generateButton).toBeDisabled()
  })

  it('calls image generation API and shows result', async () => {
    const mockResponse: ImageGenerationResponse = {
      url: 'https://example.com/image.png',
      prompt: 'a cat',
      revisedPrompt: 'A cute cat sitting',
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      provider: 'openai',
      createdAt: new Date().toISOString()
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    render(<MediaGenerator />)

    const textarea = screen.getByPlaceholderText('Describe the image you want to create...')
    fireEvent.change(textarea, { target: { value: 'a cat' } })

    const buttons = screen.getAllByRole('button')
    const generateButton = buttons[buttons.length - 1]
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/generate/image', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'a cat',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      }))
    })

    // Result should appear
    await waitFor(() => {
      expect(screen.getByAltText('A cute cat sitting')).toBeInTheDocument()
    })
  })

  it('shows error message when generation fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Rate limit exceeded' })
    })

    render(<MediaGenerator />)

    const textarea = screen.getByPlaceholderText('Describe the image you want to create...')
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    const buttons = screen.getAllByRole('button')
    const generateButton = buttons[buttons.length - 1]
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument()
    })
  })

  it('can dismiss error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Something went wrong' })
    })

    render(<MediaGenerator />)

    const textarea = screen.getByPlaceholderText('Describe the image you want to create...')
    fireEvent.change(textarea, { target: { value: 'test' } })

    const buttons = screen.getAllByRole('button')
    const generateButton = buttons[buttons.length - 1]
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Dismiss'))

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
