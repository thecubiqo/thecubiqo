'use client'

/**
 * BYO Settings Panel
 * UI for configuring BYO API keys
 */

import { useState, useEffect } from 'react'
import { useBYO } from '@/hooks/useBYO'

interface BYOSettingsProps {
  onClose?: () => void
}

export function BYOSettings({ onClose }: BYOSettingsProps) {
  const { config, toggleBYO, setApiKeys, clearKeys, isBYOEnabled } = useBYO()

  const [claudeKey, setClaudeKey] = useState('')
  const [showKeys, setShowKeys] = useState(false)

  // Load existing keys when opening
  useEffect(() => {
    if (config.claudeApiKey) setClaudeKey(config.claudeApiKey)
  }, [config])

  const handleSave = () => {
    const claudeKeyTrimmed = claudeKey.trim() || null
    console.log('[BYO Settings] Saving keys:', {
      hasClaude: !!claudeKeyTrimmed
    })
    setApiKeys(claudeKeyTrimmed)
    // Verify save
    setTimeout(() => {
      const stored = localStorage.getItem('cubiqo_byo_config')
      console.log('[BYO Settings] Verification - stored:', stored)
    }, 100)
    onClose?.()
  }

  const handleClear = () => {
    clearKeys()
    setClaudeKey('')
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 10) return key
    return key.slice(0, 7) + '...' + key.slice(-4)
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">BYO Mode</h2>
        <button
          onClick={toggleBYO}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            isBYOEnabled ? 'bg-green-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
              isBYOEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400">
        Use your own Claude API key.
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
          </div>
        </div>
      )}
    </div>
  )
}
