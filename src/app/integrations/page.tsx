'use client'

/**
 * Integrations Page
 * Shows available third-party integrations
 */

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { getFeatureAccess } from '@/lib/auth/feature-gate-simple'

interface Integration {
  id: string
  name: string
  icon: string
  description: string
  status: 'available' | 'coming-soon'
  featureFlag?: keyof ReturnType<typeof getFeatureAccess>
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    description: 'Read and send emails via Gmail',
    status: 'available',
    featureFlag: 'gmail'
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: '📅',
    description: 'Manage calendar events and meetings',
    status: 'available',
    featureFlag: 'calendar'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Send messages and notifications',
    status: 'available',
    featureFlag: 'slack'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Bot integration and server management',
    status: 'available',
    featureFlag: 'discord'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Repository management and code operations',
    status: 'available',
    featureFlag: 'github'
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📝',
    description: 'Manage pages and databases',
    status: 'coming-soon'
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: '📊',
    description: 'Issue tracking and project management',
    status: 'coming-soon'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    description: 'Post tweets and manage timeline',
    status: 'coming-soon'
  },
]

export default function IntegrationsPage() {
  const { user } = useAuth()
  const access = getFeatureAccess(user?.email)

  return (
    <AppLayout>
      <div className="min-h-screen text-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Integrations</h1>
            <p className="text-gray-400">
              Connect external services to extend Cubiqo's capabilities
            </p>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INTEGRATIONS.map((integration) => {
              const isEnabled = integration.featureFlag ? access[integration.featureFlag] : false
              const isComingSoon = integration.status === 'coming-soon'
              const canUse = isEnabled && !isComingSoon

              return (
                <div
                  key={integration.id}
                  className={`
                    bg-gray-900 rounded-xl p-6 border transition-all
                    ${canUse 
                      ? 'border-green-500/30 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10' 
                      : 'border-gray-800'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{integration.icon}</div>
                    {isComingSoon && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                    {!isComingSoon && isEnabled && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Available
                      </span>
                    )}
                    {!isComingSoon && !isEnabled && (
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{integration.name}</h3>
                  <p className="text-gray-400 mb-4 text-sm">
                    {integration.description}
                  </p>

                  <button
                    disabled={!canUse}
                    className={`
                      w-full px-4 py-2 rounded-lg font-semibold transition-all
                      ${canUse
                        ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {isComingSoon ? 'Coming Soon' : canUse ? 'Configure' : 'Not Available'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Info Banner */}
          <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">
              ℹ️ About Integrations
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Integrations allow Cubiqo agents to interact with external services</li>
              <li>• Each integration requires proper authentication and permissions</li>
              <li>• Founders can enable/disable integrations via the Founder Portal</li>
              <li>• More integrations coming soon based on user demand</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
