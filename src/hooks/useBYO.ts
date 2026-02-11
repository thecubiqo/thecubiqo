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

  // Load from localStorage
  const loadConfig = useCallback(() => {
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

  // Initial load and event setup
  useEffect(() => {
    loadConfig()

    const handleUpdate = () => loadConfig()

    // Listen for custom event (same window) and storage event (cross-tab)
    window.addEventListener('cubiqo-byo-update', handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('cubiqo-byo-update', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [loadConfig])

  // Save to localStorage and dispatch event
  const saveConfig = useCallback((newConfig: BYOConfig) => {
    setConfig(newConfig)
    localStorage.setItem(BYO_STORAGE_KEY, JSON.stringify(newConfig))
    // Dispatch event to sync other hook instances
    window.dispatchEvent(new Event('cubiqo-byo-update'))
  }, [])

  // Toggle BYO mode - uses functional update to avoid stale state issues in callback
  const toggleBYO = useCallback(() => {
    const stored = localStorage.getItem(BYO_STORAGE_KEY)
    const currentConfig = stored ? JSON.parse(stored) : defaultBYOConfig
    const newConfig = { ...currentConfig, enabled: !currentConfig.enabled }
    saveConfig(newConfig)
  }, [saveConfig])

  // Update API keys
  const setApiKeys = useCallback((claude: string | null, openai: string | null) => {
    const stored = localStorage.getItem(BYO_STORAGE_KEY)
    const currentConfig = stored ? JSON.parse(stored) : defaultBYOConfig

    const newConfig = {
      ...currentConfig,
      claudeApiKey: claude,
      openaiApiKey: openai,
    }
    // Auto-enable if keys are provided
    if (claude || openai) {
      newConfig.enabled = true
    }

    saveConfig(newConfig)
  }, [saveConfig])

  // Clear all keys
  const clearKeys = useCallback(() => {
    saveConfig(defaultBYOConfig)
  }, [saveConfig])

  // Get headers for API requests
  const getHeaders = useCallback((): Record<string, string> => {
    // Read directly from state - which is now synced
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
