'use client'

/**
 * Connections Panel - Connect Git, Vercel, and other services
 * First thing founders do after login
 */

import { useState } from 'react'

interface Connection {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  status?: 'connected' | 'error' | 'pending'
}

export function ConnectionsPanel() {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: '🐙',
      description: 'Connect to repository for version control',
      connected: false,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: '▲',
      description: 'Deploy and manage production builds',
      connected: false,
    },
    {
      id: 'supabase',
      name: 'Supabase',
      icon: '⚡',
      description: 'Database and authentication',
      connected: true, // Already connected
      status: 'connected',
    },
  ])

  const handleConnect = async (id: string) => {
    if (id === 'github') {
      // GitHub OAuth flow
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
      const redirectUri = `${window.location.origin}/admin/connections/github/callback`
      const scope = 'repo,read:user'
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    } else if (id === 'vercel') {
      // Vercel OAuth flow
      const clientId = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID
      const redirectUri = `${window.location.origin}/admin/connections/vercel/callback`
      window.location.href = `https://vercel.com/integrations/new?clientId=${clientId}&redirect_uri=${redirectUri}`
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">🔗 Connect Services</h2>
        <p className="text-gray-400">
          Connect CubiQo to essential services for development and deployment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`
              bg-gray-800 rounded-lg p-6 border-2 transition-all
              ${conn.connected 
                ? 'border-green-500/50 bg-green-500/5' 
                : 'border-gray-700 hover:border-purple-500/50'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{conn.icon}</div>
              {conn.connected && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold">
                  ✓ Connected
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{conn.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{conn.description}</p>

            {!conn.connected ? (
              <button
                onClick={() => handleConnect(conn.id)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                Connect {conn.name}
              </button>
            ) : (
              <button
                className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                disabled
              >
                Connected
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick Setup Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
          <span>💡</span>
          Quick Setup Guide
        </h3>
        <ol className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">1.</span>
            <span><strong>Connect GitHub</strong> - Link your repository for version control and deployments</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">2.</span>
            <span><strong>Connect Vercel</strong> - Enable automatic deployments when you push code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">3.</span>
            <span><strong>Configure Features</strong> - Use the Feature Toggles tab to control what users see</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
