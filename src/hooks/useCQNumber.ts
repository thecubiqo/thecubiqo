'use client'

/**
 * useCQNumber - Hook for CQ number operations
 * Manages user's CQ number and lookup operations
 */

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CQProfile } from '@/types/cq'

export function useCQNumber() {
  const [currentCQ, setCurrentCQ] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Get current user's CQ number
  useEffect(() => {
    const fetchCurrentCQ = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setCurrentCQ(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('handle')
          .eq('id', user.id)
          .single()

        if (error) throw error
        
        setCurrentCQ(data?.handle || null)
      } catch (err) {
        console.error('[useCQNumber] Error fetching CQ:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch CQ number')
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentCQ()
  }, [supabase])

  // Lookup user by CQ number
  const lookupByCQ = useCallback(async (cqNumber: string): Promise<CQProfile | null> => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, handle, display_name, avatar_url')
        .eq('handle', cqNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No user found
          return null
        }
        throw error
      }

      return data as CQProfile
    } catch (err) {
      console.error('[useCQNumber] Error looking up CQ:', err)
      setError(err instanceof Error ? err.message : 'Failed to lookup CQ number')
      return null
    }
  }, [supabase])

  // Copy CQ number to clipboard
  const copyCQ = useCallback(async () => {
    if (!currentCQ) return false
    
    try {
      await navigator.clipboard.writeText(currentCQ)
      return true
    } catch (err) {
      console.error('[useCQNumber] Error copying CQ:', err)
      return false
    }
  }, [currentCQ])

  return {
    currentCQ,
    loading,
    error,
    lookupByCQ,
    copyCQ,
  }
}
