/**
 * Settings Page - OAuth Service Connections
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ConnectedService {
  id: string
  name: string
  icon: string
  connected: boolean
  email?: string
  username?: string
}

export default function SettingsPage() {
  const [services, setServices] = useState<ConnectedService[]>([
    { id: 'gmail', name: 'Gmail', icon: '📧', connected: false },
    { id: 'twitter', name: 'Twitter/X', icon: '𝕏', connected: false },
    { id: 'instagram', name: 'Instagram', icon: '📷', connected: false },
    { id: 'facebook', name: 'Facebook', icon: '👥', connected: false },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', connected: false },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: false },
    { id: 'uber', name: 'Uber', icon: '🚗', connected: false },
    { id: 'doordash', name: 'DoorDash', icon: '🍔', connected: false },
  ])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConnectedServices()
  }, [])

  async function loadConnectedServices() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // @ts-ignore - oauth_connections table will be created via migration
      const { data: connections } = await supabase
        .from('oauth_connections')
        .select('service_id, service_data')
        .eq('user_id', user.id)

      if (connections) {
        setServices(prev => prev.map(service => {
          const connection = connections.find(c => c.service_id === service.id)
          if (connection) {
            return {
              ...service,
              connected: true,
              email: connection.service_data?.email,
              username: connection.service_data?.username
            }
          }
          return service
        }))
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(serviceId: string) {
    // Redirect to OAuth flow
    const redirectUri = `${window.location.origin}/api/oauth/callback/${serviceId}`
    window.location.href = `/api/oauth/authorize/${serviceId}?redirect_uri=${encodeURIComponent(redirectUri)}`
  }

  async function handleDisconnect(serviceId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // @ts-ignore - oauth_connections table will be created via migration
      await supabase
        .from('oauth_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId)

      await loadConnectedServices()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Connected Services</h1>
        <p className="text-gray-400 mb-8">
          Connect your accounts to enable voice control via CubiQo
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <div
              key={service.id}
              className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{service.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    {service.connected && (
                      <p className="text-sm text-green-400">
                        ✓ Connected
                        {service.email && ` • ${service.email}`}
                        {service.username && ` • @${service.username}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {service.connected ? (
                <button
                  onClick={() => handleDisconnect(service.id)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(service.id)}
                  className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-semibold mb-2">Voice Commands Available</h2>
          <p className="text-gray-400 mb-4">
            Once connected, you can use voice commands like:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>📧 "Check my Gmail inbox"</li>
            <li>📧 "Send an email to John about the meeting"</li>
            <li>𝕏 "Post to Twitter: Just launched my new project"</li>
            <li>🚗 "Order an Uber to the airport"</li>
            <li>🍔 "Order food from my favorite restaurant"</li>
            <li>💼 "Check my LinkedIn messages"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
