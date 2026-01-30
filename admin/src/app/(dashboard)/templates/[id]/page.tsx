'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  deployments: Array<{
    id: string
    status: string
    domain: {
      id: string
      domainName: string
      status: string
    }
  }>
}

export default function TemplateDetailPage() {
  const params = useParams()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTemplate(params.id as string)
    }
  }, [params.id])

  const fetchTemplate = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTemplate(data.template)
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Template not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/templates"
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Templates
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {template.name}
              </h1>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  template.isActive
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Link
              href={`/templates/${template.id}/config`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Configure
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <p className="text-white">
                {template.description || 'No description'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Created
              </label>
              <p className="text-white">
                {new Date(template.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Deployments</h2>
          {template.deployments.length === 0 ? (
            <p className="text-slate-400">No deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {template.deployments.map((deployment) => (
                <Link
                  key={deployment.id}
                  href={`/deployments/${deployment.id}`}
                  className="block p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">
                        {deployment.domain.domainName}
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

