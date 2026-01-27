'use client'

/**
 * CubeDemo - Interactive demo of the Cube with controls
 */

import { useState } from 'react'
import { CubeScene } from './CubeScene'
import type { AnimationState } from './Cube'
import type { ColorName } from '@/config/colors'

const COLORS: ColorName[] = ['ORANGE', 'YELLOW', 'GREEN_BLUE', 'RED']
const STATES: AnimationState[] = ['idle', 'listening', 'thinking', 'speaking']

export function CubeDemo() {
  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')

  return (
    <div className="w-full">
      {/* Cube Canvas */}
      <div className="w-full h-[400px] rounded-lg overflow-hidden bg-black">
        <CubeScene colorName={colorName} animationState={animationState} />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Color Buttons */}
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setColorName(color)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: 
                    color === 'RED' ? '#C2185B' :
                    color === 'YELLOW' ? '#FFA000' :
                    color === 'GREEN_BLUE' ? '#00897B' :
                    '#FF6F00',
                  color: 'white',
                  opacity: colorName === color ? 1 : 0.7,
                  boxShadow: colorName === color ? '0 0 0 2px white' : 'none',
                }}
              >
                {color === 'GREEN_BLUE' ? 'SATTVA' : color === 'ORANGE' ? 'FOURTH WAY' : color}
              </button>
            ))}
          </div>
        </div>

        {/* State Buttons */}
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Animation State</p>
          <div className="flex flex-wrap gap-2">
            {STATES.map((state) => (
              <button
                key={state}
                onClick={() => setAnimationState(state)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  animationState === state
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
