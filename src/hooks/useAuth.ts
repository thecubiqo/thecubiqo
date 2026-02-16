'use client'

/**
 * useAuth Hook
 * Re-exports the centralized auth context from AuthContext.tsx
 * 
 * This maintains backward compatibility with existing components
 * while ensuring all components use the same Supabase client instance
 * and share auth state from the provider level.
 */

export { useAuth } from '@/contexts/AuthContext'
export type { AuthState } from '@/contexts/AuthContext'
