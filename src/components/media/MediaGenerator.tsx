'use client'

/**
 * MediaGenerator - UI for generating images and videos
 * Provides prompt input, size/quality options, and preview
 */

import { useState, useCallback, type KeyboardEvent } from 'react'
import { MediaPreview } from './MediaPreview'
import type {
  ImageGenerationResponse,
  VideoGenerationResponse,
  ImageSize,
  ImageQuality,
  ImageStyle
} from '@/types/media'

type MediaType = 'image' | 'video'
type GeneratedMedia = {
  type: MediaType
  data: ImageGenerationResponse | VideoGenerationResponse
}

export function MediaGenerator() {
  const [prompt, setPrompt] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [size, setSize] = useState<ImageSize>('1024x1024')
  const [quality, setQuality] = useState<ImageQuality>('standard')
  const [style, setStyle] = useState<ImageStyle>('vivid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedMedia[]>([])

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim()
    if (!trimmed || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const endpoint = mediaType === 'image'
        ? '/api/generate/image'
        : '/api/generate/video'

      const body = mediaType === 'image'
        ? { prompt: trimmed, size, quality, style }
        : { prompt: trimmed }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Generation failed')
        return
      }

      setResults(prev => [{ type: mediaType, data }, ...prev])
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, mediaType, size, quality, style, isGenerating])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }, [handleGenerate])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-sm font-medium text-zinc-900 dark:text-white">Generate Media</h2>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-1 px-4 pt-3">
        <button
          onClick={() => setMediaType('image')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mediaType === 'image'
              ? 'bg-orange-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          🖼️ Image
        </button>
        <button
          onClick={() => setMediaType('video')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mediaType === 'video'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          🎬 Video
        </button>
      </div>

      {/* Image Options */}
      {mediaType === 'image' && (
        <div className="flex flex-wrap gap-2 px-4 pt-2">
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as ImageSize)}
            className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-white"
            aria-label="Image size"
          >
            <option value="1024x1024">Square (1024×1024)</option>
            <option value="1024x1792">Portrait (1024×1792)</option>
            <option value="1792x1024">Landscape (1792×1024)</option>
          </select>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as ImageQuality)}
            className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-white"
            aria-label="Image quality"
          >
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as ImageStyle)}
            className="text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 text-zinc-900 dark:text-white"
            aria-label="Image style"
          >
            <option value="vivid">Vivid</option>
            <option value="natural">Natural</option>
          </select>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && !isGenerating && (
          <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm text-center px-8">
            {mediaType === 'image'
              ? 'Describe the image you want to create. Be specific for best results!'
              : 'Video generation is coming soon. Try image generation!'}
          </div>
        )}
        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {mediaType === 'image' ? 'Creating your image...' : 'Processing...'}
              </p>
            </div>
          </div>
        )}
        {results.map((result) => {
          const key = result.type === 'image'
            ? (result.data as import('@/types/media').ImageGenerationResponse).url
            : `${result.data.createdAt}-${result.data.prompt}`
          return <MediaPreview key={key} type={result.type} data={result.data} />
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800 text-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mediaType === 'image'
            ? 'Describe the image you want to create...'
            : 'Describe the video you want to create...'}
          disabled={isGenerating}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700
                     bg-zinc-50 dark:bg-zinc-800 px-4 py-3 text-sm
                     text-zinc-900 dark:text-white placeholder-zinc-500
                     focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white font-medium text-sm
                     hover:bg-orange-600 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
        >
          {isGenerating ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
