'use client'

/**
 * AddFriend - Input field to search and add a friend by CQ number
 */

import { useState } from 'react'
import { useFriends } from '@/hooks/useFriends'

export function AddFriend() {
  const [cqNumber, setCqNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { sendFriendRequest } = useFriends()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cqNumber.trim()) return

    setLoading(true)
    setMessage(null)

    const success = await sendFriendRequest(cqNumber.trim().toUpperCase())

    if (success) {
      setMessage({ type: 'success', text: 'Friend request sent!' })
      setCqNumber('')
    } else {
      setMessage({ type: 'error', text: 'Failed to send request. User may not exist or request already sent.' })
    }

    setLoading(false)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={cqNumber}
          onChange={(e) => setCqNumber(e.target.value.toUpperCase())}
          placeholder="CQA7B"
          maxLength={5}
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF6F00] font-mono text-sm uppercase"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !cqNumber.trim()}
          className="px-4 py-2 bg-[#FF6F00] text-white rounded-lg hover:bg-[#FF8F00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>

      {message && (
        <div
          className={`text-xs p-2 rounded ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
