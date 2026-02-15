'use client'

/**
 * Connections Panel - Connect Git, Vercel, and other services
 * First thing founders do after login
 */

import { useState, useEffect } from 'react'

interface Connection {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  status?: 'connected' | 'error' | 'pending'
}

interface VercelProject {
  id: string
  name: string
  framework: string
  productionDomain: string | null
  latestDeployment: {
    id: string
    url: string
    state: string
    readyState: string
    createdAt: number
    ready: number
    target: string
  } | null
}

interface DeploymentStatus {
  [projectId: string]: {
    deploying: boolean
    error?: string
  }
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

  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({})

  // Check URL for OAuth success/error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'vercel_connected') {
      // Update connection status
      setConnections(prev => prev.map(conn =>
        conn.id === 'vercel' ? { ...conn, connected: true, status: 'connected' } : conn
      ))
      // Fetch projects
      fetchVercelProjects()
      // Clean URL
      window.history.replaceState({}, '', '/admin')
    }

    if (error) {
      alert(`Connection error: ${params.get('message') || error}`)
      window.history.replaceState({}, '', '/admin')
    }
  }, [])

  // Fetch Vercel projects on mount if connected
  useEffect(() => {
    checkVercelConnection()
  }, [])

  const checkVercelConnection = async () => {
    try {
      const response = await fetch('/api/admin/connections/vercel/projects')
      if (response.ok) {
        const data = await response.json()
        if (data.connected) {
          setConnections(prev => prev.map(conn =>
            conn.id === 'vercel' ? { ...conn, connected: true, status: 'connected' } : conn
          ))
          setVercelProjects(data.projects || [])
        }
      }
    } catch (error) {
      console.error('Error checking Vercel connection:', error)
    }
  }

  const fetchVercelProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch('/api/admin/connections/vercel/projects')
      const data = await response.json()
      
      if (data.connected) {
        setVercelProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching Vercel projects:', error)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleConnect = async (id: string) => {
    if (id === 'github') {
      // GitHub OAuth flow
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
      const redirectUri = `${window.location.origin}/api/admin/connections/github/callback`
      const scope = 'repo,read:user'
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    } else if (id === 'vercel') {
      // Vercel OAuth flow
      const clientId = process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID
      const redirectUri = `${window.location.origin}/api/admin/connections/vercel/callback`
      window.location.href = `https://vercel.com/integrations/${clientId}?redirect_uri=${encodeURIComponent(redirectUri)}`
    }
  }

  const handleDeploy = async (projectId: string) => {
    setDeploymentStatus(prev => ({
      ...prev,
      [projectId]: { deploying: true }
    }))

    try {
      const response = await fetch('/api/admin/connections/vercel/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          target: 'production'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed')
      }

      // Poll for deployment status
      const deploymentId = data.deployment.id
      pollDeploymentStatus(deploymentId, projectId)

      alert(`🚀 Deployment started!\nURL: ${data.deployment.url}`)
    } catch (error: any) {
      console.error('Deployment error:', error)
      setDeploymentStatus(prev => ({
        ...prev,
        [projectId]: { deploying: false, error: error.message }
      }))
      alert(`Deployment failed: ${error.message}`)
    }
  }

  const pollDeploymentStatus = async (deploymentId: string, projectId: string) => {
    const maxAttempts = 60 // 5 minutes
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setDeploymentStatus(prev => ({
          ...prev,
          [projectId]: { deploying: false }
        }))
        return
      }

      try {
        const response = await fetch(`/api/admin/connections/vercel/deploy?deploymentId=${deploymentId}`)
        const data = await response.json()

        if (data.state === 'READY') {
          setDeploymentStatus(prev => ({
            ...prev,
            [projectId]: { deploying: false }
          }))
          // Refresh projects list
          fetchVercelProjects()
          alert(`✅ Deployment complete!\n${data.url}`)
        } else if (data.state === 'ERROR') {
          setDeploymentStatus(prev => ({
            ...prev,
            [projectId]: { deploying: false, error: 'Deployment failed' }
          }))
          alert('❌ Deployment failed. Check Vercel dashboard for details.')
        } else {
          // Still building, poll again
          attempts++
          setTimeout(poll, 5000)
        }
      } catch (error) {
        console.error('Error polling deployment:', error)
        setDeploymentStatus(prev => ({
          ...prev,
          [projectId]: { deploying: false }
        }))
      }
    }

    poll()
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Vercel? You can reconnect anytime.')) return

    try {
      const response = await fetch('/api/admin/connections/vercel/projects', {
        method: 'DELETE',
      })

      if (response.ok) {
        setConnections(prev => prev.map(conn =>
          conn.id === 'vercel' ? { ...conn, connected: false, status: undefined } : conn
        ))
        setVercelProjects([])
        alert('✅ Vercel disconnected')
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Failed to disconnect Vercel')
    }
  }

  const getDeploymentStatusColor = (state: string) => {
    switch (state) {
      case 'READY': return 'text-green-400'
      case 'BUILDING': return 'text-yellow-400'
      case 'ERROR': return 'text-red-400'
      case 'QUEUED': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getDeploymentStatusIcon = (state: string) => {
    switch (state) {
      case 'READY': return '✅'
      case 'BUILDING': return '🔨'
      case 'ERROR': return '❌'
      case 'QUEUED': return '⏳'
      default: return '⚪'
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
            ) : conn.id === 'vercel' ? (
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold transition-colors"
              >
                Disconnect
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

      {/* Vercel Projects Section */}
      {connections.find(c => c.id === 'vercel')?.connected && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>▲</span>
              Vercel Projects
            </h3>
            <button
              onClick={fetchVercelProjects}
              disabled={loadingProjects}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors disabled:opacity-50"
            >
              {loadingProjects ? '⟳ Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {loadingProjects ? (
            <div className="text-center py-8 text-gray-400">Loading projects...</div>
          ) : vercelProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No projects found. Create a project on Vercel first.
            </div>
          ) : (
            <div className="space-y-3">
              {vercelProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-bold text-white">{project.name}</h4>
                        {project.framework && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {project.framework}
                          </span>
                        )}
                      </div>

                      {project.productionDomain && (
                        <a
                          href={`https://${project.productionDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          {project.productionDomain} ↗
                        </a>
                      )}

                      {project.latestDeployment && (
                        <div className="mt-2 text-sm text-gray-400">
                          <span className={`font-semibold ${getDeploymentStatusColor(project.latestDeployment.readyState)}`}>
                            {getDeploymentStatusIcon(project.latestDeployment.readyState)} {project.latestDeployment.readyState}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(project.latestDeployment.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeploy(project.id)}
                      disabled={deploymentStatus[project.id]?.deploying}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                    >
                      {deploymentStatus[project.id]?.deploying ? '🔨 Deploying...' : '🚀 Deploy'}
                    </button>
                  </div>

                  {deploymentStatus[project.id]?.error && (
                    <div className="mt-2 text-sm text-red-400">
                      ❌ {deploymentStatus[project.id].error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
