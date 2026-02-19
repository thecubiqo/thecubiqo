'use client'

/**
 * useDeals Hook
 * Fetches contextual deals based on user messages.
 * Shows relevant offers when user interest is detected.
 */

import { useState, useCallback } from 'react'
import type { Deal } from '@/lib/deals/types'

interface UseDealsState {
  deals: Deal[]
  isLoading: boolean
  isVisible: boolean
  error: string | null
}

export function useDeals() {
  const [state, setState] = useState<UseDealsState>({
    deals: [],
    isLoading: false,
    isVisible: false,
    error: null,
  })

  /**
   * Check a user message for deal intent and fetch relevant offers.
   */
  const checkForDeals = useCallback(async (message: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, maxResults: 3 }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch deals')
      }

      const data = await response.json()

      if (data.hasDeals && data.deals.length > 0) {
        setState({
          deals: data.deals,
          isLoading: false,
          isVisible: true,
          error: null,
        })
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          // Keep existing deals visible if no new ones found
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  const dismissDeals = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }))
  }, [])

  const clearDeals = useCallback(() => {
    setState({ deals: [], isLoading: false, isVisible: false, error: null })
  }, [])

  return {
    deals: state.deals,
    isLoading: state.isLoading,
    isVisible: state.isVisible,
    error: state.error,
    checkForDeals,
    dismissDeals,
    clearDeals,
  }
}
