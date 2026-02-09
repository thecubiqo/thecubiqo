'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getFeatureAccess } from '@/lib/auth'

const NAV_ITEMS = [
  { href: '/', label: 'Home', feature: 'home' as const },
  { href: '/chat', label: 'Chat', feature: 'chat' as const },
  { href: '/agents', label: 'Agents', feature: 'agents' as const },
  { href: '/files', label: 'Files', feature: 'files' as const },
  { href: '/memory', label: 'Memory', feature: 'memory' as const },
  { href: '/integrations', label: 'Integrations', feature: 'integrations' as const },
  { href: '/cubikey', label: 'CubiKey', feature: 'cubikey' as const },
  { href: '/settings', label: 'Settings', feature: 'settings' as const },
  { href: '/admin', label: 'Admin', feature: 'admin' as const },
]

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const access = getFeatureAccess(user?.email)

  return (
    <nav className="bg-gray-900 text-white p-4">
      <ul className="flex gap-4">
        {NAV_ITEMS.map((item) => {
          if (!access[item.feature]) return null
          
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`px-3 py-2 rounded ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
