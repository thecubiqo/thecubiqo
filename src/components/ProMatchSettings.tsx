'use client'

/**
 * ProMatchSettings - Manage pro match subscription and preferences
 */

import { useState, useEffect } from 'react'
import type { ProMatchSubscription } from '@/types/rgy-matching'

interface ProMatchSettingsProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

export function ProMatchSettings({
  isOpen,
  onClose,
  isDark = true,
}: ProMatchSettingsProps) {
  const [subscription, setSubscription] = useState<ProMatchSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [maxSuggestions, setMaxSuggestions] = useState(10)

  useEffect(() => {
    if (isOpen) {
      loadSubscription()
    }
  }, [isOpen])

  const loadSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rgy/subscription')
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setSubscription(data.subscription)
          setFrequency(data.subscription.preferences?.discovery_frequency || 'weekly')
          setNotificationEnabled(data.subscription.preferences?.notification_enabled ?? true)
          setMaxSuggestions(data.subscription.preferences?.max_suggestions || 10)
        }
      }
    } catch (err) {
      console.error('Error loading subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubscription = async (active: boolean) => {
    setSaving(true)
    try {
      const response = await fetch('/api/rgy/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: active,
          preferences: {
            discovery_frequency: frequency,
            notification_enabled: notificationEnabled,
            max_suggestions: maxSuggestions,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      } else {
        alert('Failed to update subscription')
      }
    } catch (err) {
      console.error('Error updating subscription:', err)
      alert('Failed to update subscription')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!subscription) {
      await handleToggleSubscription(true)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/rgy/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            discovery_frequency: frequency,
            notification_enabled: notificationEnabled,
            max_suggestions: maxSuggestions,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        alert('Preferences saved successfully!')
      } else {
        alert('Failed to save preferences')
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      alert('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-zinc-900/95' : 'bg-white/95'} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Pro Match Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Pro Match Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Enable Pro Match</h3>
                <p className="text-sm text-white/60">
                  AI will automatically discover opportunities for you
                </p>
              </div>
              <button
                onClick={() => handleToggleSubscription(!subscription?.is_active)}
                disabled={saving}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  subscription?.is_active ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                    subscription?.is_active ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {subscription?.is_active && (
              <>
                {/* Discovery Frequency */}
                <div>
                  <label className="block font-medium mb-3">Discovery Frequency</label>
                  <div className="space-y-2">
                    {[
                      { value: 'daily' as const, label: 'Daily', desc: 'Check for new opportunities every day' },
                      { value: 'weekly' as const, label: 'Weekly', desc: 'Check once per week' },
                      { value: 'monthly' as const, label: 'Monthly', desc: 'Check once per month' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFrequency(option.value)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          frequency === option.value
                            ? 'bg-white/10 border-2 border-white/30'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-white/60">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Suggestions */}
                <div>
                  <label className="block font-medium mb-3">
                    Max Suggestions: <span className="text-white/60">{maxSuggestions}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={maxSuggestions}
                    onChange={(e) => setMaxSuggestions(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Notifications</h3>
                    <p className="text-sm text-white/60">
                      Get notified when new opportunities are found
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationEnabled(!notificationEnabled)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      notificationEnabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Last Run */}
                {subscription.last_discovery_run && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-white/60">
                      Last discovery run:{' '}
                      <span className="text-white">
                        {new Date(subscription.last_discovery_run).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </>
            )}

            {/* Info */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-400">
                ℹ️ Pro Match uses AI to automatically discover opportunities that match your interests across all RGY contexts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProMatchSettings
