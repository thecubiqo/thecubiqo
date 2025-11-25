'use client'

/**
 * CubiQoApp - Main application with Cube + Chat integration
 */

import { useState, useCallback } from 'react'
import { CubeScene } from './cube'
import { ChatContainer } from './chat'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'

export function CubiQoApp() {
  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')

  const handleColorChange = useCallback((newColor: ColorName) => {
    setColorName(newColor)
  }, [])

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setAnimationState(isSpeaking ? 'speaking' : 'idle')
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            CubiQo
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            One Mind. Many Dimensions.
          </p>
        </div>

        {/* Main Content - Cube + Chat */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Cube Section */}
          <div className="order-1 lg:order-1">
            <div className="w-full h-[350px] rounded-lg overflow-hidden bg-black">
              <CubeScene colorName={colorName} animationState={animationState} />
            </div>

            {/* Color Indicator */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Current mood:</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{
                  backgroundColor:
                    colorName === 'RED' ? '#C2185B' :
                    colorName === 'YELLOW' ? '#FFA000' :
                    colorName === 'GREEN_BLUE' ? '#00897B' :
                    '#FF6F00'
                }}
              >
                {colorName === 'GREEN_BLUE' ? 'Sattva' :
                 colorName === 'ORANGE' ? 'Fourth Way' :
                 colorName === 'RED' ? 'Tamas' : 'Rajas'}
              </span>
            </div>
          </div>

          {/* Chat Section */}
          <div className="order-2 lg:order-2">
            <ChatContainer
              currentColor={colorName}
              onColorChange={handleColorChange}
              onSpeakingChange={handleSpeakingChange}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              Next.js 16
            </span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              React 19
            </span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              Claude AI
            </span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              R3F
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
