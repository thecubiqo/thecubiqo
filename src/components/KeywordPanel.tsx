'use client'

/**
 * KeywordPanel - RGY Capsule System
 * 
 * Zone assignment is AUTOMATIC based on CubiQo's color policy:
 * - GREEN: Task-focused, help-seeking, productivity → Intents: Collab, Trade
 * - RED: Desire, indulgence, age-gated → Intents: Collab, Trade  
 * - YELLOW: Casual, relaxed → NO INTENTS
 * 
 * Keywords are added by:
 * - AI (auto-extracted from conversations)
 * - User (manual input)
 */

import { useState, useEffect, useCallback } from 'react'

interface Capsule {
  zone: 'GREEN' | 'YELLOW' | 'RED'
  intent: string | null // null for YELLOW
  keywords: string[]
}

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  sessionId?: string
  onCapsuleUpdate?: (capsules: Capsule[]) => void
}

// Admin-defined intents (only for GREEN and RED)
const INTENTS = {
  GREEN: ['Collab', 'Trade'],
  RED: ['Collab', 'Trade'],
  YELLOW: [] as string[], // No intents for Yellow
}

const ZONE_CONFIG = {
  GREEN: {
    name: 'Growth',
    description: 'Task-focused, productivity, ambition',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  YELLOW: {
    name: 'Chill',
    description: 'Casual conversations, relaxation',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  RED: {
    name: 'Indulge',
    description: 'Desires, exploration, 18+',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
}

type ZoneId = keyof typeof ZONE_CONFIG

export function KeywordPanel({ 
  isOpen, 
  onClose, 
  isDark = true, 
  sessionId,
  onCapsuleUpdate 
}: KeywordPanelProps) {
  // State for each zone's capsule
  const [capsules, setCapsules] = useState<Record<ZoneId, Capsule>>({
    GREEN: { zone: 'GREEN', intent: null, keywords: [] },
    YELLOW: { zone: 'YELLOW', intent: null, keywords: [] },
    RED: { zone: 'RED', intent: null, keywords: [] },
  })
  
  // Active zone tab
  const [activeZone, setActiveZone] = useState<ZoneId>('GREEN')
  
  // New keyword input
  const [newKeyword, setNewKeyword] = useState('')
  
  // Edit mode
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Load capsules from localStorage on mount
  useEffect(() => {
    if (sessionId) {
      const stored = localStorage.getItem(`cubiqo_capsules_${sessionId}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setCapsules(parsed)
        } catch (e) {
          console.error('Failed to parse stored capsules:', e)
        }
      }
    }
  }, [sessionId])

  // Save capsules to localStorage when they change
  const saveCapsules = useCallback((newCapsules: Record<ZoneId, Capsule>) => {
    setCapsules(newCapsules)
    if (sessionId) {
      localStorage.setItem(`cubiqo_capsules_${sessionId}`, JSON.stringify(newCapsules))
    }
    if (onCapsuleUpdate) {
      onCapsuleUpdate(Object.values(newCapsules))
    }
  }, [sessionId, onCapsuleUpdate])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  const handleIntentChange = (intent: string | null) => {
    const newCapsules = {
      ...capsules,
      [activeZone]: {
        ...capsules[activeZone],
        intent,
      },
    }
    saveCapsules(newCapsules)
  }

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase()
    if (trimmed && !capsules[activeZone].keywords.includes(trimmed)) {
      const newCapsules = {
        ...capsules,
        [activeZone]: {
          ...capsules[activeZone],
          keywords: [...capsules[activeZone].keywords, trimmed],
        },
      }
      saveCapsules(newCapsules)
      setNewKeyword('')
    }
  }

  const handleEditKeyword = (index: number) => {
    setEditingIndex(index)
    setEditText(capsules[activeZone].keywords[index])
  }

  const handleSaveEdit = () => {
    if (editingIndex !== null && editText.trim()) {
      const trimmed = editText.trim().toLowerCase()
      const newKeywords = capsules[activeZone].keywords.map((k, i) => 
        i === editingIndex ? trimmed : k
      )
      const newCapsules = {
        ...capsules,
        [activeZone]: {
          ...capsules[activeZone],
          keywords: newKeywords,
        },
      }
      saveCapsules(newCapsules)
    }
    setEditingIndex(null)
    setEditText('')
  }

  const handleDeleteKeyword = (index: number) => {
    const newKeywords = capsules[activeZone].keywords.filter((_, i) => i !== index)
    const newCapsules = {
      ...capsules,
      [activeZone]: {
        ...capsules[activeZone],
        keywords: newKeywords,
      },
    }
    saveCapsules(newCapsules)
  }

  if (!isVisible) return null

  const currentZone = ZONE_CONFIG[activeZone]
  const currentCapsule = capsules[activeZone]
  const availableIntents = INTENTS[activeZone]

  return (
    <div 
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
      data-testid="keyword-panel-overlay"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-[95vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-zinc-900/95' : 'bg-[#fef7f0]/95'}`}
        onClick={e => e.stopPropagation()}
        data-testid="keyword-panel"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: currentZone.color }}>
              <span className="text-white text-sm font-bold">
                {activeZone[0]}
              </span>
            </div>
            <div>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                RGY Capsules
              </span>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Your intentions for AI matching
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-100 text-gray-600'
            }`}
            data-testid="keyword-panel-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Zone Tabs */}
        <div className={`flex p-2 gap-1 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          {(Object.keys(ZONE_CONFIG) as ZoneId[]).map((zone) => {
            const config = ZONE_CONFIG[zone]
            const isActive = activeZone === zone
            const keywordCount = capsules[zone].keywords.length
            
            return (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'text-white shadow-lg' 
                    : isDark 
                      ? 'text-white/60 hover:text-white/80 hover:bg-white/5' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive ? { 
                  backgroundColor: config.color,
                  boxShadow: `0 4px 12px ${config.color}40`
                } : undefined}
                data-testid={`zone-tab-${zone.toLowerCase()}`}
              >
                <span>{config.name}</span>
                {keywordCount > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-gray-200'
                  }`}>
                    {keywordCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Zone Description */}
          <div 
            className="p-3 rounded-xl mb-4"
            style={{ 
              backgroundColor: currentZone.bgColor,
              border: `1px solid ${currentZone.borderColor}`
            }}
          >
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {currentZone.description}
            </p>
            {activeZone === 'RED' && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Age-gated content
              </p>
            )}
          </div>

          {/* Intent Selection (only for GREEN and RED) */}
          {availableIntents.length > 0 && (
            <div className="mb-5">
              <h3 className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                Intent
              </h3>
              <div className="flex gap-2">
                {availableIntents.map((intent) => (
                  <button
                    key={intent}
                    onClick={() => handleIntentChange(
                      currentCapsule.intent === intent ? null : intent
                    )}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${
                      currentCapsule.intent === intent
                        ? 'text-white border-transparent'
                        : isDark 
                          ? 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10' 
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                    style={currentCapsule.intent === intent ? {
                      backgroundColor: currentZone.color
                    } : undefined}
                    data-testid={`intent-${intent.toLowerCase()}`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
              <p className={`mt-2 text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                Select your purpose for proactive matching
              </p>
            </div>
          )}

          {/* Keywords Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                Keywords
              </h3>
              <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                AI + You
              </span>
            </div>
            
            {/* Keywords cloud */}
            {currentCapsule.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentCapsule.keywords.map((keyword, index) => (
                  <div 
                    key={index}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                      isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ borderLeft: `3px solid ${currentZone.color}` }}
                    data-testid={`keyword-tag-${index}`}
                  >
                    {editingIndex === index ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                        className={`bg-transparent outline-none text-sm w-24 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className={isDark ? 'text-white/90' : 'text-gray-700'}>
                          {keyword}
                        </span>
                        <button
                          onClick={() => handleEditKeyword(index)}
                          className={`opacity-0 group-hover:opacity-60 transition-opacity p-0.5 ${
                            isDark ? 'text-white/70' : 'text-gray-500'
                          }`}
                          data-testid={`edit-keyword-${index}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteKeyword(index)}
                          className="opacity-0 group-hover:opacity-60 transition-opacity p-0.5 hover:text-red-400"
                          data-testid={`delete-keyword-${index}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-6 mb-4 rounded-xl border-2 border-dashed ${
                isDark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'
              }`}>
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm">No keywords yet</p>
                <p className="text-xs mt-1">Add keywords or let CubiQo learn them</p>
              </div>
            )}
            
            {/* Add new keyword */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Add a keyword..."
                className={`flex-1 px-3 py-2.5 text-sm rounded-lg border transition-colors ${
                  isDark 
                    ? 'bg-white/5 border-white/10 placeholder:text-white/30 text-white focus:border-white/30' 
                    : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-900 focus:border-gray-400'
                }`}
                onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                data-testid="add-keyword-input"
              />
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  newKeyword.trim()
                    ? 'text-white shadow-lg hover:shadow-xl'
                    : isDark ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                }`}
                style={newKeyword.trim() ? { 
                  backgroundColor: currentZone.color,
                  boxShadow: `0 4px 12px ${currentZone.color}40`
                } : undefined}
                data-testid="add-keyword-btn"
              >
                Add
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className={`mt-6 p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              How RGY Capsules Work
            </h4>
            <ul className={`text-xs space-y-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              <li className="flex items-start gap-2">
                <span style={{ color: currentZone.color }}>•</span>
                Zone is auto-assigned by CubiQo&apos;s color
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: currentZone.color }}>•</span>
                AI detects keywords from your chats
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: currentZone.color }}>•</span>
                Used to match you with like-minded people
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
              {Object.values(capsules).reduce((sum, c) => sum + c.keywords.length, 0)} total keywords
            </span>
            <button 
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? 'text-orange-400 hover:bg-orange-500/10' : 'text-orange-600 hover:bg-orange-50'
              }`}
              data-testid="clear-all-btn"
              onClick={() => {
                if (confirm('Clear all keywords from this zone?')) {
                  const newCapsules = {
                    ...capsules,
                    [activeZone]: {
                      ...capsules[activeZone],
                      keywords: [],
                      intent: null,
                    },
                  }
                  saveCapsules(newCapsules)
                }
              }}
            >
              Clear Zone
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
