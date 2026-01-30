'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Template1Config, defaultTemplate1Config } from '@/lib/template-config-schema'

export default function ConfigureDeploymentPage() {
  const params = useParams()
  const router = useRouter()
  const [deployment, setDeployment] = useState<any>(null)
  const [config, setConfig] = useState<Template1Config>(defaultTemplate1Config)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('metadata')

  useEffect(() => {
    if (params.id) {
      fetchDeployment(params.id as string)
    }
  }, [params.id])

  const fetchDeployment = async (id: string) => {
    try {
      const res = await fetch(`/api/deployments/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDeployment(data.deployment)
        if (data.deployment.config?.configJson) {
          setConfig({ ...defaultTemplate1Config, ...data.deployment.config.configJson })
        }
      }
    } catch (error) {
      console.error('Error fetching deployment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/deployments/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (res.ok) {
        // Update config in database
        await fetch(`/api/deployments/${params.id}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configJson: config }),
        })
        alert('Configuration saved!')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev } as any
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const sections = [
    { id: 'metadata', label: 'Site Info' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'hero', label: 'Hero Section' },
    { id: 'colors', label: 'Colors' },
    { id: 'devices', label: 'Features & Images' },
    { id: 'video', label: 'Video Section' },
    { id: 'contact', label: 'Contact' },
    { id: 'footer', label: 'Footer' },
  ]

  const handleFileUpload = async (file: File, fieldPath: string[]) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('deploymentId', params.id as string)
      formData.append('fileType', file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        updateConfig(fieldPath, data.upload.filePath)
        alert('File uploaded successfully!')
      } else {
        alert('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/deployments/${params.id}`}
            className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to Deployment
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Configure {deployment?.domain?.domainName}
              </h1>
              <p className="text-slate-400">Template: {deployment?.template?.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Save config temporarily for preview
                  const previewUrl = `/api/deployments/${params.id}/preview?config=${encodeURIComponent(JSON.stringify(config))}`
                  window.open(previewUrl, '_blank', 'width=1400,height=900')
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                👁️ Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Configuration Forms */}
          <div className="space-y-6">
            {activeSection === 'metadata' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Site Metadata</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Site Title</label>
                  <input
                    type="text"
                    value={config.metadata.title}
                    onChange={(e) => updateConfig(['metadata', 'title'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={config.metadata.description}
                    onChange={(e) => updateConfig(['metadata', 'description'], e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeSection === 'navigation' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Logo Text</label>
                  <input
                    type="text"
                    value={config.navigation.logoText}
                    onChange={(e) => updateConfig(['navigation', 'logoText'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Logo Icon/Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, ['navigation', 'logoIcon'])
                    }}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  {config.navigation.logoIcon && (
                    <p className="text-xs text-slate-400 mt-1">Current: {config.navigation.logoIcon}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Navigation Links</label>
                  {config.navigation.links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const newLinks = [...config.navigation.links]
                          newLinks[idx].label = e.target.value
                          updateConfig(['navigation', 'links'], newLinks)
                        }}
                        placeholder="Label"
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={link.href}
                        onChange={(e) => {
                          const newLinks = [...config.navigation.links]
                          newLinks[idx].href = e.target.value
                          updateConfig(['navigation', 'links'], newLinks)
                        }}
                        placeholder="URL"
                        className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'hero' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Hero Section</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={config.hero.tagline}
                    onChange={(e) => updateConfig(['hero', 'tagline'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Background Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, ['hero', 'backgroundImage'])
                    }}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  {config.hero.backgroundImage && (
                    <p className="text-xs text-slate-400 mt-1">Current: {config.hero.backgroundImage}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Background Video (optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, ['hero', 'backgroundVideo'])
                    }}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  {config.hero.backgroundVideo && (
                    <p className="text-xs text-slate-400 mt-1">Current: {config.hero.backgroundVideo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Heading Line 1</label>
                  <input
                    type="text"
                    value={config.hero.headingLine1}
                    onChange={(e) => updateConfig(['hero', 'headingLine1'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Heading Line 2</label>
                  <input
                    type="text"
                    value={config.hero.headingLine2}
                    onChange={(e) => updateConfig(['hero', 'headingLine2'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subtitle</label>
                  <textarea
                    value={config.hero.subtitle}
                    onChange={(e) => updateConfig(['hero', 'subtitle'], e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Primary CTA Text</label>
                    <input
                      type="text"
                      value={config.hero.primaryCTA.text}
                      onChange={(e) => updateConfig(['hero', 'primaryCTA', 'text'], e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Secondary CTA Text</label>
                    <input
                      type="text"
                      value={config.hero.secondaryCTA.text}
                      onChange={(e) => updateConfig(['hero', 'secondaryCTA', 'text'], e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'colors' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Color Scheme</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={config.colors.primary}
                      onChange={(e) => updateConfig(['colors', 'primary'], e.target.value)}
                      className="w-full h-12 rounded-lg border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Secondary Color</label>
                    <input
                      type="color"
                      value={config.colors.secondary}
                      onChange={(e) => updateConfig(['colors', 'secondary'], e.target.value)}
                      className="w-full h-12 rounded-lg border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Accent Color</label>
                    <input
                      type="color"
                      value={config.colors.accent}
                      onChange={(e) => updateConfig(['colors', 'accent'], e.target.value)}
                      className="w-full h-12 rounded-lg border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'devices' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Features & Device Images</h3>
                
                {/* Device Images */}
                <div className="space-y-4 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <h4 className="text-md font-semibold text-white mb-3">Device Images</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, ['devices', 'mobileImage'])
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                    {config.devices.mobileImage && (
                      <p className="text-xs text-slate-400 mt-1">Current: {config.devices.mobileImage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Watch Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, ['devices', 'watchImage'])
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                    {config.devices.watchImage && (
                      <p className="text-xs text-slate-400 mt-1">Current: {config.devices.watchImage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tablet Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file, ['devices', 'tabletImage'])
                      }}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                    {config.devices.tabletImage && (
                      <p className="text-xs text-slate-400 mt-1">Current: {config.devices.tabletImage}</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white mb-3">Feature Cards</h4>
                  {config.devices.features.map((feature, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Feature Title</label>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => {
                            const newFeatures = [...config.devices.features]
                            newFeatures[idx].title = e.target.value
                            updateConfig(['devices', 'features'], newFeatures)
                          }}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                          value={feature.description}
                          onChange={(e) => {
                            const newFeatures = [...config.devices.features]
                            newFeatures[idx].description = e.target.value
                            updateConfig(['devices', 'features'], newFeatures)
                          }}
                          rows={2}
                          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'video' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Video Section</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Video Title</label>
                  <input
                    type="text"
                    value={config.video.title || ''}
                    onChange={(e) => updateConfig(['video', 'title'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Video Description</label>
                  <textarea
                    value={config.video.description || ''}
                    onChange={(e) => updateConfig(['video', 'description'], e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, ['video', 'videoUrl'])
                    }}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  {config.video.videoUrl && (
                    <p className="text-xs text-slate-400 mt-1">Current: {config.video.videoUrl}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Video URL (or upload file above)</label>
                  <input
                    type="url"
                    value={config.video.videoUrl || ''}
                    onChange={(e) => updateConfig(['video', 'videoUrl'], e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeSection === 'contact' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Section</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Section Tagline</label>
                  <input
                    type="text"
                    value={config.contact.sectionTagline}
                    onChange={(e) => updateConfig(['contact', 'sectionTagline'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={config.contact.title}
                    onChange={(e) => updateConfig(['contact', 'title'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={config.contact.description}
                    onChange={(e) => updateConfig(['contact', 'description'], e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={config.contact.buttonText}
                    onChange={(e) => updateConfig(['contact', 'buttonText'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeSection === 'footer' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Footer</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Brand Name</label>
                  <input
                    type="text"
                    value={config.footer.brandName}
                    onChange={(e) => updateConfig(['footer', 'brandName'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Brand Description</label>
                  <textarea
                    value={config.footer.brandDescription}
                    onChange={(e) => updateConfig(['footer', 'brandDescription'], e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Copyright Text</label>
                  <input
                    type="text"
                    value={config.footer.copyrightText}
                    onChange={(e) => updateConfig(['footer', 'copyrightText'], e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

