'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Region {
  id: string
  regionId: string
  configJson: any
  createdAt: string
  updatedAt: string
}

interface RegionFormData {
  id: string
  countryCode: string
  name: string
  locale: string
  routing: {
    path: string
    domain: string | null
    defaultRoute: 'main' | 'regional'
    mainEnabled: boolean
    regionalEnabled: boolean
  }
  localization: {
    timezone: string
    currency: string
    dateFormat: string
    dialects: string[]
  }
  cultural: {
    festivals: Array<{
      name: string
      date: string
      type: 'national' | 'religious' | 'cultural'
    }>
    greetings: {
      morning: string
      afternoon: string
      evening: string
    }
    references: string[]
  }
  appearance: {
    defaultColor: 'ORANGE' | 'RED' | 'YELLOW' | 'GREEN_BLUE'
    performanceMode: 'full' | 'reduced'
    theme: 'dark' | 'light' | 'system'
  }
  features: {
    voice: boolean
    chat: boolean
    memory: boolean
    auth: boolean
  }
  ai: {
    systemPromptAdditions: string
    toneModifiers: string[]
  }
}

const defaultFormData: RegionFormData = {
  id: '',
  countryCode: '',
  name: '',
  locale: '',
  routing: {
    path: '',
    domain: null,
    defaultRoute: 'main',
    mainEnabled: true,
    regionalEnabled: true,
  },
  localization: {
    timezone: '',
    currency: '',
    dateFormat: '',
    dialects: [],
  },
  cultural: {
    festivals: [],
    greetings: {
      morning: '',
      afternoon: '',
      evening: '',
    },
    references: [],
  },
  appearance: {
    defaultColor: 'ORANGE',
    performanceMode: 'full',
    theme: 'dark',
  },
  features: {
    voice: true,
    chat: true,
    memory: true,
    auth: true,
  },
  ai: {
    systemPromptAdditions: '',
    toneModifiers: [],
  },
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [formData, setFormData] = useState<RegionFormData>(defaultFormData)

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/regions')
      const data = await res.json()
      setRegions(data.regions || [])
    } catch (error) {
      console.error('Error fetching regions:', error)
    } finally {
      setLoading(false)
    }
  }

  const jsonToFormData = (json: any): RegionFormData => {
    return {
      id: json.id || '',
      countryCode: json.countryCode || '',
      name: json.name || '',
      locale: json.locale || '',
      routing: {
        path: json.routing?.path || '',
        domain: json.routing?.domain || null,
        defaultRoute: json.routing?.defaultRoute || 'main',
        mainEnabled: json.routing?.mainEnabled ?? true,
        regionalEnabled: json.routing?.regionalEnabled ?? true,
      },
      localization: {
        timezone: json.localization?.timezone || '',
        currency: json.localization?.currency || '',
        dateFormat: json.localization?.dateFormat || '',
        dialects: json.localization?.dialects || [],
      },
      cultural: {
        festivals: json.cultural?.festivals || [],
        greetings: {
          morning: json.cultural?.greetings?.morning || '',
          afternoon: json.cultural?.greetings?.afternoon || '',
          evening: json.cultural?.greetings?.evening || '',
        },
        references: json.cultural?.references || [],
      },
      appearance: {
        defaultColor: json.appearance?.defaultColor || 'ORANGE',
        performanceMode: json.appearance?.performanceMode || 'full',
        theme: json.appearance?.theme || 'dark',
      },
      features: {
        voice: json.features?.voice ?? true,
        chat: json.features?.chat ?? true,
        memory: json.features?.memory ?? true,
        auth: json.features?.auth ?? true,
      },
      ai: {
        systemPromptAdditions: json.ai?.systemPromptAdditions || '',
        toneModifiers: json.ai?.toneModifiers || [],
      },
    }
  }

  const formDataToJson = (data: RegionFormData): any => {
    const json: any = {
      id: data.id,
      countryCode: data.countryCode,
      name: data.name,
      locale: data.locale,
    }

    if (data.routing.path || data.routing.domain !== null) {
      json.routing = {
        ...data.routing,
        domain: data.routing.domain || null,
      }
    }

    if (data.localization.timezone || data.localization.currency || data.localization.dateFormat || data.localization.dialects.length > 0) {
      json.localization = { ...data.localization }
    }

    if (data.cultural.festivals.length > 0 || data.cultural.greetings.morning || data.cultural.references.length > 0) {
      json.cultural = {
        festivals: data.cultural.festivals,
        greetings: data.cultural.greetings,
        references: data.cultural.references,
      }
    }

    json.appearance = data.appearance
    json.features = data.features

    if (data.ai.systemPromptAdditions || data.ai.toneModifiers.length > 0) {
      json.ai = { ...data.ai }
    }

    return json
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const configJson = formDataToJson(formData)
      const regionId = configJson.id

      const url = editingRegion ? `/api/regions/${editingRegion.id}` : '/api/regions'
      const method = editingRegion ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionId,
          configJson,
        }),
      })

      if (res.ok) {
        setFormData(defaultFormData)
        setShowForm(false)
        setEditingRegion(null)
        fetchRegions()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save region')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleEdit = (region: Region) => {
    setEditingRegion(region)
    setFormData(jsonToFormData(region.configJson))
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this region?')) {
      return
    }

    try {
      const res = await fetch(`/api/regions/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchRegions()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete region')
      }
    } catch (error) {
      console.error('Error deleting region:', error)
      alert('Failed to delete region')
    }
  }

  const addArrayItem = (path: string[], value: any) => {
    if (path[0] === 'localization' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        localization: {
          ...prev.localization,
          dialects: [...prev.localization.dialects, value],
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          festivals: [...prev.cultural.festivals, value],
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'references') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          references: [...prev.cultural.references, value],
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: [...prev.ai.toneModifiers, value],
        },
      }))
    }
  }

  const removeArrayItem = (path: string[], index: number) => {
    if (path[0] === 'localization' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        localization: {
          ...prev.localization,
          dialects: prev.localization.dialects.filter((_, i) => i !== index),
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          festivals: prev.cultural.festivals.filter((_, i) => i !== index),
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'references') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          references: prev.cultural.references.filter((_, i) => i !== index),
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: prev.ai.toneModifiers.filter((_, i) => i !== index),
        },
      }))
    }
  }

  const updateArrayItem = (path: string[], index: number, value: any) => {
    if (path[0] === 'localization' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        localization: {
          ...prev.localization,
          dialects: prev.localization.dialects.map((item, i) => i === index ? value : item),
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          festivals: prev.cultural.festivals.map((item, i) => i === index ? value : item),
        },
      }))
    } else if (path[0] === 'cultural' && path[1] === 'references') {
      setFormData((prev) => ({
        ...prev,
        cultural: {
          ...prev.cultural,
          references: prev.cultural.references.map((item, i) => i === index ? value : item),
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: prev.ai.toneModifiers.map((item, i) => i === index ? value : item),
        },
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading regions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/cubiqo-generator" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
              ← Back to Cubiqo Generator
            </Link>
            <h1 className="text-3xl font-bold text-white">Regions</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true)
                setEditingRegion(null)
                setFormData(defaultFormData)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Region
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingRegion ? 'Edit Region' : 'Create New Region'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Region ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                      pattern="^[a-z]{2,3}$"
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="uk"
                    />
                    <p className="mt-1 text-xs text-slate-400">2-3 lowercase letters (e.g., uk, in, jp)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Country Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                      pattern="^[A-Z]{2}$"
                      maxLength={2}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="GB"
                    />
                    <p className="mt-1 text-xs text-slate-400">ISO 3166-1 alpha-2 (e.g., GB, US, IN)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="United Kingdom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Locale <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.locale}
                      onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                      pattern="^[a-z]{2}-[A-Z]{2}$"
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="en-GB"
                    />
                    <p className="mt-1 text-xs text-slate-400">BCP 47 format (e.g., en-GB, hi-IN)</p>
                  </div>
                </div>
              </div>

              {/* Routing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Routing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Path</label>
                    <input
                      type="text"
                      value={formData.routing.path}
                      onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, path: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/uk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Domain (optional)</label>
                    <input
                      type="text"
                      value={formData.routing.domain || ''}
                      onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, domain: e.target.value || null } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="cubiqo.uk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Route</label>
                    <select
                      value={formData.routing.defaultRoute}
                      onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, defaultRoute: e.target.value as 'main' | 'regional' } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="main">Main</option>
                      <option value="regional">Regional</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.routing.mainEnabled}
                        onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, mainEnabled: e.target.checked } })}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Main Enabled</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.routing.regionalEnabled}
                        onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, regionalEnabled: e.target.checked } })}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">Regional Enabled</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Localization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Localization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                    <input
                      type="text"
                      value={formData.localization.timezone}
                      onChange={(e) => setFormData({ ...formData, localization: { ...formData.localization, timezone: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Europe/London"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                    <input
                      type="text"
                      value={formData.localization.currency}
                      onChange={(e) => setFormData({ ...formData, localization: { ...formData.localization, currency: e.target.value.toUpperCase() } })}
                      maxLength={3}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="GBP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
                    <input
                      type="text"
                      value={formData.localization.dateFormat}
                      onChange={(e) => setFormData({ ...formData, localization: { ...formData.localization, dateFormat: e.target.value } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dialects</label>
                  <div className="space-y-2">
                    {formData.localization.dialects.map((dialect, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={dialect}
                          onChange={(e) => {
                            const newDialects = [...formData.localization.dialects]
                            newDialects[index] = e.target.value
                            setFormData({ ...formData, localization: { ...formData.localization, dialects: newDialects } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="British English"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(['localization', 'dialects'], index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem(['localization', 'dialects'], '')}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      + Add Dialect
                    </button>
                  </div>
                </div>
              </div>

              {/* Cultural */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Cultural</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Festivals</label>
                  <div className="space-y-3">
                    {formData.cultural.festivals.map((festival, index) => (
                      <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                          <input
                            type="text"
                            value={festival.name}
                            onChange={(e) => updateArrayItem(['cultural', 'festivals'], index, { ...festival, name: e.target.value })}
                            placeholder="Festival name"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={festival.date}
                            onChange={(e) => updateArrayItem(['cultural', 'festivals'], index, { ...festival, date: e.target.value })}
                            placeholder="Date (e.g., 01-01 or variable)"
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <select
                            value={festival.type}
                            onChange={(e) => updateArrayItem(['cultural', 'festivals'], index, { ...festival, type: e.target.value })}
                            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="national">National</option>
                            <option value="religious">Religious</option>
                            <option value="cultural">Cultural</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeArrayItem(['cultural', 'festivals'], index)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remove Festival
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem(['cultural', 'festivals'], { name: '', date: '', type: 'national' })}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      + Add Festival
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Morning Greeting</label>
                    <input
                      type="text"
                      value={formData.cultural.greetings.morning}
                      onChange={(e) => setFormData({ ...formData, cultural: { ...formData.cultural, greetings: { ...formData.cultural.greetings, morning: e.target.value } } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Good morning"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Afternoon Greeting</label>
                    <input
                      type="text"
                      value={formData.cultural.greetings.afternoon}
                      onChange={(e) => setFormData({ ...formData, cultural: { ...formData.cultural, greetings: { ...formData.cultural.greetings, afternoon: e.target.value } } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Good afternoon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Evening Greeting</label>
                    <input
                      type="text"
                      value={formData.cultural.greetings.evening}
                      onChange={(e) => setFormData({ ...formData, cultural: { ...formData.cultural, greetings: { ...formData.cultural.greetings, evening: e.target.value } } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Good evening"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Cultural References</label>
                  <div className="space-y-2">
                    {formData.cultural.references.map((ref, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={ref}
                          onChange={(e) => {
                            const newRefs = [...formData.cultural.references]
                            newRefs[index] = e.target.value
                            setFormData({ ...formData, cultural: { ...formData.cultural, references: newRefs } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Cultural reference"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(['cultural', 'references'], index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem(['cultural', 'references'], '')}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      + Add Reference
                    </button>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Color</label>
                    <select
                      value={formData.appearance.defaultColor}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, defaultColor: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ORANGE">Orange</option>
                      <option value="RED">Red</option>
                      <option value="YELLOW">Yellow</option>
                      <option value="GREEN_BLUE">Green Blue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Performance Mode</label>
                    <select
                      value={formData.appearance.performanceMode}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, performanceMode: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="full">Full</option>
                      <option value="reduced">Reduced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                    <select
                      value={formData.appearance.theme}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, theme: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formData.features).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setFormData({ ...formData, features: { ...formData.features, [key]: e.target.checked } })}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300 capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">AI Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">System Prompt Additions</label>
                  <textarea
                    value={formData.ai.systemPromptAdditions}
                    onChange={(e) => setFormData({ ...formData, ai: { ...formData.ai, systemPromptAdditions: e.target.value } })}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional context for AI system prompt..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tone Modifiers</label>
                  <div className="space-y-2">
                    {formData.ai.toneModifiers.map((modifier, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={modifier}
                          onChange={(e) => {
                            const newModifiers = [...formData.ai.toneModifiers]
                            newModifiers[index] = e.target.value
                            setFormData({ ...formData, ai: { ...formData.ai, toneModifiers: newModifiers } })
                          }}
                          className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="polite, casual, formal..."
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(['ai', 'toneModifiers'], index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem(['ai', 'toneModifiers'], '')}
                      className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      + Add Tone Modifier
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRegion ? 'Update' : 'Create'} Region
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingRegion(null)
                    setFormData(defaultFormData)
                  }}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Region ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Country Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Locale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {regions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No regions found. Create your first region above.
                  </td>
                </tr>
              ) : (
                regions.map((region) => (
                  <tr key={region.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {region.regionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {region.configJson?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {region.configJson?.countryCode || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {region.configJson?.locale || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(region.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(region)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(region.id)}
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
