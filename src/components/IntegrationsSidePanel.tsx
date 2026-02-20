'use client'

/**
 * IntegrationsSidePanel - Comprehensive panel showing available integrations
 * Categorically divided showing availability status
 */

import { useState } from 'react'

interface Integration {
  id: string
  name: string
  icon: string
  description: string
  status: 'available' | 'coming_soon' | 'beta'
  category: string
}

const INTEGRATION_CATEGORIES = [
  {
    id: 'ai-models',
    name: 'AI Models',
    icon: '🧠',
    integrations: [
      { id: 'openai', name: 'OpenAI (GPT)', icon: '🤖', description: 'GPT-4, GPT-3.5 models', status: 'available' as const },
      { id: 'anthropic', name: 'Anthropic (Claude)', icon: '🟣', description: 'Claude 3.5, Claude 3 models', status: 'available' as const },
      { id: 'google-ai', name: 'Google AI (Gemini)', icon: '🔵', description: 'Gemini Pro, Gemini Ultra', status: 'available' as const },
      { id: 'openrouter', name: 'OpenRouter', icon: '🔗', description: 'Unified API for multiple models', status: 'available' as const },
      { id: 'minimax', name: 'MiniMax', icon: '⚡', description: 'Fast inference models', status: 'available' as const },
      { id: 'ollama', name: 'Ollama (Local)', icon: '🏠', description: 'Run models locally', status: 'available' as const },
      { id: 'mistral', name: 'Mistral AI', icon: '🌊', description: 'Mixtral, Mistral models', status: 'available' as const },
    ],
  },
  {
    id: 'voice',
    name: 'Voice & Speech',
    icon: '🎙️',
    integrations: [
      { id: 'elevenlabs', name: 'ElevenLabs', icon: '🔊', description: 'Natural text-to-speech', status: 'available' as const },
      { id: 'browser-stt', name: 'Browser STT', icon: '🎤', description: 'Native speech recognition', status: 'available' as const },
      { id: 'whisper', name: 'Whisper (Groq)', icon: '👂', description: 'Fast speech-to-text', status: 'available' as const },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '💬',
    integrations: [
      { id: 'cq-messenger', name: 'CQ Messenger', icon: '📨', description: 'Built-in direct messaging', status: 'available' as const },
      { id: 'telegram', name: 'Telegram Bot', icon: '✈️', description: 'Telegram chatbot integration', status: 'available' as const },
      { id: 'email', name: 'Email (Resend)', icon: '📧', description: 'Transactional emails', status: 'available' as const },
      { id: 'whatsapp', name: 'WhatsApp', icon: '📱', description: 'WhatsApp Business API', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'commerce',
    name: 'Commerce & Payments',
    icon: '💳',
    integrations: [
      { id: 'stripe', name: 'Stripe', icon: '💰', description: 'Payment processing', status: 'coming_soon' as const },
      { id: 'shopify', name: 'Shopify', icon: '🛍️', description: 'E-commerce platform', status: 'coming_soon' as const },
      { id: 'printify', name: 'Printify', icon: '🖨️', description: 'Print-on-demand', status: 'coming_soon' as const },
      { id: 'printful', name: 'Printful', icon: '📦', description: 'Print & fulfillment', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    icon: '🛠️',
    integrations: [
      { id: 'github', name: 'GitHub', icon: '🐙', description: 'Code repository & CI/CD', status: 'available' as const },
      { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deployment platform', status: 'available' as const },
      { id: 'supabase', name: 'Supabase', icon: '⚡', description: 'Database & auth backend', status: 'available' as const },
    ],
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: '📋',
    integrations: [
      { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Email management', status: 'coming_soon' as const },
      { id: 'calendar', name: 'Google Calendar', icon: '📅', description: 'Schedule management', status: 'coming_soon' as const },
      { id: 'notion', name: 'Notion', icon: '📝', description: 'Knowledge management', status: 'coming_soon' as const },
    ],
  },
  {
    id: 'transport',
    name: 'Transport & Delivery',
    icon: '🚗',
    integrations: [
      { id: 'uber', name: 'Uber', icon: '🚕', description: 'Ride-hailing service', status: 'coming_soon' as const },
      { id: 'doordash', name: 'DoorDash', icon: '🍔', description: 'Food delivery', status: 'coming_soon' as const },
    ],
  },
]

const STATUS_BADGES = {
  available: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  beta: { label: 'Beta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  coming_soon: { label: 'Coming Soon', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

interface IntegrationsSidePanelProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export function IntegrationsSidePanel({ isOpen, onClose, isDark = true }: IntegrationsSidePanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('ai-models')

  if (!isOpen) return null

  const totalAvailable = INTEGRATION_CATEGORIES.reduce(
    (sum, cat) => sum + cat.integrations.filter(i => i.status === 'available').length,
    0
  )
  const totalIntegrations = INTEGRATION_CATEGORIES.reduce(
    (sum, cat) => sum + cat.integrations.length,
    0
  )

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 left-0 h-full w-full sm:w-[420px] bg-zinc-900 border-r border-zinc-800 shadow-2xl z-[75] transform transition-transform duration-300 overflow-hidden flex flex-col"
        style={{ animation: 'slideInLeft 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div>
                <h2 className="text-lg font-semibold text-white">Integrations</h2>
                <p className="text-xs text-zinc-400">{totalAvailable} active · {totalIntegrations} total</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary Bar */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-emerald-400 text-xl font-bold">{totalAvailable}</div>
              <div className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Active</div>
            </div>
            <div className="flex-1 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="text-zinc-300 text-xl font-bold">{totalIntegrations - totalAvailable}</div>
              <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Coming Soon</div>
            </div>
            <div className="flex-1 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="text-orange-400 text-xl font-bold">{INTEGRATION_CATEGORIES.length}</div>
              <div className="text-orange-400/70 text-[10px] uppercase tracking-wider">Categories</div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'thin' }}>
          {INTEGRATION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategory === category.id
            const availableCount = category.integrations.filter(i => i.status === 'available').length

            return (
              <div key={category.id} className="rounded-xl border border-zinc-800 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{category.icon}</span>
                    <div className="text-left">
                      <div className="text-white text-sm font-medium">{category.name}</div>
                      <div className="text-zinc-500 text-xs">{availableCount}/{category.integrations.length} active</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {availableCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Integrations */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 bg-zinc-900/50">
                    {category.integrations.map((integration) => {
                      const badge = STATUS_BADGES[integration.status]
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">{integration.icon}</span>
                            <div>
                              <div className="text-white text-sm">{integration.name}</div>
                              <div className="text-zinc-500 text-xs">{integration.description}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
          <p className="text-center text-zinc-500 text-xs">
            BYO Mode: Use your own API keys for any integration
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
