'use client'

/**
 * KeywordPanel - Matches mockup design
 * Three stacked cards with tap-to-edit functionality
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
    borderColor: '#22c55e',
  },
  drift: {
    name: 'Drift',
    icon: '✨',
    subtitle: 'Relax · Social · Ambient',
    borderColor: '#eab308',
  },
  pulse: {
    name: 'Pulse',
    icon: '⚡',
    subtitle: 'Attraction · Energy · Exploration',
    borderColor: '#ec4899',
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
  const [editingCard, setEditingCard] = useState<CardType | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  
  const [cards, setCards] = useState<Record<CardType, CardData>>({
    ascend: { keywords: [] },
    drift: { keywords: [] },
    pulse: { keywords: [] },
  })

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
      setEditingCard(null)
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen])

  const addKeyword = (cardType: CardType) => {
    const keyword = newKeyword.trim().toLowerCase()
    if (keyword && cards[cardType].keywords.length < 50 && !cards[cardType].keywords.includes(keyword)) {
      saveCards({
        ...cards,
        [cardType]: {
          keywords: [...cards[cardType].keywords, keyword]
        }
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (cardType: CardType, index: number) => {
    saveCards({
      ...cards,
      [cardType]: {
        keywords: cards[cardType].keywords.filter((_, i) => i !== index)
      }
    })
  }

  const toggleEdit = (cardType: CardType) => {
    setEditingCard(editingCard === cardType ? null : cardType)
    setNewKeyword('')
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      
      <div
        className={`absolute right-0 top-0 bottom-0 w-[480px] max-w-[92vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(to bottom, rgba(25, 25, 30, 0.92), rgba(20, 20, 25, 0.95))',
          backdropFilter: 'blur(40px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl font-light text-white/95 tracking-tight">
              Keywords
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm text-white/40 leading-relaxed">
            Keywords per color is one of the way how CubiQo knows you, the words are populated here based of conversation or you can edit as you feel fit
          </p>
        </div>

        {/* Cards Container */}
        <div className="flex-1 flex flex-col px-8 pb-8 gap-5 overflow-y-auto">
          {(Object.keys(CARD_CONFIG) as CardType[]).map((cardType) => {
            const config = CARD_CONFIG[cardType]
            const cardData = cards[cardType]
            const isEditing = editingCard === cardType
            
            return (
              <div
                key={cardType}
                onClick={() => !isEditing && toggleEdit(cardType)}
                className="flex-1 rounded-[32px] p-6 backdrop-blur-xl cursor-pointer transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: `2px solid ${config.borderColor}`,
                  boxShadow: isEditing 
                    ? `0 12px 40px ${config.borderColor}40, inset 0 1px 0 rgba(255,255,255,0.1)` 
                    : `0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  transform: isEditing ? 'scale(1.02)' : 'scale(1)',
                  minHeight: '160px'
                }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl backdrop-blur-sm"
                      style={{ 
                        background: `${config.borderColor}20`,
                        border: `1.5px solid ${config.borderColor}50`,
                      }}
                    >
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white mb-0.5">
                        {config.name}
                      </h3>
                      <p className="text-xs text-white/40">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleEdit(cardType)
                      }}
                      className="text-xs px-3 py-1.5 rounded-full text-white/60 hover:bg-white/10 transition-all"
                    >
                      Done
                    </button>
                  )}
                </div>

                {/* Keywords Display */}
                {cardData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cardData.keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <span className="text-sm text-white/90">
                          {keyword}
                        </span>
                        {isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeKeyword(cardType, index)
                            }}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3.5 h-3.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Mode Input */}
                {isEditing && (
                  <div 
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addKeyword(cardType)}
                      placeholder={`Add keyword (${cardData.keywords.length}/50)`}
                      disabled={cardData.keywords.length >= 50}
                      className="flex-1 px-4 py-2.5 text-sm rounded-2xl backdrop-blur-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => addKeyword(cardType)}
                      disabled={!newKeyword.trim() || cardData.keywords.length >= 50}
                      className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ 
                        background: config.borderColor,
                        boxShadow: `0 4px 12px ${config.borderColor}40`
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!isEditing && cardData.keywords.length === 0 && (
                  <p className="text-center text-sm text-white/30 py-2">
                    Tap to add keywords
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
