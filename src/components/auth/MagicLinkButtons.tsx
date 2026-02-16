'use client'

/**
 * Magic Link Email Provider Buttons
 * Reusable buttons for quick access to Gmail and Outlook
 */

import { trackMagicLinkButtonClick } from '@/lib/analytics/events'
import { openProviderUrl } from '@/lib/analytics/providers'

interface MagicLinkButtonsProps {
  source: 'auth_modal' | 'side_panel'
  email?: string
  variant?: 'compact' | 'full'
  className?: string
}

export function MagicLinkButtons({ source, email, variant = 'compact', className = '' }: MagicLinkButtonsProps) {
  const handleClick = (provider: 'gmail' | 'outlook') => {
    trackMagicLinkButtonClick(provider, source)
    openProviderUrl(provider, email)
  }

  if (variant === 'full') {
    // Full variant for side panel
    return (
      <div className={`flex gap-3 ${className}`}>
        <button
          onClick={() => handleClick('gmail')}
          className="flex-1 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor" className="text-red-400"/>
            </svg>
            <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/90 group-hover:text-red-400 transition-colors">
            Open Gmail
          </p>
        </button>
        <button
          onClick={() => handleClick('outlook')}
          className="flex-1 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M7 9H17V11H7V9ZM7 13H17V15H7V13ZM20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM20 20H4V8L12 13L20 8V20ZM20 6L12 11L4 6V4H20V6Z" fill="currentColor" className="text-blue-400"/>
            </svg>
            <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/90 group-hover:text-blue-400 transition-colors">
            Open Outlook
          </p>
        </button>
      </div>
    )
  }

  // Compact variant for auth modal
  return (
    <div className={`flex gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => handleClick('gmail')}
        className="flex-1 py-2.5 px-4 bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all flex items-center justify-center gap-2 group"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor" className="text-red-400"/>
        </svg>
        <span className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">Gmail</span>
      </button>
      <button
        type="button"
        onClick={() => handleClick('outlook')}
        className="flex-1 py-2.5 px-4 bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all flex items-center justify-center gap-2 group"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M7 9H17V11H7V9ZM7 13H17V15H7V13ZM20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM20 20H4V8L12 13L20 8V20ZM20 6L12 11L4 6V4H20V6Z" fill="currentColor" className="text-blue-400"/>
        </svg>
        <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Outlook</span>
      </button>
    </div>
  )
}
