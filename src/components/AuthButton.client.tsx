'use client'

/**
 * AuthButton - Client component for Sign In / Sign Out
 *
 * Reactively displays the current auth state using the AuthContext.
 * Shows a Sign In button for guests, and user info + Sign Out for
 * authenticated users. Updates without full page refresh after
 * magic-link callback.
 */

import { useAuth } from '@/hooks/useAuth'

interface AuthButtonProps {
  /** Optional callback when sign-in button is clicked (e.g. to open a modal) */
  onSignInClick?: () => void
  /** Optional callback when the authenticated user avatar is clicked */
  onUserClick?: () => void
  /** Whether to use a dark theme variant */
  isDark?: boolean
}

export function AuthButton({ onSignInClick, onUserClick, isDark = true }: AuthButtonProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 text-[13px] text-white/30"
        data-testid="auth-button-loading"
      >
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
    )
  }

  if (isAuthenticated && user) {
    const initial = (user.email?.charAt(0) ?? '?').toUpperCase()

    return (
      <button
        onClick={onUserClick}
        className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors"
        data-testid="user-avatar-button"
        title={user.email ?? ''}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold bg-gradient-to-br from-blue-500 to-purple-600"
          data-testid="user-avatar"
        >
          {initial}
        </span>
        <span className="truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onSignInClick}
      className={`flex items-center gap-2 text-[13px] transition-colors ${isDark
          ? 'text-white/40 hover:text-white/60'
          : 'text-zinc-500 hover:text-zinc-700'
        }`}
      data-testid="sign-in-button"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
      <span className="font-medium">Sign In</span>
    </button>
  )
}
