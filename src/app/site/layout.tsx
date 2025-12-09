import { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CubiQo - Cuz life is three dimensional',
  description: 'The Cooperative Virtual Assistant. Privacy-first AI companion with infinite memory.',
}

interface SiteLayoutProps {
  children: ReactNode
}

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {children}
    </div>
  )
}
