'use client'

import { useState } from 'react'
import type { Integration, ServiceMetadata } from '@/types/integrations'
import { IntegrationClient } from '@/lib/integrations/client'

interface IntegrationCardProps {
  metadata: ServiceMetadata
  integration: Integration | null
  onUpdate: () => void
}

export function IntegrationCard({ metadata, integration, onUpdate }: IntegrationCardProps) {
  const [loading, setLoading] = useState(false)

  const isConnected = integration?.is_connected || false
  const readEnabled = integration?.read_enabled || false
  const writeEnabled = integration?.write_enabled || false

  const handleConnect = async () => {
    setLoading(true)
    try {
      if (metadata.oauth_enabled) {
        await IntegrationClient.connect(metadata.id, '/integrations')
      } else {
        // For services without OAuth, just enable the toggles
        await IntegrationClient.update(metadata.id, {
          is_connected: true,
          read_enabled: true
        })
        onUpdate()
      }
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${metadata.name}? This will disable agent access.`)) {
      return
    }
    setLoading(true)
    try {
      await IntegrationClient.disconnect(metadata.id)
      onUpdate()
    } catch (error) {
      console.error('Disconnect error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRead = async () => {
    setLoading(true)
    try {
      await IntegrationClient.toggleRead(metadata.id, !readEnabled)
      onUpdate()
    } catch (error) {
      console.error('Toggle read error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleWrite = async () => {
    setLoading(true)
    try {
      await IntegrationClient.toggleWrite(metadata.id, !writeEnabled)
      onUpdate()
    } catch (error) {
      console.error('Toggle write error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: metadata.color + '20' }}
          >
            {metadata.icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{metadata.name}</h3>
            <p className="text-sm text-gray-500">{metadata.description}</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <p className="font-medium text-gray-700 mb-1">Read capabilities:</p>
          <ul className="text-gray-500 space-y-0.5">
            {metadata.features.read.map((feature, i) => (
              <li key={i}>• {feature}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-gray-700 mb-1">Write capabilities:</p>
          <ul className="text-gray-500 space-y-0.5">
            {metadata.features.write.map((feature, i) => (
              <li key={i}>• {feature}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t pt-4 space-y-3">
        {/* Connect/Disconnect Button */}
        <div>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Connecting...' : `Connect ${metadata.name}`}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>

        {/* Permission Toggles */}
        {isConnected && (
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Read Access</span>
                <span className="text-xs text-gray-500">Agent can read data</span>
              </div>
              <input
                type="checkbox"
                checked={readEnabled}
                onChange={handleToggleRead}
                disabled={loading}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Write Access</span>
                <span className="text-xs text-gray-500">Agent can modify data</span>
              </div>
              <input
                type="checkbox"
                checked={writeEnabled}
                onChange={handleToggleWrite}
                disabled={loading}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black disabled:opacity-50"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
