'use client'

/**
 * FriendRequest - Incoming friend request with accept/decline buttons
 */

import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'
import type { FriendWithProfile } from '@/types/cq'

interface FriendRequestProps {
  request: FriendWithProfile
}

export function FriendRequest({ request }: FriendRequestProps) {
  const [loading, setLoading] = useState(false)
  const { acceptFriendRequest, declineFriendRequest } = useFriends()

  const handleAccept = async () => {
    setLoading(true)
    await acceptFriendRequest(request.id)
    setLoading(false)
  }

  const handleDecline = async () => {
    setLoading(true)
    await declineFriendRequest(request.id)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
          {request.friend_profile?.avatar_url ? (
            <img
              src={request.friend_profile.avatar_url}
              alt={request.friend_profile.display_name || 'User'}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <svg className="w-6 h-6 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-white font-medium text-sm">
            {request.friend_profile?.display_name || 'User'}
          </p>
          <p className="text-zinc-400 text-xs font-mono">
            {request.friend_profile?.handle}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="px-3 py-1.5 bg-[#FF6F00] text-white rounded text-xs font-medium hover:bg-[#FF8F00] disabled:opacity-50 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-700 text-white rounded text-xs font-medium hover:bg-zinc-600 disabled:opacity-50 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
