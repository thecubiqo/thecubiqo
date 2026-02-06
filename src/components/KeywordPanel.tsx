'use client'

/**
 * KeywordPanel - Premium glass design with three keyword cards
 * Ascend (Green), Drift (Yellow), Pulse (Red)
 */

import { useState, useEffect } from 'react'

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  sessionId?: string
}

type CardType = 'ascend' | 'drift' | 'pulse'

interface CardData {
  keywords: string[]
}

const CARD_CONFIG = {
  ascend: {
    name: 'Ascend',
    icon: '↗',
    subtitle: 'Growth · Wellness · Achievement',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.03) 100%)',
  },
  drift: {
    name: 'Drift',
    icon: '✨',
    subtitle: 'Relax · Social · Ambient',
    color: '#eab308',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(234, 179, 8, 0.03) 100%)',
  },
  pulse: {
    name: 'Pulse',
    icon: '⚡',
    subtitle: 'Attraction · Energy · Exploration',
    color: '#ec4899',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%)',
  },
}

export function KeywordPanel({ 
  isOpen, 
  onClose, 
  isDark = true,
  sessionId
}: KeywordPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const [cards, setCards] = useState<Record<CardType, CardData>>({
    ascend: { keywords: [] },
    drift: { keywords: [] },
    pulse: { keywords: [] },
  })
  
  const [newKeyword, setNewKeyword] = useState<Record<CardType, string>>({
    ascend: '',
    drift: '',
    pulse: '',
  })

  // Load from localStorage
  useEffect(() => {
    if (sessionId) {
      const stored = localStorage.getItem(`cubiqo_keywords_${sessionId}`)
      if (stored) {
        try {
          setCards(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse keywords:', e)
        }
      }
    }
  }, [sessionId])

  // Save to localStorage
  const saveCards = (newCards: Record<CardType, CardData>) => {
    setCards(newCards)
    if (sessionId) {
      localStorage.setItem(`cubiqo_keywords_${sessionId}`, JSON.stringify(newCards))
    }
  }

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  const addKeyword = (cardType: CardType) => {
    const keyword = newKeyword[cardType].trim().toLowerCase()
    if (keyword && cards[cardType].keywords.length < 50 && !cards[cardType].keywords.includes(keyword)) {
      const newCards = {
        ...cards,
        [cardType]: {
          keywords: [...cards[cardType].keywords, keyword]
        }
      }
      saveCards(newCards)
      setNewKeyword({ ...newKeyword, [cardType]: '' })
    }
  }

  const removeKeyword = (cardType: CardType, index: number) => {
    const newCards = {
      ...cards,
      [cardType]: {
        keywords: cards[cardType].keywords.filter((_, i) => i !== index)
      }
    }
    saveCards(newCards)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      
      <div
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-[90vw] flex flex-col transition-transform duration-300 ease-out backdrop-blur-2xl ${
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
        <div className="p-6 pb-4 flex-shrink-0">
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
          
          <p className={`text-sm leading-relaxed ${
            isDark ? 'text-white/50' : 'text-gray-500'
          }`}>
            Keywords per color is one of the way how CubiQo knows you, the words are populated here based of conversation or you can edit as you feel fit
          </p>
        </div>

        {/* Scrollable Cards */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {(Object.keys(CARD_CONFIG) as CardType[]).map((cardType) => {
            const config = CARD_CONFIG[cardType]
            const cardData = cards[cardType]
            
            return (
              <div
                key={cardType}
                className="rounded-2xl p-5 backdrop-blur-sm"
                style={{
                  background: config.bgGradient,
                  border: `1.5px solid ${config.borderColor}`,
                  boxShadow: `0 4px 16px ${config.color}15`
                }}
              >
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm"
                    style={{ 
                      backgroundColor: `${config.color}20`,
                      border: `1px solid ${config.borderColor}`
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {config.name}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                      {config.subtitle}
                    </p>
                  </div>
                </div>

                {/* Keywords */}
                {cardData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {cardData.keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm transition-all ${
                          isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/60 hover:bg-white/80'
                        }`}
                        style={{ borderLeft: `2px solid ${config.color}` }}
                      >
                        <span className={isDark ? 'text-white/90' : 'text-gray-800'}>
                          {keyword}
                        </span>
                        <button
                          onClick={() => removeKeyword(cardType, index)}
                          className="opacity-0 group-hover:opacity-70 transition-opacity hover:opacity-100"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add keyword input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword[cardType]}
                    onChange={(e) => setNewKeyword({ ...newKeyword, [cardType]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword(cardType)}
                    placeholder={`Add keyword... (${cardData.keywords.length}/50)`}
                    disabled={cardData.keywords.length >= 50}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg backdrop-blur-sm transition-all ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 placeholder:text-white/30 text-white focus:border-white/30' 
                        : 'bg-white/40 border border-gray-300/50 placeholder:text-gray-400 text-gray-900 focus:border-gray-400'
                    }`}
                  />
                  <button
                    onClick={() => addKeyword(cardType)}
                    disabled={!newKeyword[cardType].trim() || cardData.keywords.length >= 50}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                    style={{
                      backgroundColor: config.color,
                      color: 'white',
                      opacity: newKeyword[cardType].trim() && cardData.keywords.length < 50 ? 1 : 0.3
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
