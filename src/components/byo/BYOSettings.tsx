'use client'

/**
 * BYO Settings Panel
 * UI for configuring BYO API keys with test connection and validation
 * 
 * WCAG 2.1 AA Compliant:
 * - Clear labels and error messages
 * - Keyboard navigation
 * - Screen reader support
 * - Color contrast
 * - Focus indicators
 * 
 * Author: Bubbles (Frontend Developer)
 * Sprint 1: BYO Settings UX Enhancement
 */

import { useState, useEffect } from 'react'
import { useBYO } from '@/hooks/useBYO'
import { BiometricRegistration } from '@/components/auth/BiometricRegistration'
import { Check, X, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

interface BYOSettingsProps {
  onClose?: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function BYOSettings({ onClose }: BYOSettingsProps) {
  const { config, toggleBYO, setApiKeys, clearKeys, isBYOEnabled } = useBYO()

  const [claudeKey, setClaudeKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [showKeys, setShowKeys] = useState(false)
  
  // Validation and testing states
  const [claudeValidation, setClaudeValidation] = useState<string | null>(null)
  const [openaiValidation, setOpenaiValidation] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load existing keys when opening
  useEffect(() => {
    if (config.claudeApiKey) setClaudeKey(config.claudeApiKey)
    if (config.openaiApiKey) setOpenaiKey(config.openaiApiKey)
  }, [config])

  // Validate API key format on blur
  const validateClaudeKey = (key: string) => {
    if (!key.trim()) {
      setClaudeValidation(null)
      return
    }
    if (!key.startsWith('sk-ant-')) {
      setClaudeValidation('Claude API keys must start with "sk-ant-"')
      return
    }
    if (key.length < 20) {
      setClaudeValidation('Claude API key is too short')
      return
    }
    setClaudeValidation(null)
  }

  const validateOpenAIKey = (key: string) => {
    if (!key.trim()) {
      setOpenaiValidation(null)
      return
    }
    if (!key.startsWith('sk-')) {
      setOpenaiValidation('OpenAI API keys must start with "sk-"')
      return
    }
    if (key.length < 20) {
      setOpenaiValidation('OpenAI API key is too short')
      return
    }
    setOpenaiValidation(null)
  }

  // Test connection to validate keys actually work
  const handleTestConnection = async () => {
    const claudeKeyTrimmed = claudeKey.trim()
    const openaiKeyTrimmed = openaiKey.trim()

    if (!claudeKeyTrimmed && !openaiKeyTrimmed) {
      setTestStatus('error')
      setTestMessage('Please enter at least one API key to test')
      return
    }

    // Validate formats first
    if (claudeKeyTrimmed) validateClaudeKey(claudeKeyTrimmed)
    if (openaiKeyTrimmed) validateOpenAIKey(openaiKeyTrimmed)

    if (claudeValidation || openaiValidation) {
      setTestStatus('error')
      setTestMessage('Please fix validation errors before testing')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testing connection...')

    try {
      const response = await fetch('/api/byo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claudeApiKey: claudeKeyTrimmed || null,
          openaiApiKey: openaiKeyTrimmed || null
        })
      })

      const data = await response.json()

      if (data.success) {
        setTestStatus('success')
        const testedKeys = []
        if (data.data.claudeValid) testedKeys.push('Claude')
        if (data.data.openaiValid) testedKeys.push('OpenAI')
        setTestMessage(`✓ Successfully connected to ${testedKeys.join(' and ')}`)
      } else {
        setTestStatus('error')
        setTestMessage(data.error || 'Connection test failed')
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage('Network error. Please try again.')
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setTestStatus('idle')
      setTestMessage('')
    }, 5000)
  }

  const handleSave = () => {
    const claudeKeyTrimmed = claudeKey.trim() || null
    const openaiKeyTrimmed = openaiKey.trim() || null

    // Validate before saving
    if (claudeKeyTrimmed) validateClaudeKey(claudeKeyTrimmed)
    if (openaiKeyTrimmed) validateOpenAIKey(openaiKeyTrimmed)

    if (claudeValidation || openaiValidation) {
      return
    }

    if (!claudeKeyTrimmed && !openaiKeyTrimmed) {
      setTestStatus('error')
      setTestMessage('At least one API key is required')
      return
    }

    console.log('[BYO Settings] Saving keys:', {
      hasClaude: !!claudeKeyTrimmed,
      hasOpenai: !!openaiKeyTrimmed
    })
    setApiKeys(claudeKeyTrimmed, openaiKeyTrimmed)
    
    // Show success feedback
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    
    // Verify save
    setTimeout(() => {
      const stored = localStorage.getItem('cubiqo_byo_config')
      console.log('[BYO Settings] Verification - stored:', stored)
    }, 100)
  }

  const handleClear = () => {
    // TODO: Replace with custom confirmation dialog for better accessibility
    if (window.confirm('Are you sure you want to clear all API keys? This action cannot be undone.')) {
      clearKeys()
      setClaudeKey('')
      setOpenaiKey('')
      setClaudeValidation(null)
      setOpenaiValidation(null)
      setTestStatus('idle')
      setTestMessage('')
    }
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 10) return key
    return key.slice(0, 7) + '...' + key.slice(-4)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">BYO Mode</h2>
          <p className="text-sm text-gray-400 mt-1">Bring Your Own API Keys</p>
        </div>
        <button
          onClick={toggleBYO}
          role="switch"
          aria-checked={isBYOEnabled}
          aria-label={isBYOEnabled ? 'Disable BYO Mode' : 'Enable BYO Mode'}
          className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                      ${isBYOEnabled ? 'bg-green-500 focus:ring-green-500' : 'bg-gray-600 focus:ring-gray-500'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-lg
                        transition-transform duration-200 ${isBYOEnabled ? 'translate-x-7' : 'translate-x-0'}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Description */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          <strong>Privacy First:</strong> Your API keys are stored locally in your browser 
          and encrypted before being sent to our backend. We never store your keys in plain text.
        </p>
      </div>

      {/* API Key Inputs - only show when enabled */}
      {isBYOEnabled && (
        <div className="space-y-6 pt-2">
          {/* Claude API Key */}
          <div className="space-y-2">
            <label htmlFor="claude-key" className="block text-sm font-medium text-white">
              Claude API Key
              <span className="text-red-400 ml-1" aria-label="required">*</span>
            </label>
            <div className="relative">
              <input
                id="claude-key"
                type={showKeys ? 'text' : 'password'}
                value={claudeKey}
                onChange={(e) => {
                  setClaudeKey(e.target.value)
                  setClaudeValidation(null)
                }}
                onBlur={(e) => validateClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                aria-invalid={!!claudeValidation}
                aria-describedby={claudeValidation ? 'claude-error' : 'claude-help'}
                className={`w-full px-4 py-3 pr-12 bg-gray-800 border rounded-lg text-sm
                           transition-colors focus:outline-none focus:ring-2
                           ${claudeValidation 
                             ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                             : 'border-gray-700 focus:border-green-500 focus:ring-green-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                aria-label={showKeys ? 'Hide API keys' : 'Show API keys'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white
                           focus:outline-none focus:text-white transition-colors"
              >
                {showKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {claudeValidation ? (
              <p id="claude-error" className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {claudeValidation}
              </p>
            ) : (
              <p id="claude-help" className="text-xs text-gray-500">
                Get your key at <a 
                  href="https://console.anthropic.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 underline"
                  aria-label="Get Claude API key (opens in new tab)"
                >
                  console.anthropic.com
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </p>
            )}
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <label htmlFor="openai-key" className="block text-sm font-medium text-white">
              OpenAI API Key
              <span className="text-red-400 ml-1" aria-label="required">*</span>
            </label>
            <input
              id="openai-key"
              type={showKeys ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => {
                setOpenaiKey(e.target.value)
                setOpenaiValidation(null)
              }}
              onBlur={(e) => validateOpenAIKey(e.target.value)}
              placeholder="sk-..."
              aria-invalid={!!openaiValidation}
              aria-describedby={openaiValidation ? 'openai-error' : 'openai-help'}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-sm
                         transition-colors focus:outline-none focus:ring-2
                         ${openaiValidation 
                           ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                           : 'border-gray-700 focus:border-green-500 focus:ring-green-500'}`}
            />
            {openaiValidation ? (
              <p id="openai-error" className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                {openaiValidation}
              </p>
            ) : (
              <p id="openai-help" className="text-xs text-gray-500">
                Get your key at <a 
                  href="https://platform.openai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                  aria-label="Get OpenAI API key (opens in new tab)"
                >
                  platform.openai.com
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </p>
            )}
          </div>

          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing' || (!claudeKey.trim() && !openaiKey.trim())}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 
                       disabled:text-gray-500 disabled:cursor-not-allowed
                       text-white rounded-lg font-medium transition-colors
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       focus:ring-offset-gray-900 flex items-center justify-center gap-2"
          >
            {testStatus === 'testing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {testStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {testStatus === 'error' && <X className="w-5 h-5" />}
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>

          {/* Test Status Message */}
          {testMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`p-3 rounded-lg text-sm flex items-center gap-2
                         ${testStatus === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                           testStatus === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                           'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}
            >
              {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />}
              {testMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={handleSave}
              disabled={(!claudeKey.trim() && !openaiKey.trim()) || !!claudeValidation || !!openaiValidation}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700
                         disabled:text-gray-500 disabled:cursor-not-allowed
                         text-white rounded-lg font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                         focus:ring-offset-gray-900 flex items-center justify-center gap-2"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                'Save Keys'
              )}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white
                         rounded-lg font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                         focus:ring-offset-gray-900"
            >
              Clear All
            </button>
          </div>

          {/* Current Status */}
          <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-800/50 rounded-lg">
            <p className="font-medium text-gray-400 mb-2">Current Configuration:</p>
            <p className="flex items-center gap-2">
              {config.claudeApiKey ? 
                <CheckCircle2 className="w-3 h-3 text-green-400" /> : 
                <X className="w-3 h-3 text-gray-600" />}
              Claude: {config.claudeApiKey ? maskKey(config.claudeApiKey) : 'Not configured'}
            </p>
            <p className="flex items-center gap-2">
              {config.openaiApiKey ? 
                <CheckCircle2 className="w-3 h-3 text-green-400" /> : 
                <X className="w-3 h-3 text-gray-600" />}
              OpenAI: {config.openaiApiKey ? maskKey(config.openaiApiKey) : 'Not configured'}
            </p>
          </div>

          {/* Biometric Registration */}
          <div className="pt-4 border-t border-gray-700">
            <BiometricRegistration />
          </div>
        </div>
      )}
    </div>
  )
}
