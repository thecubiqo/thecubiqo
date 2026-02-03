'use client'

/**
 * KeywordPanel - Clean, simple color experience selector
 * Slides from RIGHT side
 */

import { useState, useEffect } from 'react'

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

type ColorExperience = 'green' | 'yellow' | 'red' | null

const COLOR_OPTIONS = [
  {
    id: 'green' as const,
    name: 'Green',
    color: '#22c55e',
    voice: 'Clear & confident',
  },
  {
    id: 'yellow' as const,
    name: 'Yellow', 
    color: '#eab308',
    voice: 'Relaxed & natural',
  },
  {
    id: 'red' as const,
    name: 'Red',
    color: '#ef4444',
    voice: 'Deep & thoughtful',
  },
]

export function KeywordPanel({ isOpen, onClose, isDark = true }: KeywordPanelProps) {
  const [selectedColor, setSelectedColor] = useState<ColorExperience>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  const handleSelectColor = (colorId: ColorExperience) => {
    if (!isLocked) {
      setSelectedColor(colorId)
    }
  }

  const handleLock = () => {
    if (selectedColor) setIsLocked(true)
  }

  const handleUnlock = () => {
    setIsLocked(false)
    setSelectedColor(null)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div
        className={`absolute right-0 top-0 bottom-0 w-[360px] max-w-[90vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold">Experience</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Simple explanation */}
          <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
            This only changes audio and visuals.<br />
            CubiQo still understands RGY normally.
          </p>

          {/* Color Options - Simple clean cubes */}
          <div className="space-y-3">
            {COLOR_OPTIONS.map((option) => {
              const isSelected = selectedColor === option.id
              const isDisabled = isLocked && !isSelected
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectColor(option.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  } ${isSelected 
                    ? isDark ? 'bg-white/10' : 'bg-gray-100'
                    : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    border: isSelected ? `2px solid ${option.color}` : '2px solid transparent',
                  }}
                >
                  {/* Simple cube - no glow, no rotation */}
                  <div 
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  
                  {/* Text */}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                      {option.voice}
                    </div>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <svg className="w-5 h-5" fill={option.color} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>

          {/* Lock button */}
          {selectedColor && !isLocked && (
            <button
              onClick={handleLock}
              className="w-full mt-6 py-3 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: COLOR_OPTIONS.find(c => c.id === selectedColor)?.color }}
            >
              Lock Experience
            </button>
          )}

          {/* Locked state */}
          {isLocked && (
            <div className={`mt-6 p-4 rounded-xl text-center ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Locked to {COLOR_OPTIONS.find(c => c.id === selectedColor)?.name}
              </span>
              <button
                onClick={handleUnlock}
                className={`block w-full mt-3 text-sm ${
                  isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Unlock
              </button>
            </div>
          )}

          {/* Single clean disclaimer */}
          <p className={`mt-8 text-xs text-center ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            Audio-visual only. Voice is never stored.
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
