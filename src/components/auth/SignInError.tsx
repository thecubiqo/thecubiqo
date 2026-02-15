'use client'

/**
 * Sign In Error Component
 * Displays authentication errors with proper styling and context
 */

import { isRateLimitError } from '@/lib/auth/utils'

interface SignInErrorProps {
  error: string | null
  onDismiss: () => void
}

export function SignInError({ error, onDismiss }: SignInErrorProps) {
  if (!error) return null

  const isRateLimit = isRateLimitError(error)

  return (
    <div 
      className={`p-4 rounded-[12px] border ${
        isRateLimit 
          ? 'bg-yellow-500/10 border-yellow-500/20' 
          : 'bg-red-500/10 border-red-500/20'
      }`}
    >
      <div className={`text-sm font-medium ${isRateLimit ? 'text-yellow-400' : 'text-red-400'}`}>
        {isRateLimit ? '⏱️ Rate Limited' : '❌ Sign In Error'}
      </div>
      <p className={`text-sm mt-1 ${isRateLimit ? 'text-yellow-300/90' : 'text-red-300/90'}`}>
        {error}
      </p>
      {isRateLimit && (
        <p className="text-xs mt-2 text-yellow-300/70">
          This is a security measure. Please wait a few minutes before trying again.
        </p>
      )}
      <button
        onClick={onDismiss}
        className="text-xs mt-2 underline text-white/60 hover:text-white/80 transition-colors"
      >
        Dismiss
      </button>
    </div>
  )
}
