'use client'

/**
 * MediaPreview - Displays generated images and video status
 */

import type { ImageGenerationResponse, VideoGenerationResponse } from '@/types/media'

interface MediaPreviewProps {
  type: 'image' | 'video'
  data: ImageGenerationResponse | VideoGenerationResponse
}

export function MediaPreview({ type, data }: MediaPreviewProps) {
  if (type === 'image') {
    const imageData = data as ImageGenerationResponse
    return (
      <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageData.url}
            alt={imageData.revisedPrompt || imageData.prompt}
            className="w-full h-auto max-h-[512px] object-contain bg-zinc-100 dark:bg-zinc-800"
            loading="lazy"
          />
        </div>
        <div className="p-3 space-y-1">
          {imageData.revisedPrompt && imageData.revisedPrompt !== imageData.prompt && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
              Enhanced: {imageData.revisedPrompt}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{imageData.size}</span>
            <span>•</span>
            <span>{imageData.quality}</span>
            <span>•</span>
            <span>{imageData.style}</span>
          </div>
          <a
            href={imageData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-orange-500 hover:text-orange-600 mt-1"
          >
            Open full size ↗
          </a>
        </div>
      </div>
    )
  }

  // Video status display
  const videoData = data as VideoGenerationResponse
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {videoData.status === 'pending' ? '🎬 Coming Soon' : videoData.status}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {videoData.message}
          </p>
        </div>
      </div>
    </div>
  )
}
