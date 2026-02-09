'use client'

/**
 * App Layout Wrapper
 * Provides navigation sidebar for authenticated app pages
 */

import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900/20 to-black flex">
      <Navigation />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
