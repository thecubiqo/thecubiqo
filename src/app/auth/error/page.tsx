'use client'

/**
 * Auth Error Page
 * Displays authentication errors with retry option
 */

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  const error = searchParams.get('error') || 'unknown_error'
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth_callback_failed':
        return {
          title: 'Authentication Failed',
          description: 'We couldn\'t verify your magic link. It may have expired or already been used.',
          suggestion: 'Please request a new magic link to sign in.'
        }
      case 'invalid_code':
        return {
          title: 'Invalid Link',
          description: 'The authentication link is invalid or has expired.',
          suggestion: 'Please request a new magic link.'
        }
      case 'session_error':
        return {
          title: 'Session Error',
          description: 'There was an error creating your session.',
          suggestion: 'Please try signing in again.'
        }
      default:
        return {
          title: 'Authentication Error',
          description: 'Something went wrong during authentication.',
          suggestion: 'Please try again or contact support if the issue persists.'
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  const handleRetry = () => {
    router.push('/')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div 
          className="rounded-[24px] px-8 py-10"
          style={{
            background: 'rgba(38,38,40,0.95)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08)'
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <svg 
                className="w-8 h-8 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[24px] font-normal text-white/90 text-center mb-3 tracking-tight">
            {errorInfo.title}
          </h1>

          {/* Description */}
          <p className="text-[15px] text-white/60 text-center mb-2">
            {errorInfo.description}
          </p>

          <p className="text-[13px] text-white/40 text-center mb-8">
            {errorInfo.suggestion}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-3.5 rounded-[12px] bg-white text-gray-900 text-[15px] font-medium transition-opacity hover:opacity-85"
            >
              Back to Home
            </button>

            <button
              onClick={() => router.push('/?signin=true')}
              className="w-full py-3.5 rounded-[12px] text-[15px] font-medium transition-opacity hover:opacity-85"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Try Signing In Again
            </button>
          </div>

          {/* Error Code (for debugging) */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[11px] text-white/25 text-center font-mono">
              Error: {error}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-white/25 mt-6">
          Need help? Contact support at{' '}
          <a 
            href="mailto:support@cubiqo.ai" 
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            support@cubiqo.ai
          </a>
        </p>
      </div>
    </div>
  )
}
