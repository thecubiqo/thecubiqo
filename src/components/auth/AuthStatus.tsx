'use client'

/**
 * Auth Status Component
 * Displays current authentication state
 */

import { useAuth } from '@/hooks/useAuth'
import { useSession } from '@/hooks/useSession'

export function AuthStatus() {
  const { user, profile, isLoading: authLoading, isAuthenticated, signOut } = useAuth()
  const { session, isLoading: sessionLoading, isGuest } = useSession()

  if (authLoading || sessionLoading) {
    return (
      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg space-y-4">
      <h3 className="font-semibold text-zinc-900 dark:text-white">Auth Status</h3>

      <div className="space-y-2 text-sm">
        {/* Authentication Status */}
        <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">Status:</span>
          <span
            className={`font-medium ${
              isAuthenticated
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {isAuthenticated ? 'Authenticated' : 'Guest'}
          </span>
        </div>

        {/* Session Info */}
        {session && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Session ID:</span>
              <span className="font-mono text-xs text-zinc-900 dark:text-white">
                {session.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Session Type:</span>
              <span className="text-zinc-900 dark:text-white">
                {isGuest ? 'Guest' : 'User'}
              </span>
            </div>
            {session.expires_at && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Expires:</span>
                <span className="text-zinc-900 dark:text-white">
                  {new Date(session.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        {/* User Info */}
        {user && (
          <>
            <hr className="border-zinc-200 dark:border-zinc-700" />
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Email:</span>
              <span className="text-zinc-900 dark:text-white">{user.email}</span>
            </div>
          </>
        )}

        {/* Profile Info */}
        {profile && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Handle:</span>
              <span className="font-mono text-zinc-900 dark:text-white">
                {profile.handle}
              </span>
            </div>
            {profile.display_name && (
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Name:</span>
                <span className="text-zinc-900 dark:text-white">
                  {profile.display_name}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sign Out Button */}
      {isAuthenticated && (
        <button
          onClick={() => signOut()}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-lg
                     hover:bg-red-700 transition-colors text-sm"
        >
          Sign Out
        </button>
      )}
    </div>
  )
}
