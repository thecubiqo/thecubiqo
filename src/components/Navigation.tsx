'use client'

/**
 * Main Navigation Sidebar
 * 
 * Features:
 * - Shows all features to founders
 * - Shows only released features to regular users
 * - Unreleased items are HIDDEN (not grayed)
 * - Active page highlighting
 * - Mobile responsive (collapsible)
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isFounder } from '@/lib/auth/founders'
import { getReleasedFeaturesClient } from '@/lib/auth/feature-flags-client'
import type { FeatureAccess } from '@/lib/auth/feature-flags'

// Founder access - all features enabled
const FOUNDER_ACCESS: FeatureAccess = {
  home: true,
  chat: true,
  settings: true,
  cubikey: true,
  agents: true,
  files: true,
  memory: true,
  codeExecution: true,
  browser: true,
  integrations: true,
  admin: true,
  deploy: true,
  featureGate: true,
}
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  FolderIcon,
  ClockIcon,
  PuzzlePieceIcon,
  KeyIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  FlagIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  CpuChipIcon as AgentsIconSolid,
  FolderIcon as FolderIconSolid,
  ClockIcon as ClockIconSolid,
  PuzzlePieceIcon as IntegrationsIconSolid,
  KeyIcon as KeyIconSolid,
  Cog6ToothIcon as SettingsIconSolid,
  ShieldCheckIcon as AdminIconSolid,
  FlagIcon as FlagIconSolid,
} from '@heroicons/react/24/solid'

interface NavItem {
  id: keyof FeatureAccess
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  badge?: string
  dividerAfter?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
  },
  {
    id: 'chat',
    label: 'Chat',
    path: '/chat',
    icon: ChatBubbleLeftRightIcon,
    iconSolid: ChatIconSolid,
    dividerAfter: true,
  },
  {
    id: 'agents',
    label: 'Agents',
    path: '/agents',
    icon: CpuChipIcon,
    iconSolid: AgentsIconSolid,
    badge: 'New',
  },
  {
    id: 'files',
    label: 'Files',
    path: '/files',
    icon: FolderIcon,
    iconSolid: FolderIconSolid,
  },
  {
    id: 'memory',
    label: 'Memory',
    path: '/memory',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    dividerAfter: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: '/integrations',
    icon: PuzzlePieceIcon,
    iconSolid: IntegrationsIconSolid,
  },
  {
    id: 'cubikey',
    label: 'CubiKey',
    path: '/cubikey',
    icon: KeyIcon,
    iconSolid: KeyIconSolid,
    badge: 'Beta',
    dividerAfter: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Cog6ToothIcon,
    iconSolid: SettingsIconSolid,
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    icon: ShieldCheckIcon,
    iconSolid: AdminIconSolid,
  },
  {
    id: 'featureGate',
    label: 'Feature Gate',
    path: '/feature-gate',
    icon: FlagIcon,
    iconSolid: FlagIconSolid,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Load feature access
  useEffect(() => {
    async function loadFeatures() {
      // Check if user is founder
      const userIsFounder = user?.email ? isFounder(user.email) : false
      
      if (userIsFounder) {
        // Founders see everything
        setFeatureAccess(FOUNDER_ACCESS)
      } else {
        // Regular users see released features only
        const access = await getReleasedFeaturesClient()
        setFeatureAccess(access)
      }
    }
    loadFeatures()
  }, [user])
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Close mobile menu on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  
  // Filter nav items based on feature access
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!featureAccess) return false
    return featureAccess[item.id] === true
  })
  
  const handleNavigate = (path: string) => {
    router.push(path)
    if (isMobile) {
      setIsOpen(false)
    }
  }
  
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }
  
  if (!featureAccess) {
    return null // Loading
  }
  
  // Mobile toggle button
  const MobileToggle = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
      aria-label="Toggle navigation"
    >
      {isOpen ? (
        <XMarkIcon className="w-6 h-6 text-white" />
      ) : (
        <Bars3Icon className="w-6 h-6 text-white" />
      )}
    </button>
  )
  
  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">CubiQo</h1>
        {user?.email && (
          <p className="text-xs text-white/60 mt-1 truncate">{user.email}</p>
        )}
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item, index) => {
            const Icon = isActive(item.path) ? item.iconSolid : item.icon
            const active = isActive(item.path)
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${active 
                      ? 'bg-orange-500/20 text-orange-400 font-medium' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/30 text-orange-300">
                      {item.badge}
                    </span>
                  )}
                </button>
                
                {item.dividerAfter && index < visibleItems.length - 1 && (
                  <div className="my-2 border-t border-white/10" />
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      
      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">
          {user ? 'Authenticated' : 'Guest Mode'}
        </p>
      </div>
    </div>
  )
  
  return (
    <>
      {/* Mobile Toggle */}
      {isMobile && <MobileToggle />}
      
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-black/40 backdrop-blur-md border-r border-white/10
          transition-transform duration-300
          ${isMobile 
            ? (isOpen ? 'translate-x-0' : '-translate-x-full')
            : 'translate-x-0'
          }
        `}
      >
        <SidebarContent />
      </aside>
      
      {/* Spacer for desktop layout */}
      {!isMobile && <div className="w-64 flex-shrink-0" />}
    </>
  )
}
