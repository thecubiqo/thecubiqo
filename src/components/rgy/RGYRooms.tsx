'use client'

/**
 * RGY Rooms Browser - COMPLETE IMPLEMENTATION
 * Browse and join chat rooms based on color:intent:keywords
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { capsuleManager, type ChatRoom, type Color, type Intent } from '@/lib/rgy/capsule-manager'

interface RGYRoomsProps {
  isOpen: boolean
  onClose: () => void
}

const COLOR_CONFIG = {
  green: { name: 'Green', bg: '#00897b', light: '#00897b15', border: '#00897b30' },
  yellow: { name: 'Yellow', bg: '#ffa000', light: '#ffa00015', border: '#ffa00030' },
  red: { name: 'Red', bg: '#c2185b', light: '#c2185b15', border: '#c2185b30' },
}

export function RGYRooms({ isOpen, onClose }: RGYRoomsProps) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null)

  useEffect(() => {
    if (isOpen && user) loadRooms()
  }, [isOpen, selectedColor, selectedIntent])

  const loadRooms = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      if (selectedColor) filters.color = selectedColor
      if (selectedIntent) filters.intent = selectedIntent
      const data = await capsuleManager.getChatRooms(filters)
      setRooms(data)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (room: ChatRoom) => {
    if (!user) return
    try {
      await capsuleManager.joinRoom(room.id, user.id)
      alert(`Joined room: ${room.name}`)
    } catch (error) {
      console.error('Failed to join room:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-4xl h-[90vh] bg-zinc-900 rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-light text-white">RGY Rooms</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-2 block">Color</label>
              <div className="flex gap-2">
                <button onClick={() => setSelectedColor(null)} className={`px-4 py-2 rounded-lg text-sm ${!selectedColor ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>All</button>
                {(['green', 'yellow', 'red'] as Color[]).map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-lg text-sm ${selectedColor === color ? 'text-white' : 'text-zinc-400'}`} style={{ background: selectedColor === color ? COLOR_CONFIG[color].bg : COLOR_CONFIG[color].light, border: `1px solid ${COLOR_CONFIG[color].border}` }}>
                    {COLOR_CONFIG[color].name}
                  </button>
                ))}
              </div>
            </div>
            {selectedColor && selectedColor !== 'yellow' && (
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Intent</label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedIntent(null)} className={`px-4 py-2 rounded-lg text-sm ${!selectedIntent ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>All</button>
                  {(['collaborate', 'trade', 'company'] as Intent[]).map(intent => (
                    <button key={intent} onClick={() => setSelectedIntent(intent)} className={`px-4 py-2 rounded-lg text-sm ${selectedIntent === intent ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                      {intent.charAt(0).toUpperCase() + intent.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-400">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <p>No rooms found</p>
              <p className="text-sm mt-2">Try different filters or create a room</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]" style={{ background: COLOR_CONFIG[room.color].light, border: `2px solid ${COLOR_CONFIG[room.color].border}` }} onClick={() => handleJoinRoom(room)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-white">{room.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: COLOR_CONFIG[room.color].bg, color: 'white' }}>{COLOR_CONFIG[room.color].name}</span>
                        {room.intent && <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">{room.intent}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">{room.participant_count}/{room.max_participants}</div>
                      <div className="text-xs text-zinc-500">participants</div>
                    </div>
                  </div>
                  {room.keywords && room.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(room.keywords as string[]).slice(0, 5).map((keyword, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">{keyword}</span>
                      ))}
                    </div>
                  )}
                  {room.is_geofenced && (
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>Location-based ({room.radius_km}km)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
