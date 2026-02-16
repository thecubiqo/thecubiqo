'use client'

/**
 * Founder Portal - Button that links to the Founders Dashboard
 * Only visible to aditya@cubiqo.ai
 */

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { isFounder } from '@/lib/auth/feature-gate-simple'

export function FounderPortal({ override }: { override?: boolean }) {
  const { user } = useAuth()

  // Only show for founders (or if overridden by parent check like PIN auth)
  if (!isFounder(user?.email) && !override) {
    return null
  }

  return (
    <Link
      href="/founderspass/dashboard"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 pl-4 pr-1 py-1 rounded-full glass-card border border-amber-500/30 hover:border-amber-400/80 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-black/60"
    >
      <span className="text-sm font-medium bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent tracking-wide uppercase">
        Founder Mode
      </span>
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center text-black font-bold text-xs shadow-lg group-hover:scale-110 transition-transform">
        A
      </div>
    </Link>
  )
}
