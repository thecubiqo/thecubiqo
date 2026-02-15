'use client'

/**
 * CallControls - Audio/Video call placeholder buttons
 * Architecture placeholder for future WebRTC implementation
 */

import { useState } from 'react'

/**
 * Future WebRTC Architecture (Placeholder):
 * 
 * 1. Signaling Server:
 *    - Use Supabase Realtime for signaling (offer/answer/ICE candidates)
 *    - Create a new table: call_signals (id, caller_id, callee_id, signal_type, signal_data, created_at)
 * 
 * 2. STUN/TURN Servers:
 *    - Use free STUN servers: stun:stun.l.google.com:19302
 *    - For TURN (NAT traversal), consider services like Twilio, Metered, or self-hosted coturn
 * 
 * 3. WebRTC Implementation:
 *    - Create useWebRTC hook for managing peer connections
 *    - Handle offer/answer SDP exchange
 *    - Handle ICE candidate exchange
 *    - Manage local/remote media streams
 * 
 * 4. UI Components:
 *    - CallScreen: Full-screen calling interface
 *    - VideoTile: Video stream display with controls
 *    - CallNotification: Incoming call notification
 * 
 * 5. Security:
 *    - Verify friendship before allowing calls
 *    - Implement call permissions and blocking
 *    - Add call history logging
 */

export function CallControls() {
  const [showTooltip, setShowTooltip] = useState<'audio' | 'video' | null>(null)

  return (
    <div className="flex gap-2">
      {/* Audio Call */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip('audio')}
          onMouseLeave={() => setShowTooltip(null)}
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-not-allowed opacity-50"
          disabled
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>
        {showTooltip === 'audio' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
            Coming Soon
          </div>
        )}
      </div>

      {/* Video Call */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip('video')}
          onMouseLeave={() => setShowTooltip(null)}
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-not-allowed opacity-50"
          disabled
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
        {showTooltip === 'video' && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
            Coming Soon
          </div>
        )}
      </div>
    </div>
  )
}
