'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface World {
  id: string
  worldId: string
  configJson: any
  createdAt: string
  updatedAt: string
}

interface WorldFormData {
  id: string
  type: 'region' | 'product'
  name: string
  description: string
  routing: {
    path: string
    domain: string | null
    geoTrigger?: string
  }
  appearance: {
    defaultColor: 'ORANGE' | 'RED' | 'YELLOW' | 'GREEN_BLUE'
    theme: 'dark' | 'light' | 'system'
    cubeVariant?: string
  }
  features: {
    voice: boolean
    chat: boolean
    memory: boolean
    auth: boolean
    keyboard?: boolean
    debate?: boolean
  }
  ai: {
    systemPrompt: string
    toneModifiers: string[]
    voiceProfiles?: Array<{
      id: string
      name: string
      gender: 'male' | 'female'
      tone: string
    }>
  }
  regional?: {
    countryCode: string
    locale: string
    timezone: string
    currency: string
    dialects: string[]
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
  }
}

const defaultFormData: WorldFormData = {
  id: '',
  type: 'product',
  name: '',
  description: '',
  routing: {
    path: '',
    domain: null,
  },
  appearance: {
    defaultColor: 'ORANGE',
    theme: 'dark',
  },
  features: {
    voice: true,
    chat: true,
    memory: true,
    auth: true,
  },
  ai: {
    systemPrompt: '',
    toneModifiers: [],
  },
}

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWorld, setEditingWorld] = useState<World | null>(null)
  const [formData, setFormData] = useState<WorldFormData>(defaultFormData)

  useEffect(() => {
    fetchWorlds()
  }, [])

  const fetchWorlds = async () => {
    try {
      const res = await fetch('/api/worlds')
      const data = await res.json()
      setWorlds(data.worlds || [])
    } catch (error) {
      console.error('Error fetching worlds:', error)
    } finally {
      setLoading(false)
    }
  }

  const jsonToFormData = (json: any): WorldFormData => {
    const data: WorldFormData = {
      id: json.id || '',
      type: json.type || 'product',
      name: json.name || '',
      description: json.description || '',
      routing: {
        path: json.routing?.path || '',
        domain: json.routing?.domain || null,
        geoTrigger: json.routing?.geoTrigger,
      },
      appearance: {
        defaultColor: json.appearance?.defaultColor || 'ORANGE',
        theme: json.appearance?.theme || 'dark',
        cubeVariant: json.appearance?.cubeVariant,
      },
      features: {
        voice: json.features?.voice ?? true,
        chat: json.features?.chat ?? true,
        memory: json.features?.memory ?? true,
        auth: json.features?.auth ?? true,
        keyboard: json.features?.keyboard,
        debate: json.features?.debate,
      },
      ai: {
        systemPrompt: json.ai?.systemPrompt || '',
        toneModifiers: json.ai?.toneModifiers || [],
        voiceProfiles: json.ai?.voiceProfiles,
      },
    }

    if (json.type === 'region' && json.regional) {
      data.regional = {
        countryCode: json.regional.countryCode || '',
        locale: json.regional.locale || '',
        timezone: json.regional.timezone || '',
        currency: json.regional.currency || '',
        dialects: json.regional.dialects || [],
        festivals: json.regional.festivals || [],
        greetings: {
          morning: json.regional.greetings?.morning || '',
          afternoon: json.regional.greetings?.afternoon || '',
          evening: json.regional.greetings?.evening || '',
        },
      }
    }

    return data
  }

  const formDataToJson = (data: WorldFormData): any => {
    const json: any = {
      id: data.id,
      type: data.type,
      name: data.name,
      description: data.description,
      routing: {
        path: data.routing.path,
        domain: data.routing.domain || null,
      },
      appearance: {
        defaultColor: data.appearance.defaultColor,
        theme: data.appearance.theme,
      },
      features: {
        voice: data.features.voice,
        chat: data.features.chat,
        memory: data.features.memory,
        auth: data.features.auth,
      },
      ai: {
        systemPrompt: data.ai.systemPrompt,
        toneModifiers: data.ai.toneModifiers,
      },
    }

    if (data.routing.geoTrigger) {
      json.routing.geoTrigger = data.routing.geoTrigger
    }

    if (data.appearance.cubeVariant) {
      json.appearance.cubeVariant = data.appearance.cubeVariant
    }

    if (data.features.keyboard !== undefined) {
      json.features.keyboard = data.features.keyboard
    }

    if (data.features.debate !== undefined) {
      json.features.debate = data.features.debate
    }

    if (data.ai.voiceProfiles && data.ai.voiceProfiles.length > 0) {
      json.ai.voiceProfiles = data.ai.voiceProfiles
    }

    if (data.type === 'region' && data.regional) {
      json.regional = {
        countryCode: data.regional.countryCode,
        locale: data.regional.locale,
        timezone: data.regional.timezone,
        currency: data.regional.currency,
        dialects: data.regional.dialects,
        festivals: data.regional.festivals,
        greetings: data.regional.greetings,
      }
    }

    return json
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const configJson = formDataToJson(formData)
      const worldId = configJson.id

      const url = editingWorld ? `/api/worlds/${editingWorld.id}` : '/api/worlds'
      const method = editingWorld ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldId,
          configJson,
        }),
      })

      if (res.ok) {
        setFormData(defaultFormData)
        setShowForm(false)
        setEditingWorld(null)
        fetchWorlds()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save world')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleEdit = (world: World) => {
    setEditingWorld(world)
    setFormData(jsonToFormData(world.configJson))
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this world?')) {
      return
    }

    try {
      const res = await fetch(`/api/worlds/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchWorlds()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete world')
      }
    } catch (error) {
      console.error('Error deleting world:', error)
      alert('Failed to delete world')
    }
  }

  const addArrayItem = (path: string[], value: any) => {
    if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: [...prev.ai.toneModifiers, value],
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'voiceProfiles') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          voiceProfiles: [...(prev.ai.voiceProfiles || []), value],
        },
      }))
    } else if (path[0] === 'regional' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          dialects: [...prev.regional.dialects, value],
        } : undefined,
      }))
    } else if (path[0] === 'regional' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          festivals: [...prev.regional.festivals, value],
        } : undefined,
      }))
    }
  }

  const removeArrayItem = (path: string[], index: number) => {
    if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: prev.ai.toneModifiers.filter((_, i) => i !== index),
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'voiceProfiles') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          voiceProfiles: (prev.ai.voiceProfiles || []).filter((_, i) => i !== index),
        },
      }))
    } else if (path[0] === 'regional' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          dialects: prev.regional.dialects.filter((_, i) => i !== index),
        } : undefined,
      }))
    } else if (path[0] === 'regional' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          festivals: prev.regional.festivals.filter((_, i) => i !== index),
        } : undefined,
      }))
    }
  }

  const updateArrayItem = (path: string[], index: number, value: any) => {
    if (path[0] === 'ai' && path[1] === 'toneModifiers') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          toneModifiers: prev.ai.toneModifiers.map((item, i) => i === index ? value : item),
        },
      }))
    } else if (path[0] === 'ai' && path[1] === 'voiceProfiles') {
      setFormData((prev) => ({
        ...prev,
        ai: {
          ...prev.ai,
          voiceProfiles: (prev.ai.voiceProfiles || []).map((item, i) => i === index ? value : item),
        },
      }))
    } else if (path[0] === 'regional' && path[1] === 'dialects') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          dialects: prev.regional.dialects.map((item, i) => i === index ? value : item),
        } : undefined,
      }))
    } else if (path[0] === 'regional' && path[1] === 'festivals') {
      setFormData((prev) => ({
        ...prev,
        regional: prev.regional ? {
          ...prev.regional,
          festivals: prev.regional.festivals.map((item, i) => i === index ? value : item),
        } : undefined,
      }))
    }
  }

  const handleTypeChange = (newType: 'region' | 'product') => {
    if (newType === 'region' && !formData.regional) {
      setFormData({
        ...formData,
        type: newType,
        regional: {
          countryCode: '',
          locale: '',
          timezone: '',
          currency: '',
          dialects: [],
          festivals: [],
          greetings: {
            morning: '',
            afternoon: '',
            evening: '',
          },
        },
      })
    } else {
      setFormData({
        ...formData,
        type: newType,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading worlds...</div>
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
            <h1 className="text-3xl font-bold text-white">Worlds</h1>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true)
                setEditingWorld(null)
                setFormData(defaultFormData)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New World
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingWorld ? 'Edit World' : 'Create New World'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      World ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                      pattern="^[a-z][a-z0-9-]*$"
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="vocspad"
                    />
                    <p className="mt-1 text-xs text-slate-400">Lowercase alphanumeric with hyphens</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value as 'region' | 'product')}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="product">Product</option>
                      <option value="region">Region</option>
                    </select>
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
                      placeholder="Vocspad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Voice + Keyboard intelligent notepad"
                    />
                  </div>
                </div>
              </div>

              {/* Routing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Routing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Path <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.routing.path}
                      onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, path: e.target.value } })}
                      pattern="^/[a-z][a-z0-9-]*$"
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/vocspad"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Domain (optional)</label>
                    <input
                      type="text"
                      value={formData.routing.domain || ''}
                      onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, domain: e.target.value || null } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="vocspad.ai"
                    />
                  </div>
                  {formData.type === 'region' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Geo Trigger</label>
                      <input
                        type="text"
                        value={formData.routing.geoTrigger || ''}
                        onChange={(e) => setFormData({ ...formData, routing: { ...formData.routing, geoTrigger: e.target.value.toUpperCase() } })}
                        pattern="^[A-Z]{2}$"
                        maxLength={2}
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GB"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Appearance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Default Color <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.appearance.defaultColor}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, defaultColor: e.target.value as any } })}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ORANGE">Orange</option>
                      <option value="RED">Red</option>
                      <option value="YELLOW">Yellow</option>
                      <option value="GREEN_BLUE">Green Blue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Theme <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.appearance.theme}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, theme: e.target.value as any } })}
                      required
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cube Variant (optional)</label>
                    <input
                      type="text"
                      value={formData.appearance.cubeVariant || ''}
                      onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, cubeVariant: e.target.value || undefined } })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="vocspad"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.voice}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, voice: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Voice</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.chat}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, chat: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Chat</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.memory}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, memory: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Memory</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.auth}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, auth: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Auth</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.keyboard || false}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, keyboard: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Keyboard</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.features.debate || false}
                      onChange={(e) => setFormData({ ...formData, features: { ...formData.features, debate: e.target.checked } })}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">Debate</span>
                  </label>
                </div>
              </div>

              {/* AI Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">AI Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    System Prompt <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.ai.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, ai: { ...formData.ai, systemPrompt: e.target.value } })}
                    rows={6}
                    required
                    minLength={10}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="You are Cubiqo, an emotional AI companion..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tone Modifiers <span className="text-red-400">*</span>
                  </label>
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
                {formData.type === 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Voice Profiles (optional)</label>
                    <div className="space-y-3">
                      {(formData.ai.voiceProfiles || []).map((profile, index) => (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                            <input
                              type="text"
                              value={profile.id}
                              onChange={(e) => {
                                updateArrayItem(['ai', 'voiceProfiles'], index, { ...profile, id: e.target.value })
                              }}
                              placeholder="ID"
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={profile.name}
                              onChange={(e) => {
                                updateArrayItem(['ai', 'voiceProfiles'], index, { ...profile, name: e.target.value })
                              }}
                              placeholder="Name"
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                              value={profile.gender}
                              onChange={(e) => {
                                updateArrayItem(['ai', 'voiceProfiles'], index, { ...profile, gender: e.target.value as 'male' | 'female' })
                              }}
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                            <input
                              type="text"
                              value={profile.tone}
                              onChange={(e) => {
                                updateArrayItem(['ai', 'voiceProfiles'], index, { ...profile, tone: e.target.value })
                              }}
                              placeholder="Tone"
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newProfiles = (formData.ai.voiceProfiles || []).filter((_, i) => i !== index)
                              setFormData({ ...formData, ai: { ...formData.ai, voiceProfiles: newProfiles } })
                            }}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove Profile
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem(['ai', 'voiceProfiles'], { id: '', name: '', gender: 'male', tone: '' })}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                      >
                        + Add Voice Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Regional Configuration (only for region type) */}
              {formData.type === 'region' && formData.regional && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Regional Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Country Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.countryCode}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, countryCode: e.target.value.toUpperCase() } })}
                        pattern="^[A-Z]{2}$"
                        maxLength={2}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Locale <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.locale}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, locale: e.target.value } })}
                        pattern="^[a-z]{2}-[A-Z]{2}$"
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="en-GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timezone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.timezone}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, timezone: e.target.value } })}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Europe/London"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Currency <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.currency}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, currency: e.target.value.toUpperCase() } })}
                        pattern="^[A-Z]{3}$"
                        maxLength={3}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="GBP"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Dialects <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-2">
                      {formData.regional.dialects.map((dialect, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={dialect}
                            onChange={(e) => {
                              const newDialects = [...formData.regional!.dialects]
                              newDialects[index] = e.target.value
                              setFormData({ ...formData, regional: { ...formData.regional!, dialects: newDialects } })
                            }}
                            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="British English"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem(['regional', 'dialects'], index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem(['regional', 'dialects'], '')}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                      >
                        + Add Dialect
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Festivals <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-3">
                      {formData.regional.festivals.map((festival, index) => (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <input
                              type="text"
                              value={festival.name}
                              onChange={(e) => updateArrayItem(['regional', 'festivals'], index, { ...festival, name: e.target.value })}
                              placeholder="Festival name"
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={festival.date}
                              onChange={(e) => updateArrayItem(['regional', 'festivals'], index, { ...festival, date: e.target.value })}
                              placeholder="Date (e.g., 01-01 or variable)"
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                              value={festival.type}
                              onChange={(e) => updateArrayItem(['regional', 'festivals'], index, { ...festival, type: e.target.value })}
                              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="national">National</option>
                              <option value="religious">Religious</option>
                              <option value="cultural">Cultural</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeArrayItem(['regional', 'festivals'], index)}
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove Festival
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayItem(['regional', 'festivals'], { name: '', date: '', type: 'national' })}
                        className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                      >
                        + Add Festival
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Morning Greeting <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.greetings.morning}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, greetings: { ...formData.regional!.greetings, morning: e.target.value } } })}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Good morning"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Afternoon Greeting <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.greetings.afternoon}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, greetings: { ...formData.regional!.greetings, afternoon: e.target.value } } })}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Good afternoon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Evening Greeting <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regional.greetings.evening}
                        onChange={(e) => setFormData({ ...formData, regional: { ...formData.regional!, greetings: { ...formData.regional!.greetings, evening: e.target.value } } })}
                        required
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Good evening"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingWorld ? 'Update' : 'Create'} World
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingWorld(null)
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
                  World ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Path
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
              {worlds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No worlds found. Create your first world above.
                  </td>
                </tr>
              ) : (
                worlds.map((world) => (
                  <tr key={world.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {world.worldId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {world.configJson?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <span className={`px-2 py-1 rounded text-xs ${
                        world.configJson?.type === 'region' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {world.configJson?.type || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {world.configJson?.routing?.path || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(world.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(world)}
                        className="text-blue-400 hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(world.id)}
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
