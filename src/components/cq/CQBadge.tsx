'use client'

/**
 * CQBadge - Displays user's CQ number with copy functionality
 */

import { useState } from 'react'
import { useCQNumber } from '@/hooks/useCQNumber'

interface CQBadgeProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CQBadge({ showLabel = true, size = 'md' }: CQBadgeProps) {
  const { currentCQ, copyCQ } = useCQNumber()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyCQ()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!currentCQ) return null

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {showLabel && (
        <span className="text-xs text-zinc-400 uppercase tracking-wider">
          Your CQ Number
        </span>
      )}
      <button
        onClick={handleCopy}
        className={`font-mono ${sizeClasses[size]} font-bold text-[#FF6F00] hover:text-[#FF8F00] transition-colors relative group`}
        title="Click to copy"
      >
        {currentCQ}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
            Copied!
          </span>
        )}
        <svg
          className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  )
}
