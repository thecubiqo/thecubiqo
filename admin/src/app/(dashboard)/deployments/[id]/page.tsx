'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Deployment {
  id: string
  status: 'DRAFT' | 'BUILDING' | 'BUILT' | 'DEPLOYED' | 'FAILED'
  port: number | null
  sslEnabled: boolean
  buildPath: string | null
  nginxConfigPath: string | null
  createdAt: string
  domain: {
    id: string
    domainName: string
    status: string
    dnsInstructions: string | null
  }
  template: {
    id: string
    name: string
  }
  config: {
    configJson: any
  } | null
  uploads: Array<{
    id: string
    fileType: string
    originalName: string
  }>
}

export default function DeploymentDetailPage() {
  const params = useParams()
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDeployment(params.id as string)
      // Poll for status updates
      const interval = setInterval(() => {
        fetchDeployment(params.id as string)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [params.id])

  const fetchDeployment = async (id: string) => {
    try {
      const res = await fetch(`/api/deployments/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDeployment(data.deployment)
      }
    } catch (error) {
      console.error('Error fetching deployment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async (enableSSL: boolean = false) => {
    if (!deployment) return
    setDeploying(true)

    try {
      const res = await fetch(`/api/deployments/${deployment.id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableSSL }),
      })

      if (res.ok) {
        alert('Deployment started! This page will auto-refresh.')
        setTimeout(() => {
          fetchDeployment(deployment.id)
          setDeploying(false)
        }, 2000)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to start deployment')
        setDeploying(false)
      }
    } catch (error) {
      console.error('Error deploying:', error)
      alert('Failed to start deployment')
      setDeploying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'BUILT':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'BUILDING':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'DRAFT':
        return 'bg-slate-700/50 text-slate-300 border border-slate-600'
      default:
        return 'bg-slate-700/50 text-slate-300 border border-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!deployment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Deployment not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/deployments"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Deployments
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {deployment.domain.domainName}
              </h1>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(deployment.status)}`}
                >
                  {deployment.status}
                </span>
                {deployment.port && (
                  <span className="text-sm text-slate-400">
                    Port: {deployment.port}
                  </span>
                )}
                {deployment.sslEnabled && (
                  <span className="text-sm text-green-400 font-medium">
                    SSL Enabled
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/deployments/${deployment.id}/configure`}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Configure
              </Link>
              {(deployment.status === 'DRAFT' || deployment.status === 'BUILT') && (
                <>
                  <button
                    onClick={() => handleDeploy(false)}
                    disabled={deploying}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {deploying ? 'Deploying...' : 'Deploy'}
                  </button>
                  <button
                    onClick={() => handleDeploy(true)}
                    disabled={deploying}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {deploying ? 'Deploying...' : 'Deploy + SSL'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Template</h3>
              <p className="text-white">{deployment.template.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Created</h3>
              <p className="text-white">
                {new Date(deployment.createdAt).toLocaleString()}
              </p>
            </div>
            {deployment.buildPath && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Build Path</h3>
                <p className="text-white font-mono text-sm">{deployment.buildPath}</p>
              </div>
            )}
            {deployment.nginxConfigPath && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Nginx Config</h3>
                <p className="text-white font-mono text-sm">{deployment.nginxConfigPath}</p>
              </div>
            )}
          </div>
        </div>

        {deployment.domain.dnsInstructions && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">DNS Instructions</h2>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                {deployment.domain.dnsInstructions}
              </pre>
            </div>
          </div>
        )}

        {deployment.config && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Configuration</h2>
            <pre className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 overflow-auto text-slate-300">
              {JSON.stringify(deployment.config.configJson, null, 2)}
            </pre>
          </div>
        )}

        {deployment.uploads.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Uploaded Files</h2>
            <ul className="space-y-2">
              {deployment.uploads.map((upload) => (
                <li key={upload.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded border border-slate-700">
                  <span className="text-sm text-white">{upload.originalName}</span>
                  <span className="text-xs text-slate-400">{upload.fileType}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

