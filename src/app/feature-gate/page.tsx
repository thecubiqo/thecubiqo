'use client'

/**
 * Feature Gate Admin Panel
 * Allows founders to control which features are released to regular users
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { isFounder } from '@/lib/auth/founders'
import { getAllFeatureFlagsClient, updateFeatureFlagClient } from '@/lib/auth/feature-flags-client'
import type { FeatureAccess } from '@/lib/auth/feature-flags'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/AppLayout'

interface FeatureFlag {
  feature: keyof FeatureAccess
  released: boolean
  description: string
}

const FEATURE_DESCRIPTIONS: Record<keyof FeatureAccess, string> = {
  home: 'Home page and main interface',
  chat: 'Chat interface with AI',
  agents: 'AI agent management and creation',
  files: 'File browser and editor',
  memory: 'Memory search and management',
  integrations: 'Third-party integrations',
  cubikey: 'CubiKey authentication system',
  settings: 'User settings and preferences',
  admin: 'Admin dashboard (founder only)',
  featureGate: 'Feature flag management (founder only)',
}

export default function FeatureGatePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  
  // Check if user is founder
  const userIsFounder = user?.email ? isFounder(user.email) : false
  
  useEffect(() => {
    if (!loading && !userIsFounder) {
      router.push('/')
    }
  }, [userIsFounder, loading, router])
  
  useEffect(() => {
    loadFlags()
  }, [])
  
  async function loadFlags() {
    setLoading(true)
    try {
      const flagData = await getAllFeatureFlagsClient()
      const flagArray = Object.entries(flagData).map(([feature, released]) => ({
        feature: feature as keyof FeatureAccess,
        released,
        description: FEATURE_DESCRIPTIONS[feature as keyof FeatureAccess] || 'No description',
      }))
      setFlags(flagArray)
    } catch (err) {
      console.error('Failed to load feature flags:', err)
    } finally {
      setLoading(false)
    }
  }
  
  async function toggleFlag(feature: keyof FeatureAccess, currentValue: boolean) {
    setSaving(feature)
    try {
      const success = await updateFeatureFlagClient(feature, !currentValue)
      if (success) {
        setFlags(flags.map(f => 
          f.feature === feature 
            ? { ...f, released: !currentValue }
            : f
        ))
      } else {
        alert('Failed to update feature flag')
      }
    } catch (err) {
      console.error('Error updating feature flag:', err)
      alert('Error updating feature flag')
    } finally {
      setSaving(null)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  
  if (!userIsFounder) {
    return null // Will redirect
  }
  
  return (
    <AppLayout>
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Feature Gate</h1>
          <p className="text-white/60">
            Control which features are visible to regular users
          </p>
          <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-sm">
              ⚠️ <strong>Founder Access:</strong> You see all features. Regular users only see features marked as "Released".
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {flags.map(flag => (
            <div
              key={flag.feature}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {flag.feature}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        flag.released
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {flag.released ? 'Released' : 'Unreleased'}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{flag.description}</p>
                </div>
                
                <button
                  onClick={() => toggleFlag(flag.feature, flag.released)}
                  disabled={saving === flag.feature}
                  className={`
                    relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
                    focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black
                    ${flag.released ? 'bg-green-500' : 'bg-gray-600'}
                    ${saving === flag.feature ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  role="switch"
                  aria-checked={flag.released}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${flag.released ? 'translate-x-6' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white font-semibold mb-2">How it works</h3>
          <ul className="text-white/60 text-sm space-y-1 list-disc list-inside">
            <li>Founders always see all features (for testing)</li>
            <li>Regular users only see features marked as "Released"</li>
            <li>Unreleased features are completely hidden from navigation</li>
            <li>Changes take effect immediately for all users</li>
          </ul>
        </div>
      </div>
    </div>
    </AppLayout>
  )
}
