'use client'

/**
 * useAuth Hook
 * Client-side authentication state management
 * 
 * This hook now re-exports from AuthContext for centralized state management.
 * Related PRs: #28 (Centralize auth state), #12 (Auth state post magic-link)
 */

export { useAuth, type AuthState, type AuthContextType } from '@/contexts/AuthContext'
