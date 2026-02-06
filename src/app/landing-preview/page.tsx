'use client'

import { TechLandingCube } from '@/components/TechLandingCube'
import { useState } from 'react'

export default function LandingPreview() {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  
  return (
    <div className="relative">
      <TechLandingCube 
        onComplete={() => console.log('Landing complete')}
        isVoiceActive={isVoiceActive}
      />
      
      {/* Test controls */}
      <div className="fixed bottom-4 left-4 z-[200] bg-black/80 p-4 rounded-lg">
        <button
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          {isVoiceActive ? 'Stop Voice' : 'Test Voice Reaction'}
        </button>
      </div>
    </div>
  )
}
