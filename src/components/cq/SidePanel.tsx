'use client'

/**
 * SidePanel - Main CQ communication panel
 * Shows CQ number, friends list, friend requests, and chat window
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFriends } from '@/hooks/useFriends'
import { useDirectMessages } from '@/hooks/useDirectMessages'
import { CQBadge } from './CQBadge'
import { AddFriend } from './AddFriend'
import { FriendsList } from './FriendsList'
import { FriendRequest } from './FriendRequest'
import { ChatWindow } from './ChatWindow'
import type { FriendWithProfile } from '@/types/cq'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { user } = useAuth()
  const { pendingRequests } = useFriends()
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  
  // Get unread counts for all friends
  const { unreadCount } = useDirectMessages()

  useEffect(() => {
    // Close chat when panel closes
    if (!isOpen) {
      setSelectedFriend(null)
    }
  }, [isOpen])

  if (!user) return null

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedFriend ? (
          // Chat view
          <ChatWindow
            friend={selectedFriend}
            currentUserId={user.id}
            onBack={() => setSelectedFriend(null)}
          />
        ) : (
          // Friends list view
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">CQ Connect</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* CQ Badge */}
              <CQBadge size="lg" />
            </div>

            {/* Add Friend */}
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-3">
                Add Friend
              </h3>
              <AddFriend />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'friends'
                    ? 'text-[#FF6F00]'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Friends
                {activeTab === 'friends' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6F00]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'requests'
                    ? 'text-[#FF6F00]'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-1 bg-[#FF6F00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
                {activeTab === 'requests' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6F00]" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'friends' ? (
                <FriendsList
                  onSelectFriend={(friendId, friend) => setSelectedFriend(friend)}
                  selectedFriendId={selectedFriend?.friend_id}
                />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 text-sm text-center">
                      <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No pending requests</p>
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <FriendRequest key={request.id} request={request} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
