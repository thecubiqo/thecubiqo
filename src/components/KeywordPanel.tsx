'use client'

/**
 * KeywordPanel - Premium glass design
 * Keywords help CubiQo understand you better
 */

import { useState, useEffect } from 'react'

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export function KeywordPanel({ 
  isOpen, 
  onClose, 
  isDark = true
}: KeywordPanelProps) {
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

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Backdrop - subtle blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      {/* Glass panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-[400px] max-w-[90vw] flex flex-col transition-transform duration-300 ease-out backdrop-blur-2xl ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(30, 30, 35, 0.85) 0%, rgba(20, 20, 25, 0.90) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(250, 250, 252, 0.90) 100%)',
          boxShadow: isDark
            ? '-8px 0 32px rgba(0, 0, 0, 0.4), inset 1px 0 1px rgba(255, 255, 255, 0.1)'
            : '-8px 0 32px rgba(0, 0, 0, 0.15), inset 1px 0 1px rgba(255, 255, 255, 0.8)',
          borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-2xl font-light tracking-wide ${
              isDark ? 'text-white/95' : 'text-gray-900'
            }`}>
              Keywords
            </h2>
            <button 
              onClick={onClose}
              className={`p-2 rounded-full transition-all ${
                isDark 
                  ? 'hover:bg-white/10 text-white/60 hover:text-white/90' 
                  : 'hover:bg-black/5 text-gray-400 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Description */}
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-white/50' : 'text-gray-500'
          }`}>
            Keywords per color is one of the way how CubiQo knows you, the words are populated here based of conversation or you can edit as you feel fit
          </p>
        </div>

        {/* Content area - empty for now */}
        <div className="flex-1 px-6 pb-6">
          {/* Future content will go here */}
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
