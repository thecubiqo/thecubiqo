'use client'

/**
 * BYO Settings Panel
 * User-facing settings with integration toggles always visible
 */

import { useState } from 'react'
import { useBYO } from '@/hooks/useBYO'

interface BYOSettingsProps {
  onClose?: () => void
}

// All integrations the user can toggle — always shown
const ALL_INTEGRATIONS = [
  { key: 'email_read', name: 'Email (Read)', desc: 'Read & draft emails', icon: '📧', color: 'bg-red-500/20 text-red-400' },
  { key: 'email_send', name: 'Email (Send)', desc: 'Send emails', icon: '📤', color: 'bg-red-500/20 text-red-400' },
  { key: 'whatsapp_read', name: 'WhatsApp (Read)', desc: 'Read & draft', icon: '💬', color: 'bg-green-500/20 text-green-400' },
  { key: 'whatsapp_send', name: 'WhatsApp (Send)', desc: 'Send messages', icon: '💬', color: 'bg-green-500/20 text-green-400' },
  { key: 'telegram_read', name: 'Telegram (Read)', desc: 'Read & draft', icon: '✈️', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'telegram_send', name: 'Telegram (Send)', desc: 'Send messages', icon: '✈️', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'discord_read', name: 'Discord (Read)', desc: 'Read & draft', icon: '🎮', color: 'bg-indigo-500/20 text-indigo-400' },
  { key: 'discord_send', name: 'Discord (Send)', desc: 'Send messages', icon: '🎮', color: 'bg-indigo-500/20 text-indigo-400' },
  { key: 'slack_read', name: 'Slack (Read)', desc: 'Read & draft', icon: '💼', color: 'bg-purple-500/20 text-purple-400' },
  { key: 'slack_send', name: 'Slack (Send)', desc: 'Send messages', icon: '💼', color: 'bg-purple-500/20 text-purple-400' },
  { key: 'maps_read', name: 'Maps (Search)', desc: 'Search & view', icon: '🗺️', color: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'maps_write', name: 'Maps (Navigate)', desc: 'Start navigation', icon: '📍', color: 'bg-emerald-500/20 text-emerald-400' },
  { key: 'uber_read', name: 'Uber (View)', desc: 'Estimates & view', icon: '🚗', color: 'bg-gray-500/20 text-gray-300' },
  { key: 'uber_write', name: 'Uber (Request)', desc: 'Request rides', icon: '🚕', color: 'bg-gray-500/20 text-gray-300' },
  { key: 'spotify', name: 'Spotify', desc: 'Music control', icon: '🎵', color: 'bg-green-500/20 text-green-400' },
  { key: 'web_search', name: 'Web Search', desc: 'Search the web', icon: '🔍', color: 'bg-blue-500/20 text-blue-400' },
  { key: 'voice_mode', name: 'Voice Mode', desc: 'Voice input/output', icon: '🎤', color: 'bg-violet-500/20 text-violet-400' },
  { key: 'action_cards', name: 'Action Cards', desc: 'Confirmation cards', icon: '🎯', color: 'bg-amber-500/20 text-amber-400' },
]

export function BYOSettings({ onClose }: BYOSettingsProps) {
  const { config, toggleBYO, setApiKeys, clearKeys, isBYOEnabled } = useBYO()

  const [claudeKey, setClaudeKey] = useState(() => config.claudeApiKey || '')
  const [openaiKey, setOpenaiKey] = useState(() => config.openaiApiKey || '')
  const [showKeys, setShowKeys] = useState(false)

  // User's own toggle states — always visible, persisted to localStorage
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    const stored = localStorage.getItem('cubiqo_user_toggles')
    return stored ? JSON.parse(stored) : {}
  })

  const toggleIntegration = (key: string) => {
    setToggles(prev => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('cubiqo_user_toggles', JSON.stringify(updated))
      return updated
    })
  }

  const handleSave = () => {
    const claudeKeyTrimmed = claudeKey.trim() || null
    const openaiKeyTrimmed = openaiKey.trim() || null
    setApiKeys(claudeKeyTrimmed, openaiKeyTrimmed)
    onClose?.()
  }

  const handleClear = () => {
    clearKeys()
    setClaudeKey('')
    setOpenaiKey('')
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 10) return key
    return key.slice(0, 7) + '...' + key.slice(-4)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">BYO Mode</h2>
        <button
          onClick={toggleBYO}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isBYOEnabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isBYOEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400">
        Use your own API keys for Claude and OpenAI.
        Keys are stored locally and never sent to our servers.
      </p>

      {/* API Key Inputs - only show when enabled */}
      {isBYOEnabled && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          {/* Claude API Key */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Claude API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showKeys ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700
                           rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your key at console.anthropic.com
            </p>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label className="block text-sm font-medium mb-1">
              OpenAI API Key
            </label>
            <input
              type={showKeys ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700
                         rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your key at platform.openai.com
            </p>
          </div>

          {/* Show/Hide toggle */}
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-sm text-gray-400 hover:text-white"
          >
            {showKeys ? 'Hide keys' : 'Show keys'}
          </button>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500
                         rounded-lg font-medium transition-colors"
            >
              Save Keys
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600
                         rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Claude: {config.claudeApiKey ? maskKey(config.claudeApiKey) : 'Not set'}</p>
            <p>OpenAI: {config.openaiApiKey ? maskKey(config.openaiApiKey) : 'Not set'}</p>
          </div>
        </div>
      )}

      {/* Integrations — ALWAYS VISIBLE */}
      <div className="space-y-3 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Integrations</h3>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {Object.values(toggles).filter(Boolean).length} active
          </span>
        </div>
        <p className="text-xs text-gray-500">Choose what CubiQo can access. You decide.</p>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {ALL_INTEGRATIONS.map(integration => {
            const isOn = !!toggles[integration.key]
            return (
              <div
                key={integration.key}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${integration.color}`}>
                    {integration.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{integration.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{integration.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleIntegration(integration.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${isOn ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
