'use client'

/**
 * KeywordPanel - Redesigned to match mockup
 * Features 3D tilted cuboids for R/G/Y with "tap for keywords"
 */

import { useState } from 'react'

interface Keyword {
  id: string
  text: string
  color: 'RED' | 'GREEN_BLUE' | 'YELLOW'
}

interface KeywordPanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

// Mock keywords
const MOCK_KEYWORDS: Record<string, Keyword[]> = {
  GREEN_BLUE: [
    { id: '1', text: 'yoga class', color: 'GREEN_BLUE' },
    { id: '2', text: 'project deadlines', color: 'GREEN_BLUE' },
  ],
  YELLOW: [
    { id: '3', text: 'coffee meetup', color: 'YELLOW' },
    { id: '4', text: 'networking', color: 'YELLOW' },
  ],
  RED: [
    { id: '5', text: 'AI startup', color: 'RED' },
    { id: '6', text: 'series A funding', color: 'RED' },
  ],
}

const CUBE_CONFIG = [
  { 
    key: 'GREEN_BLUE', 
    label: 'Intelligent', 
    color: '#22c55e', 
    bgGradient: 'from-green-400/80 to-green-600/80',
    shadowColor: 'rgba(34, 197, 94, 0.4)'
  },
  { 
    key: 'YELLOW', 
    label: 'Ambiguous', 
    color: '#eab308', 
    bgGradient: 'from-yellow-300/80 to-yellow-500/80',
    shadowColor: 'rgba(234, 179, 8, 0.4)'
  },
  { 
    key: 'RED', 
    label: 'Indulgent', 
    color: '#f87171', 
    bgGradient: 'from-red-300/80 to-red-500/80',
    shadowColor: 'rgba(248, 113, 113, 0.4)'
  },
]

interface IsometricCubeCardProps {
  config: typeof CUBE_CONFIG[0]
  keywords: Keyword[]
  isExpanded: boolean
  onToggle: () => void
  isDark: boolean
}

function IsometricCubeCard({ config, keywords, isExpanded, onToggle, isDark }: IsometricCubeCardProps) {
  return (
    <div className="relative group">
      {/* 3D Isometric Cube Container */}
      <div 
        className="relative cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={onToggle}
        style={{
          transform: 'perspective(800px) rotateX(15deg) rotateY(-15deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top face */}
        <div 
          className={`absolute w-32 h-8 bg-gradient-to-br ${config.bgGradient} opacity-90`}
          style={{
            transform: 'translateY(-16px) rotateX(60deg)',
            transformOrigin: 'bottom',
            borderRadius: '4px 4px 0 0',
          }}
        />
        
        {/* Front face - main content */}
        <div 
          className={`relative w-32 h-24 bg-gradient-to-br ${config.bgGradient} rounded-lg flex flex-col items-center justify-center`}
          style={{
            boxShadow: `0 8px 32px ${config.shadowColor}`,
          }}
        >
          {/* Keywords preview or tap text */}
          <div className="text-center px-2">
            {isExpanded ? (
              <div className="text-xs text-white/90 space-y-1">
                {keywords.slice(0, 2).map(k => (
                  <div key={k.id} className="truncate">{k.text}</div>
                ))}
                {keywords.length > 2 && (
                  <div className="text-white/60">+{keywords.length - 2} more</div>
                )}
              </div>
            ) : (
              <div className="text-white/80 text-xs font-medium">
                tap for<br/>keywords
              </div>
            )}
          </div>
        </div>
        
        {/* Right face */}
        <div 
          className={`absolute w-8 h-24 bg-gradient-to-b ${config.bgGradient} opacity-70`}
          style={{
            transform: 'translateX(128px) rotateY(90deg)',
            transformOrigin: 'left',
            borderRadius: '0 4px 4px 0',
          }}
        />
      </div>
      
      {/* Label below */}
      <div 
        className={`text-center mt-4 text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}
        style={{ color: config.color }}
      >
        {config.label}
      </div>
      
      {/* Expanded keywords panel */}
      {isExpanded && (
        <div 
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 rounded-xl z-10 ${
            isDark ? 'bg-zinc-800/95' : 'bg-white/95'
          }`}
          style={{
            boxShadow: `0 8px 32px ${config.shadowColor}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="space-y-2">
            {keywords.map(k => (
              <div 
                key={k.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-white/5' : 'bg-black/5'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="flex-1 truncate">{k.text}</span>
              </div>
            ))}
            <button 
              className="w-full text-xs py-1.5 rounded-lg transition-colors"
              style={{ 
                backgroundColor: `${config.color}20`,
                color: config.color 
              }}
            >
              + Add keyword
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function KeywordPanel({ isOpen, onClose, isDark = true }: KeywordPanelProps) {
  const [expandedCube, setExpandedCube] = useState<string | null>(null)
  const [proMatchEnabled, setProMatchEnabled] = useState(false)
  const [settings, setSettings] = useState({
    selectColorVoice: true,
    crossSelect: false,
    uiOnly: true,
  })

  if (!isOpen) return null

  const bgColor = isDark ? 'bg-[#1a1a1a]/98' : 'bg-[#fff5f0]/98'
  const textColor = isDark ? 'text-white' : 'text-gray-900'

  return (
    <div 
      className="fixed inset-0 z-[80]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Panel */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[480px] max-w-[90vw] ${bgColor} ${textColor} overflow-y-auto`}
        style={{ backdropFilter: 'blur(20px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_3b5d3edc-6188-443e-bc32-545560e99173/artifacts/g5a15cpk_Create%20a%20polished%203D.png" 
              alt="CubiQo" 
              className="w-8 h-8"
            />
            <span className="font-bold">CubiQo™</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            data-testid="keyword-panel-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ProMatch Toggle */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div 
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{ backgroundColor: '#0ea5e9', color: 'white' }}
            >
              Pro match toggle
            </div>
            <button
              onClick={() => setProMatchEnabled(!proMatchEnabled)}
              data-testid="promatch-toggle"
              className={`w-12 h-6 rounded-full transition-colors relative ${
                proMatchEnabled ? 'bg-green-500' : isDark ? 'bg-white/20' : 'bg-black/20'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  proMatchEnabled ? 'left-7' : 'left-1'
                }`} 
              />
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="p-4 border-b border-white/10">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.selectColorVoice}
                  onChange={e => setSettings(s => ({ ...s, selectColorVoice: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-2 border-white/30"
                />
                <span className="text-sm opacity-80">
                  user can select a specific color and voice experience
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.crossSelect}
                  onChange={e => setSettings(s => ({ ...s, crossSelect: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-2 border-white/30"
                />
                <span className="text-sm opacity-80">
                  cannot cross select a voice and color
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.uiOnly}
                  onChange={e => setSettings(s => ({ ...s, uiOnly: e.target.checked }))}
                  className="mt-1 w-4 h-4 rounded border-2 border-white/30"
                />
                <span className="text-sm opacity-80">
                  and this selection is UI only and independent of rgy segregation
                </span>
              </label>
            </div>
            
            <p className="text-xs opacity-50 mt-4">
              Talk to me for locking to anytime audio/visual experience you like and want to lock UI with it
            </p>
            <p className="text-xs opacity-70 mt-1">
              we recommend to use default experience
            </p>
          </div>
        </div>

        {/* 3D Cubes Section */}
        <div className="p-6">
          <div className="flex justify-center items-end gap-6">
            {CUBE_CONFIG.map((config) => (
              <IsometricCubeCard
                key={config.key}
                config={config}
                keywords={MOCK_KEYWORDS[config.key] || []}
                isExpanded={expandedCube === config.key}
                onToggle={() => setExpandedCube(expandedCube === config.key ? null : config.key)}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-3">
          <div className={`p-3 rounded-lg text-center text-sm ${isDark ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}>
            <p className="opacity-80">
              Cubiqo colors are audio visual effects only.
            </p>
            <p className="opacity-80">
              CubiQo never stores voice or conversations and voice is streamed only
            </p>
          </div>
          
          <div className={`p-3 rounded-lg text-center text-sm ${isDark ? 'bg-zinc-800/50' : 'bg-gray-100'}`}>
            <p className="opacity-70">
              CubiQo never remembers the exacts and abstract only:
            </p>
            <p className="opacity-70">
              Simulating real like conversations
            </p>
          </div>
        </div>

        {/* Settings Button */}
        <div className="p-4 border-t border-white/10">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-orange-100 text-orange-600 border border-orange-300'
            }`}
          >
            SETTINGS
          </button>
        </div>

        {/* Footer disclaimer */}
        <div className={`p-4 text-center text-xs border-t ${isDark ? 'border-white/10 bg-yellow-900/20' : 'border-black/10 bg-yellow-50'}`}>
          <p className="opacity-70">
            CubiQo never remembers the exacts and abstract only: Simulating real like conversations
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeywordPanel
