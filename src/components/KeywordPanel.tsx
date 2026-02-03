'use client'

/**
 * KeywordPanel - Slides from RIGHT side
 * Allows user to select ONE color experience (Green, Yellow, Red)
 * This changes ONLY audio + visuals, NOT RGY thinking
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
    label: 'Intelligent',
    description: 'Professional, focused voice',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    voiceHint: 'Clear & confident',
  },
  {
    id: 'yellow' as const,
    name: 'Yellow', 
    label: 'Ambiguous',
    description: 'Warm, friendly voice',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    voiceHint: 'Relaxed & natural',
  },
  {
    id: 'red' as const,
    name: 'Red',
    label: 'Indulgent',
    description: 'Soft, intimate voice',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    voiceHint: 'Deep & thoughtful',
  },
]

export function KeywordPanel({ isOpen, onClose, isDark = true }: KeywordPanelProps) {
  const [selectedColor, setSelectedColor] = useState<ColorExperience>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle open/close animation
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

  const handleLockExperience = () => {
    if (selectedColor) {
      setIsLocked(true)
      // Here you would dispatch to a global state/context to change audio/visuals
    }
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Panel - slides from RIGHT */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-[400px] max-w-[90vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div>
            <h2 className="text-lg font-semibold">Experience</h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              the way cubiqo knows you
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            data-testid="keyword-panel-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Info Banner */}
          <div className={`p-4 rounded-xl mb-6 ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
          }`}>
            <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Select a color to change <strong>audio & visuals only</strong>.
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>
              CubiQo's RGY thinking remains unchanged.
            </p>
          </div>

          {/* Color Options */}
          <div className="space-y-3">
            <h3 className={`text-xs uppercase tracking-wider mb-3 ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>
              Choose your experience
            </h3>
            
            {COLOR_OPTIONS.map((option) => {
              const isSelected = selectedColor === option.id
              const isDisabled = isLocked && !isSelected
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectColor(option.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  } ${isSelected 
                    ? 'ring-2 scale-[1.02]' 
                    : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? option.bgColor : undefined,
                    borderColor: isSelected ? option.color : 'transparent',
                    ringColor: isSelected ? option.color : undefined,
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Color Indicator */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: option.bgColor }}
                    >
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ 
                          backgroundColor: option.color,
                          boxShadow: isSelected ? `0 0 20px ${option.color}` : undefined
                        }}
                      />
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: isSelected ? option.color : undefined }}>
                          {option.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {option.description}
                      </p>
                      <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        Voice: {option.voiceHint}
                      </p>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Lock/Unlock Section */}
          {selectedColor && (
            <div className={`mt-6 p-4 rounded-xl ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              {isLocked ? (
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 ${
                    isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium">Experience Locked</span>
                  </div>
                  <p className={`text-xs mb-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    Your audio & visual experience is set to {COLOR_OPTIONS.find(c => c.id === selectedColor)?.name}
                  </p>
                  <button
                    onClick={handleUnlock}
                    className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                      isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Unlock & Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLockExperience}
                  className="w-full py-3 rounded-xl font-medium transition-all"
                  style={{
                    backgroundColor: COLOR_OPTIONS.find(c => c.id === selectedColor)?.color,
                    color: 'white',
                  }}
                >
                  Lock {COLOR_OPTIONS.find(c => c.id === selectedColor)?.name} Experience
                </button>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className={`mt-6 p-4 rounded-xl text-center ${
            isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'
          }`}>
            <p className={`text-xs ${isDark ? 'text-orange-300/80' : 'text-orange-700'}`}>
              CubiQo colors are audio-visual effects only.
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-orange-300/60' : 'text-orange-600'}`}>
              CubiQo never stores voice or conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
