'use client'

/**
 * RGYChatGateway - Tri-color button that opens the RGY chats interface
 * R = Red (Intimate), G = Green (Office), Y = Yellow (Cafe)
 */

import { useState } from 'react'

interface RGYChatGatewayProps {
  onOpen: () => void
  isDark?: boolean
}

export function RGYChatGatewayButton({ onOpen, isDark = true }: RGYChatGatewayProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="rgy-gateway-button"
      className={`
        fixed right-4 top-1/2 -translate-y-1/2 z-[60]
        w-12 h-24 rounded-full
        flex flex-col items-center justify-center gap-1
        transition-all duration-300
        ${isHovered ? 'scale-110 shadow-lg' : ''}
        ${isDark 
          ? 'bg-white/10 backdrop-blur-md border border-white/20' 
          : 'bg-black/10 backdrop-blur-md border border-black/20'
        }
      `}
      style={{
        boxShadow: isHovered 
          ? '0 0 20px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)' 
          : undefined
      }}
    >
      {/* Red dot */}
      <div 
        className="w-4 h-4 rounded-full transition-transform"
        style={{ 
          backgroundColor: '#ef4444',
          boxShadow: isHovered ? '0 0 8px #ef4444' : undefined,
          transform: isHovered ? 'scale(1.2)' : undefined
        }}
      />
      
      {/* Green dot */}
      <div 
        className="w-4 h-4 rounded-full transition-transform"
        style={{ 
          backgroundColor: '#22c55e',
          boxShadow: isHovered ? '0 0 8px #22c55e' : undefined,
          transform: isHovered ? 'scale(1.2)' : undefined
        }}
      />
      
      {/* Yellow dot */}
      <div 
        className="w-4 h-4 rounded-full transition-transform"
        style={{ 
          backgroundColor: '#eab308',
          boxShadow: isHovered ? '0 0 8px #eab308' : undefined,
          transform: isHovered ? 'scale(1.2)' : undefined
        }}
      />
    </button>
  )
}

interface RGYChatGatewayModalProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export function RGYChatGatewayModal({ isOpen, onClose, isDark = true }: RGYChatGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<'red' | 'green' | 'yellow'>('green')

  if (!isOpen) return null

  const tabs = [
    { id: 'red' as const, label: 'Intimate', color: '#ef4444', description: 'Deep, personal conversations' },
    { id: 'green' as const, label: 'Office', color: '#22c55e', description: 'Professional, focused discussions' },
    { id: 'yellow' as const, label: 'Cafe', color: '#eab308', description: 'Casual, friendly chats' },
  ]

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={`w-[90%] max-w-2xl rounded-2xl overflow-hidden ${
          isDark ? 'bg-zinc-900/95' : 'bg-white/95'
        }`}
        style={{ backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">RGY Chats Gateway</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="rgy-modal-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`rgy-tab-${tab.id}`}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === tab.id ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: tab.color }}
                />
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: tab.color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {tabs.filter(t => t.id === activeTab).map(tab => (
            <div key={tab.id} className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${tab.color}20` }}
              >
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{tab.label} Mode</h3>
              <p className="opacity-60 mb-6">{tab.description}</p>
              
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <p className="text-sm opacity-70">
                  Start a new conversation in {tab.label.toLowerCase()} mode, 
                  or continue your existing chats.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                  }`}
                  style={{ 
                    borderColor: tab.color,
                    borderWidth: 1
                  }}
                  data-testid={`rgy-new-chat-${tab.id}`}
                >
                  New Chat
                </button>
                <button
                  className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: tab.color }}
                  data-testid={`rgy-view-history-${tab.id}`}
                >
                  View History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RGYChatGatewayButton
