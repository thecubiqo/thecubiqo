'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Deployment {
  id: string
  status: 'DRAFT' | 'BUILDING' | 'BUILT' | 'DEPLOYED' | 'FAILED'
  port: number | null
  sslEnabled: boolean
  createdAt: string
  domain: {
    id: string
    domainName: string
    status: string
  }
  template: {
    id: string
    name: string
  }
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    domainId: '',
    templateId: '',
  })
  const [domains, setDomains] = useState<Array<{ id: string; domainName: string }>>([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchDeployments()
    fetchDomains()
    fetchTemplates()
  }, [])

  const fetchDeployments = async () => {
    try {
      const res = await fetch('/api/deployments')
      const data = await res.json()
      setDeployments(data.deployments || [])
    } catch (error) {
      console.error('Error fetching deployments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormData({ domainId: '', templateId: '' })
        setShowCreateForm(false)
        fetchDeployments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create deployment')
      }
    } catch (error) {
      console.error('Error creating deployment:', error)
      alert('Failed to create deployment')
    }
  }

  const handleDeploy = async (id: string, enableSSL: boolean = false) => {
    if (!confirm(`Deploy this site${enableSSL ? ' with SSL' : ''}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/deployments/${id}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableSSL }),
      })

      if (res.ok) {
        alert('Deployment started! Check status in a few moments.')
        setTimeout(() => fetchDeployments(), 2000)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to start deployment')
      }
    } catch (error) {
      console.error('Error deploying:', error)
      alert('Failed to start deployment')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deployment?')) {
      return
    }

    try {
      const res = await fetch(`/api/deployments/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchDeployments()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete deployment')
      }
    } catch (error) {
      console.error('Error deleting deployment:', error)
      alert('Failed to delete deployment')
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
        <div className="text-slate-400">Loading deployments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Deployments</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create Deployment'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Deployment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Domain
                </label>
                <select
                  value={formData.domainId}
                  onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.domainName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Template
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Deployment
              </button>
            </form>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  SSL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/30 divide-y divide-slate-700">
              {deployments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                    No deployments found. Create your first deployment to get started.
                  </td>
                </tr>
              ) : (
                deployments.map((deployment) => (
                  <tr key={deployment.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/deployments/${deployment.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {deployment.domain.domainName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {deployment.template.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deployment.status)}`}
                      >
                        {deployment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {deployment.port || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {deployment.sslEnabled ? '✓' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/deployments/${deployment.id}`}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        View
                      </Link>
                      {deployment.status !== 'BUILDING' && deployment.status !== 'DEPLOYED' ? (
                        <>
                          <button
                            onClick={() => handleDeploy(deployment.id, false)}
                            className="text-green-400 hover:text-green-300 mr-4"
                          >
                            Deploy
                          </button>
                          <button
                            onClick={() => handleDeploy(deployment.id, true)}
                            className="text-purple-400 hover:text-purple-300 mr-4"
                          >
                            Deploy + SSL
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => handleDelete(deployment.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

