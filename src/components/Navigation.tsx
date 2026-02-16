'use client'

/**
 * Navigation Sidebar
 * Shows links based on user's feature access
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getFeatureAccess, FOUNDER_ACCESS } from '@/lib/auth/feature-gate-simple'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠', feature: 'home' as const },
  { href: '/chat', label: 'Chat', icon: '💬', feature: 'chat' as const },
  { href: '/agents', label: 'Agents', icon: '🤖', feature: 'agents' as const },
  { href: '/files', label: 'Files', icon: '📁', feature: 'files' as const },
  { href: '/memory', label: 'Memory', icon: '🧠', feature: 'memory' as const },
  { href: '/integrations', label: 'Integrations', icon: '🔗', feature: 'integrations' as const },
  { href: '/cubikey', label: 'CubiKey', icon: '🔑', feature: 'cubikey' as const },
  { href: '/settings', label: 'Settings', icon: '⚙️', feature: 'settings' as const },
  { href: '/admin/experiments', label: 'Experiments', icon: '🧪', feature: 'admin' as const },
  { href: '/admin', label: 'Admin', icon: '👑', feature: 'admin' as const },
]

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [access, setAccess] = useState(getFeatureAccess(user?.email))

  // Re-check access periodically (for live updates from Founder Portal)
  useEffect(() => {
    const updateAccess = () => {
      // Check for PIN bypass first
      if (typeof window !== 'undefined' && sessionStorage.getItem('founders_pass_auth') === 'true') {
        setAccess(FOUNDER_ACCESS)
      } else {
        setAccess(getFeatureAccess(user?.email))
      }
    }

    // Initial check
    updateAccess()

    const interval = setInterval(updateAccess, 1000)

    return () => clearInterval(interval)
  }, [user?.email])

  return (
    <nav className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
            C
          </div>
          <div>
            <div className="text-white font-bold text-lg">Cubiqo</div>
            <div className="text-gray-400 text-xs">AI Platform</div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            if (!access[item.feature]) return null

            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {user.email}
              </div>
              <div className="text-gray-400 text-xs">
                Signed in
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
