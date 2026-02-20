'use client'

/**
 * CallControls - Audio/Video call controls with camera switching
 * Includes front/back camera toggle for mobile devices
 */

import { useState } from 'react'

interface CallControlsProps {
  isInCall?: boolean;
  callType?: 'audio' | 'video' | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
  facingMode?: 'user' | 'environment';
  onToggleMute?: () => void;
  onToggleCamera?: () => void;
  onSwitchCamera?: () => void;
  onEndCall?: () => void;
}

export function CallControls({
  isInCall = false,
  callType = null,
  isMuted = false,
  isCameraOff = false,
  facingMode = 'user',
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onEndCall,
}: CallControlsProps) {
  const [showTooltip, setShowTooltip] = useState<'audio' | 'video' | 'switch' | null>(null)

  if (!isInCall) {
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

  return (
    <div className="flex gap-2 items-center">
      {/* Mute Toggle */}
      <button
        onClick={onToggleMute}
        className={`p-2 rounded-lg transition-colors ${
          isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'
        }`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMuted ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
      </button>

      {/* Camera Toggle (video calls only) */}
      {callType === 'video' && (
        <button
          onClick={onToggleCamera}
          className={`p-2 rounded-lg transition-colors ${
            isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* Switch Camera (front/back toggle - video calls only) */}
      {callType === 'video' && !isCameraOff && (
        <div className="relative">
          <button
            onClick={onSwitchCamera}
            onMouseEnter={() => setShowTooltip('switch')}
            onMouseLeave={() => setShowTooltip(null)}
            className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
            aria-label={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {showTooltip === 'switch' && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
              {facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
            </div>
          )}
        </div>
      )}

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        aria-label="End call"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>
    </div>
  )
}
