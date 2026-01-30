'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Domain {
  id: string
  domainName: string
  status: 'PENDING' | 'ACTIVE' | 'DEPLOYED'
  dnsInstructions: string | null
  createdAt: string
  deployments: Array<{ id: string; status: string }>
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    domainName: '',
    dnsInstructions: '',
  })

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/domains')
      const data = await res.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormData({ domainName: '', dnsInstructions: '' })
        setShowAddForm(false)
        fetchDomains()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create domain')
      }
    } catch (error) {
      console.error('Error creating domain:', error)
      alert('Failed to create domain')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) {
      return
    }

    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchDomains()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete domain')
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      alert('Failed to delete domain')
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
        <div className="text-slate-400">Loading domains...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Domains</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showAddForm ? 'Cancel' : 'Add Domain'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Add New Domain</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={formData.domainName}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                  placeholder="example.com"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  DNS Instructions (optional)
                </label>
                <textarea
                  value={formData.dnsInstructions}
                  onChange={(e) => setFormData({ ...formData, dnsInstructions: e.target.value })}
                  placeholder="Add an A record pointing to your server IP..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Domain
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Deployments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/30 divide-y divide-slate-700">
              {domains.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
                    No domains found. Add your first domain to get started.
                  </td>
                </tr>
              ) : (
                domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/domains/${domain.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {domain.domainName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(domain.status)}`}
                      >
                        {domain.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {domain.deployments.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/domains/${domain.id}`}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/domains/${domain.id}/analytics`}
                        className="text-purple-400 hover:text-purple-300 mr-4"
                      >
                        Analytics
                      </Link>
                      <button
                        onClick={() => handleDelete(domain.id)}
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

