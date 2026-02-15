'use client'

/**
 * GettingStartedPanel - Onboarding examples and popular keywords
 * Shows real peer interactions and trending keywords in a classy, helpful way
 */

import { useState, useEffect } from 'react'
import { trackMagicLinkButtonClick } from '@/lib/analytics/events'
import { openProviderUrl } from '@/lib/analytics/providers'

interface GettingStartedPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  onExampleClick?: (text: string) => void
}

const EXAMPLE_INTERACTIONS = [
  {
    question: "What's a good book for understanding human psychology?",
    response: "I'd recommend 'Thinking, Fast and Slow' by Daniel Kahneman...",
    category: "Learning"
  },
  {
    question: "Help me plan a weekend trip to Paris",
    response: "Let me suggest a 3-day itinerary focusing on art and cuisine...",
    category: "Travel"
  },
  {
    question: "I need motivation to start working out",
    response: "Let's break this down. What's stopping you right now?",
    category: "Wellness"
  },
  {
    question: "Explain quantum computing like I'm five",
    response: "Imagine a coin that's both heads and tails at the same time...",
    category: "Tech"
  },
]

const POPULAR_KEYWORDS = [
  { word: 'productivity', count: 1247, color: '#22c55e' },
  { word: 'mindfulness', count: 892, color: '#eab308' },
  { word: 'adventure', count: 743, color: '#ec4899' },
  { word: 'creativity', count: 681, color: '#8b5cf6' },
  { word: 'fitness', count: 567, color: '#22c55e' },
  { word: 'learning', count: 512, color: '#3b82f6' },
  { word: 'relationships', count: 489, color: '#ec4899' },
  { word: 'travel', count: 445, color: '#eab308' },
]

export function GettingStartedPanel({ 
  isOpen, 
  onClose, 
  isDark = true,
  onExampleClick 
}: GettingStartedPanelProps) {
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      
      <div
        className={`absolute left-0 top-0 bottom-0 w-[520px] max-w-[92vw] flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : '-translate-x-full'
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
              Getting Started
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
            See how others are using CubiQo and discover what makes for great conversations
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto space-y-8">
          
          {/* Quick Email Access */}
          <section>
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Check for Magic Link
            </h3>
            <p className="text-sm text-white/40 mb-4">
              Waiting for your magic link email? Quick access to your inbox:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  trackMagicLinkButtonClick('gmail', 'side_panel')
                  openProviderUrl('gmail')
                }}
                className="flex-1 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor" className="text-red-400"/>
                  </svg>
                  <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/90 group-hover:text-red-400 transition-colors">
                  Open Gmail
                </p>
              </button>
              <button
                onClick={() => {
                  trackMagicLinkButtonClick('outlook', 'side_panel')
                  openProviderUrl('outlook')
                }}
                className="flex-1 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] group"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M7 9H17V11H7V9ZM7 13H17V15H7V13ZM20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM20 20H4V8L12 13L20 8V20ZM20 6L12 11L4 6V4H20V6Z" fill="currentColor" className="text-blue-400"/>
                  </svg>
                  <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/90 group-hover:text-blue-400 transition-colors">
                  Open Outlook
                </p>
              </button>
            </div>
          </section>
          
          {/* Example Interactions */}
          <section>
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Example Conversations
            </h3>
            <div className="space-y-3">
              {EXAMPLE_INTERACTIONS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => onExampleClick?.(example.question)}
                  className="w-full text-left p-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
                      {example.category}
                    </span>
                    <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/85 mb-2 font-medium">
                    "{example.question}"
                  </p>
                  <p className="text-xs text-white/35 line-clamp-2">
                    {example.response}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Popular Keywords */}
          <section>
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
              Trending Keywords
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {POPULAR_KEYWORDS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => onExampleClick?.(item.word)}
                  className="p-3.5 rounded-xl transition-all hover:scale-[1.02] group text-left"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                      {item.word}
                    </span>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                  <p className="text-xs text-white/30">
                    {item.count.toLocaleString()} uses
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Pro Tips */}
          <section className="pb-4">
            <h3 className="text-lg font-medium text-white/90 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Pro Tips
            </h3>
            <div className="space-y-2.5">
              {[
                'Be specific — details help CubiQo give better answers',
                'Use voice for complex topics — it\'s more natural',
                'Add keywords to personalize your experience',
              ].map((tip, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <span className="text-white/40 text-xs mt-0.5">•</span>
                  <p className="text-sm text-white/60 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

export default GettingStartedPanel
