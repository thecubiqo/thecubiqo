'use client'

import { useEffect, useState } from 'react'

interface Settings {
  [key: string]: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        // Use settingsObj if available, otherwise convert array to object
        if (data.settingsObj) {
          setSettings(data.settingsObj)
        } else if (Array.isArray(data.settings)) {
          const settingsObj: Settings = {}
          data.settings.forEach((s: { key: string; value: string }) => {
            settingsObj[s.key] = s.value
          })
          setSettings(settingsObj)
        } else {
          setSettings(data.settings || {})
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }))
        alert('Setting updated successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      alert('Failed to update setting')
    } finally {
      setSaving(null)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">System Settings</h1>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Certbot Email
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Email address used for Let's Encrypt SSL certificate notifications and account recovery.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={settings.certbotEmail || ''}
                onChange={(e) => handleChange('certbotEmail', e.target.value)}
                placeholder="admin@example.com"
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleUpdate('certbotEmail', settings.certbotEmail || '')}
                disabled={saving === 'certbotEmail'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === 'certbotEmail' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Server IP Address
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Your server's public IP address. This will be used to generate DNS instructions for new domains.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.serverIp || ''}
                onChange={(e) => handleChange('serverIp', e.target.value)}
                placeholder="192.168.1.1"
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleUpdate('serverIp', settings.serverIp || '')}
                disabled={saving === 'serverIp'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === 'serverIp' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Google Analytics Service Account Credentials (JSON)
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Paste your Google Analytics service account JSON credentials here. This is required for fetching analytics data.
            </p>
            <div className="flex gap-2">
              <textarea
                value={settings.GOOGLE_ANALYTICS_CREDENTIALS || ''}
                onChange={(e) => handleChange('GOOGLE_ANALYTICS_CREDENTIALS', e.target.value)}
                placeholder='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"..."}'
                rows={6}
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
              />
              <button
                onClick={() => handleUpdate('GOOGLE_ANALYTICS_CREDENTIALS', settings.GOOGLE_ANALYTICS_CREDENTIALS || '')}
                disabled={saving === 'GOOGLE_ANALYTICS_CREDENTIALS'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-start"
              >
                {saving === 'GOOGLE_ANALYTICS_CREDENTIALS' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h2 className="text-lg font-semibold text-white mb-4">About Settings</h2>
            <p className="text-sm text-slate-400">
              System settings are stored in the database and can be updated from this page.
              These settings take precedence over environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

