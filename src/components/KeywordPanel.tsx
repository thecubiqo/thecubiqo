'use client'

/**
 * KeywordPanel - Color experience selector + Keyword management
 * Shows keywords for each color zone (Green, Yellow, Red)
 * Users can select experience AND edit their keywords
 */

import { useState, useEffect } from 'react'

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

type ColorId = 'green' | 'yellow' | 'red'

interface Keyword {
  id: string
  text: string
}

const COLOR_OPTIONS = [
  {
    id: 'green' as const,
    name: 'Green',
    label: 'Intelligent',
    color: '#22c55e',
    bgLight: '#dcfce7',
    voice: 'Clear & confident',
  },
  {
    id: 'yellow' as const,
    name: 'Yellow', 
    label: 'Ambiguous',
    color: '#eab308',
    bgLight: '#fef9c3',
    voice: 'Relaxed & natural',
  },
  {
    id: 'red' as const,
    name: 'Red',
    label: 'Indulgent',
    color: '#ef4444',
    bgLight: '#fee2e2',
    voice: 'Deep & thoughtful',
  },
]

// Mock keywords - would come from backend
const INITIAL_KEYWORDS: Record<ColorId, Keyword[]> = {
  green: [
    { id: '1', text: 'yoga class' },
    { id: '2', text: 'project' },
  ],
  yellow: [
    { id: '3', text: 'coffee chat' },
    { id: '4', text: 'networking' },
  ],
  red: [
    { id: '5', text: 'deep talk' },
    { id: '6', text: 'personal goals' },
  ],
}

export function KeywordPanel({ isOpen, onClose, isDark = true }: KeywordPanelProps) {
  const [selectedColor, setSelectedColor] = useState<ColorId | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [keywords, setKeywords] = useState(INITIAL_KEYWORDS)
  const [expandedColor, setExpandedColor] = useState<ColorId | null>(null)
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  
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

  const handleSelectColor = (colorId: ColorId) => {
    if (!isLocked) {
      setSelectedColor(colorId)
    }
  }

  const handleTapForKeywords = (colorId: ColorId) => {
    setExpandedColor(expandedColor === colorId ? null : colorId)
  }

  const handleEditKeyword = (keyword: Keyword) => {
    setEditingKeyword(keyword.id)
    setEditText(keyword.text)
  }

  const handleSaveEdit = (colorId: ColorId) => {
    if (editingKeyword && editText.trim()) {
      setKeywords(prev => ({
        ...prev,
        [colorId]: prev[colorId].map(k => 
          k.id === editingKeyword ? { ...k, text: editText.trim() } : k
        )
      }))
    }
    setEditingKeyword(null)
    setEditText('')
  }

  const handleDeleteKeyword = (colorId: ColorId, keywordId: string) => {
    setKeywords(prev => ({
      ...prev,
      [colorId]: prev[colorId].filter(k => k.id !== keywordId)
    }))
  }

  const handleAddKeyword = (colorId: ColorId) => {
    if (newKeyword.trim()) {
      setKeywords(prev => ({
        ...prev,
        [colorId]: [...prev[colorId], { id: Date.now().toString(), text: newKeyword.trim() }]
      }))
      setNewKeyword('')
    }
  }

  const handleLock = () => {
    if (selectedColor) setIsLocked(true)
  }

  const handleUnlock = () => {
    setIsLocked(false)
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
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-[95vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-zinc-900' : 'bg-[#fef7f0]'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Logo */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_react-energy-cube/artifacts/zuvwrv2g_cubiqo_favicon_512.png" 
              alt="CubiQo" 
              className="w-10 h-10"
            />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Experience & Keywords
            </span>
          </div>
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
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Simple explanation */}
          <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            This only changes audio and visuals. CubiQo still understands RGY normally.
          </p>

          {/* Color Cards with Keywords */}
          <div className="space-y-3">
            {COLOR_OPTIONS.map((option) => {
              const isSelected = selectedColor === option.id
              const isExpanded = expandedColor === option.id
              const colorKeywords = keywords[option.id]
              const isDisabled = isLocked && !isSelected
              
              return (
                <div 
                  key={option.id}
                  className={`rounded-xl overflow-hidden transition-all ${
                    isDisabled ? 'opacity-40' : ''
                  }`}
                  style={{
                    border: isSelected ? `2px solid ${option.color}` : '2px solid transparent',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : option.bgLight,
                  }}
                >
                  {/* Color Header - Click to select experience */}
                  <button
                    onClick={() => !isDisabled && handleSelectColor(option.id)}
                    disabled={isDisabled}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    {/* Color cube */}
                    <div 
                      className="w-12 h-12 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {option.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-white/10' : 'bg-white/60'
                        }`}>
                          {option.label}
                        </span>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        {option.voice}
                      </div>
                    </div>

                    {isSelected && (
                      <svg className="w-5 h-5 flex-shrink-0" fill={option.color} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  {/* Tap for keywords button */}
                  <button
                    onClick={() => handleTapForKeywords(option.id)}
                    className={`w-full px-4 py-2 text-sm border-t flex items-center justify-between ${
                      isDark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span>tap for keywords</span>
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                      {colorKeywords.length} keywords
                    </span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Keywords List (expanded) */}
                  {isExpanded && (
                    <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/50'}`}>
                      <div className="space-y-2">
                        {colorKeywords.map(keyword => (
                          <div 
                            key={keyword.id}
                            className={`flex items-center gap-2 p-2 rounded-lg ${
                              isDark ? 'bg-white/5' : 'bg-white'
                            }`}
                          >
                            {editingKeyword === keyword.id ? (
                              <input
                                type="text"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onBlur={() => handleSaveEdit(option.id)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(option.id)}
                                className={`flex-1 px-2 py-1 text-sm rounded bg-transparent border ${
                                  isDark ? 'border-white/20' : 'border-gray-300'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <>
                                <span className="flex-1 text-sm">{keyword.text}</span>
                                <button
                                  onClick={() => handleEditKeyword(keyword)}
                                  className={`p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                                >
                                  <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteKeyword(option.id, keyword.id)}
                                  className={`p-1 rounded text-red-400 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        
                        {/* Add new keyword */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            placeholder="Add keyword..."
                            className={`flex-1 px-3 py-2 text-sm rounded-lg ${
                              isDark ? 'bg-white/5 placeholder:text-white/30' : 'bg-white placeholder:text-gray-400'
                            }`}
                            onKeyDown={e => e.key === 'Enter' && handleAddKeyword(option.id)}
                          />
                          <button
                            onClick={() => handleAddKeyword(option.id)}
                            className="px-3 py-2 text-sm rounded-lg font-medium"
                            style={{ backgroundColor: option.color, color: 'white' }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Lock button */}
          {selectedColor && !isLocked && (
            <button
              onClick={handleLock}
              className="w-full mt-4 py-3 rounded-xl font-medium text-white"
              style={{ backgroundColor: COLOR_OPTIONS.find(c => c.id === selectedColor)?.color }}
            >
              Lock {COLOR_OPTIONS.find(c => c.id === selectedColor)?.name} Experience
            </button>
          )}

          {isLocked && (
            <div className={`mt-4 p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Locked to {COLOR_OPTIONS.find(c => c.id === selectedColor)?.name}
              </span>
              <button
                onClick={handleUnlock}
                className={`block w-full mt-2 text-sm ${isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Unlock
              </button>
            </div>
          )}

          {/* Single disclaimer */}
          <p className={`mt-6 text-xs text-center ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            Audio-visual only. Voice is never stored.
          </p>
        </div>

        {/* Settings button */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
          }`}>
            SETTINGS
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
