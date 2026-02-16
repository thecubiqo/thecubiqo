'use client'

/**
 * ClientProviders - Wraps the app with all client-side providers
 *
 * Includes the AuthProvider (Supabase session) so that auth state
 * changes are reflected immediately across all components without
 * requiring a full page refresh.
 */

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
