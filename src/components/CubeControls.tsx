'use client'

/**
 * CubeControls - UI controls for cube customization
 * Allows users to:
 * - Adjust cube size (scale)
 * - Toggle between cube shapes (Energy Cube vs Isometric Diamond)
 * - Show/hide eyes (when applicable)
 */

import { useState, useEffect } from 'react'

export type CubeShape = 'energy' | 'isometric'

interface CubeControlsProps {
  cubeSize: number
  onSizeChange: (size: number) => void
  shapeType: CubeShape
  onShapeChange: (shape: CubeShape) => void
  showEyes: boolean
  onEyesToggle: (show: boolean) => void
}

export function CubeControls({
  cubeSize,
  onSizeChange,
  shapeType,
  onShapeChange,
  showEyes,
  onEyesToggle,
}: CubeControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors rounded-lg"
      >
        <span>Cube Settings</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Controls - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          {/* Size Control */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <span>Size</span>
              <span className="text-zinc-500 dark:text-zinc-400">{cubeSize.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={cubeSize}
              onChange={(e) => onSizeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          {/* Shape Toggle */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Shape
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShapeChange('energy')}
                className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                  shapeType === 'energy'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Energy Cube
              </button>
              <button
                onClick={() => onShapeChange('isometric')}
                className={`px-3 py-2 text-xs font-medium rounded transition-colors ${
                  shapeType === 'isometric'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                Isometric Diamond
              </button>
            </div>
          </div>

          {/* Eyes Toggle */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span>Show Eyes</span>
              <button
                onClick={() => onEyesToggle(!showEyes)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showEyes ? 'bg-orange-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showEyes ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Eyes are visible on certain cube shapes
            </p>
          </div>

          {/* Info */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              💡 Your preferences are saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
