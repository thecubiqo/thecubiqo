'use client'

/**
 * useBYO Hook
 * Manages BYO (Bring Your Own) API keys stored in localStorage
 */

import { useState, useEffect, useCallback } from 'react'
import { BYOConfig, BYO_STORAGE_KEY, defaultBYOConfig } from '@/lib/byo/types'

export function useBYO() {
  const [config, setConfig] = useState<BYOConfig>(defaultBYOConfig)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(BYO_STORAGE_KEY)
    if (stored) {
      try {
        setConfig(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse BYO config:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  const saveConfig = useCallback((newConfig: BYOConfig) => {
    setConfig(newConfig)
    localStorage.setItem(BYO_STORAGE_KEY, JSON.stringify(newConfig))
  }, [])

  // Toggle BYO mode
  const toggleBYO = useCallback(() => {
    saveConfig({ ...config, enabled: !config.enabled })
  }, [config, saveConfig])

  // Update API keys
  const setApiKeys = useCallback((claude: string | null, openai: string | null) => {
    saveConfig({
      ...config,
      claudeApiKey: claude,
      openaiApiKey: openai,
    })
  }, [config, saveConfig])

  // Clear all keys
  const clearKeys = useCallback(() => {
    saveConfig(defaultBYOConfig)
  }, [saveConfig])

  // Get headers for API requests
  const getHeaders = useCallback((): Record<string, string> => {
    if (!config.enabled) return {}

    const headers: Record<string, string> = {}
    if (config.claudeApiKey) {
      headers['x-byo-claude-key'] = config.claudeApiKey
    }
    if (config.openaiApiKey) {
      headers['x-byo-openai-key'] = config.openaiApiKey
    }
    return headers
  }, [config])

  return {
    config,
    isLoaded,
    toggleBYO,
    setApiKeys,
    clearKeys,
    getHeaders,
    isBYOEnabled: config.enabled,
    hasClaudeKey: !!config.claudeApiKey,
    hasOpenaiKey: !!config.openaiApiKey,
  }
}
