'use client'

/**
 * FriendsList - Shows list of friends with their CQ numbers and online status
 */

import { useFriends } from '@/hooks/useFriends'
import type { FriendWithProfile } from '@/types/cq'
import { UnreadBadge } from './UnreadBadge'

interface FriendsListProps {
  onSelectFriend: (friendId: string, friendProfile: FriendWithProfile) => void
  selectedFriendId?: string
  unreadCounts?: Record<string, number>
}

export function FriendsList({ onSelectFriend, selectedFriendId, unreadCounts = {} }: FriendsListProps) {
  const { friends, loading } = useFriends()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-400 text-sm">
        Loading friends...
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-zinc-400 text-sm text-center">
        <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>No friends yet</p>
        <p className="text-xs mt-1">Add friends by their CQ number above</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {friends.map((friend) => {
        const unreadCount = unreadCounts[friend.friend_id] || 0
        const isSelected = selectedFriendId === friend.friend_id

        return (
          <button
            key={friend.id}
            onClick={() => onSelectFriend(friend.friend_id, friend)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isSelected
                ? 'bg-[#FF6F00]/20 border border-[#FF6F00]/50'
                : 'bg-zinc-800/30 hover:bg-zinc-800/50'
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                {friend.friend_profile?.avatar_url ? (
                  <img
                    src={friend.friend_profile.avatar_url}
                    alt={friend.friend_profile.display_name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <svg className="w-6 h-6 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              {/* Online status indicator - placeholder for now */}
              {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div> */}
            </div>

            <div className="flex-1 text-left">
              <p className="text-white font-medium text-sm">
                {friend.friend_profile?.display_name || 'User'}
              </p>
              <p className="text-zinc-400 text-xs font-mono">
                {friend.friend_profile?.handle}
              </p>
            </div>

            {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
          </button>
        )
      })}
    </div>
  )
}
