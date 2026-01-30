'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Config {
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  text?: {
    siteName?: string
    tagline?: string
    description?: string
  }
  images?: {
    logo?: string
    hero?: string
  }
  videos?: {
    hero?: string
  }
  [key: string]: any
}

export default function TemplateConfigPage() {
  const params = useParams()
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchConfig()
    }
  }, [params.id])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/templates/${params.id}/config`)
      if (res.ok) {
        const data = await res.json()
        setConfig(data.configSchema || {})
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (path: string[], value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      let current: any = newConfig
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newConfig
    })
  }

  const handleFileUpload = async (file: File, type: string, path: string[]) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', type.toUpperCase())
      // Note: deploymentId would be needed - this is a simplified version
      // In real implementation, you'd need to create a deployment first or use a draft

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        handleConfigChange(path, data.upload.filePath)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/templates/${params.id}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Template
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6">
            Template Configuration
          </h1>

          <div className="space-y-6">
            {/* Colors Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Colors</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={config.colors?.primary || '#3b82f6'}
                    onChange={(e) =>
                      handleConfigChange(['colors', 'primary'], e.target.value)
                    }
                    className="w-full h-10 rounded border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={config.colors?.secondary || '#8b5cf6'}
                    onChange={(e) =>
                      handleConfigChange(['colors', 'secondary'], e.target.value)
                    }
                    className="w-full h-10 rounded border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={config.colors?.accent || '#10b981'}
                    onChange={(e) =>
                      handleConfigChange(['colors', 'accent'], e.target.value)
                    }
                    className="w-full h-10 rounded border border-slate-700"
                  />
                </div>
              </div>
            </section>

            {/* Text Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Text Content</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={config.text?.siteName || ''}
                    onChange={(e) =>
                      handleConfigChange(['text', 'siteName'], e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Site Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={config.text?.tagline || ''}
                    onChange={(e) =>
                      handleConfigChange(['text', 'tagline'], e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your tagline"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={config.text?.description || ''}
                    onChange={(e) =>
                      handleConfigChange(['text', 'description'], e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Site description"
                  />
                </div>
              </div>
            </section>

            {/* Images Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Images</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, 'LOGO', ['images', 'logo'])
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {config.images?.logo && (
                    <p className="text-sm text-slate-400 mt-1">
                      Current: {config.images.logo}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hero Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, 'IMAGE', ['images', 'hero'])
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {config.images?.hero && (
                    <p className="text-sm text-slate-400 mt-1">
                      Current: {config.images.hero}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Videos Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Videos</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hero Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file, 'VIDEO', ['videos', 'hero'])
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {config.videos?.hero && (
                  <p className="text-sm text-slate-400 mt-1">
                    Current: {config.videos.hero}
                  </p>
                )}
              </div>
            </section>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => {
                  // Save config - would need deployment ID
                  alert('Configuration saved! (In full implementation, this would save to a deployment)')
                }}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

