'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Domain {
  id: string
  domainName: string
  status: 'PENDING' | 'ACTIVE' | 'DEPLOYED'
  dnsInstructions: string | null
  createdAt: string
  deployments: Array<{
    id: string
    status: string
    template: {
      id: string
      name: string
    }
  }>
}

export default function DomainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [domain, setDomain] = useState<Domain | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    domainName: '',
    dnsInstructions: '',
    status: 'PENDING' as const,
    googleAnalyticsId: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchDomain(params.id as string)
    }
  }, [params.id])

  const fetchDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/domains/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDomain(data.domain)
        setFormData({
          domainName: data.domain.domainName,
          dnsInstructions: data.domain.dnsInstructions || '',
          status: data.domain.status,
          googleAnalyticsId: data.domain.googleAnalyticsId || '',
        })
      }
    } catch (error) {
      console.error('Error fetching domain:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/domains/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setEditing(false)
        fetchDomain(params.id as string)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update domain')
      }
    } catch (error) {
      console.error('Error updating domain:', error)
      alert('Failed to update domain')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DEPLOYED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'ACTIVE':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
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

  if (!domain) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Domain not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/domains"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Domains
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {domain.domainName}
              </h1>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(domain.status)}`}
              >
                {domain.status}
              </span>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={formData.domainName}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DEPLOYED">Deployed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  DNS Instructions
                </label>
                <textarea
                  value={formData.dnsInstructions}
                  onChange={(e) => setFormData({ ...formData, dnsInstructions: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Google Analytics Measurement ID (GA4)
                </label>
                <input
                  type="text"
                  value={formData.googleAnalyticsId}
                  onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter your Google Analytics 4 Property ID (numeric). Find it in GA4 Admin → Property Settings → Property ID
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Created
                </label>
                <p className="text-white">
                  {new Date(domain.createdAt).toLocaleString()}
                </p>
              </div>
              {domain.dnsInstructions && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    DNS Instructions
                  </label>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono">
                      {domain.dnsInstructions}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Deployments</h2>
          {domain.deployments.length === 0 ? (
            <p className="text-slate-400">No deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {domain.deployments.map((deployment) => (
                <Link
                  key={deployment.id}
                  href={`/deployments/${deployment.id}`}
                  className="block p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">
                        {deployment.template.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        Status: {deployment.status}
                      </p>
                    </div>
                    <span className="text-blue-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

