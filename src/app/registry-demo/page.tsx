'use client'

import { useState } from 'react'
import { getAllIntegrations, getIntegration } from '@/lib/notifications/integration-registry'

export default function RegistryDemoPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const allIntegrations = getAllIntegrations()
  
  const chatIntegrations = allIntegrations.filter(i => i.type === 'chat')
  const socialIntegrations = allIntegrations.filter(i => i.type === 'social')
  const smartHomeIntegrations = allIntegrations.filter(i => i.type === 'smart_home')
  const productivityIntegrations = allIntegrations.filter(i => i.type === 'productivity')

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Integration Registry Demo</h1>
        <p className="text-gray-400 mb-8">
          This shows what "just add to registry" means - I added 23 integrations to ONE file,
          and now they ALL work automatically. No other code changes needed!
        </p>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold mb-4">The Magic Explained</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <p className="font-semibold text-white mb-1">Add to Registry</p>
                <p>Just add a new object to the INTEGRATIONS object in <code className="text-blue-400">integration-registry.ts</code></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <p className="font-semibold text-white mb-1">Define Properties</p>
                <p>Set name, color, icon, type, capabilities - that's it!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <p className="font-semibold text-white mb-1">System Uses It</p>
                <p>NotificationCenter, BrandedActionCard, and all components automatically pick it up</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Count */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/30 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{allIntegrations.length}</div>
            <div className="text-xl text-gray-300">Integrations Registered</div>
            <div className="text-sm text-gray-400 mt-2">
              From 4 → {allIntegrations.length} by just editing ONE file
            </div>
          </div>
        </div>

        {/* Chat Integrations */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            💬 Chat Platforms ({chatIntegrations.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {chatIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.name}
                integration={integration}
                onClick={() => setSelectedIntegration(integration.name)}
              />
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            📱 Social Media ({socialIntegrations.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {socialIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.name}
                integration={integration}
                onClick={() => setSelectedIntegration(integration.name)}
              />
            ))}
          </div>
        </div>

        {/* Smart Home */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            🏠 Smart Home ({smartHomeIntegrations.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {smartHomeIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.name}
                integration={integration}
                onClick={() => setSelectedIntegration(integration.name)}
              />
            ))}
          </div>
        </div>

        {/* Productivity */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            📝 Productivity ({productivityIntegrations.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productivityIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.name}
                integration={integration}
                onClick={() => setSelectedIntegration(integration.name)}
              />
            ))}
          </div>
        </div>

        {/* Selected Integration Details */}
        {selectedIntegration && (
          <IntegrationDetails
            integration={getIntegration(selectedIntegration)!}
            onClose={() => setSelectedIntegration(null)}
          />
        )}
      </div>
    </div>
  )
}

function IntegrationCard({ integration, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border-2 transition-all hover:scale-105"
      style={{
        backgroundColor: integration.color + '10',
        borderColor: integration.color + '40'
      }}
    >
      <div className="text-4xl mb-2">{integration.icon}</div>
      <div className="font-semibold text-white text-sm">{integration.displayName}</div>
      <div
        className="text-xs mt-1 font-medium"
        style={{ color: integration.color }}
      >
        {integration.type}
      </div>
    </button>
  )
}

function IntegrationDetails({ integration, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className="bg-black rounded-2xl p-8 max-w-2xl w-full border-2"
        style={{ borderColor: integration.color }}
      >
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: integration.color + '20' }}
          >
            {integration.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">{integration.displayName}</h2>
            <p className="text-gray-400">{integration.description}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Type</div>
            <div className="text-white font-medium capitalize">{integration.type}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Color</div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: integration.color }}
              />
              <span className="text-white font-mono">{integration.color}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">OAuth Required</div>
            <div className="text-white">{integration.requiresOAuth ? 'Yes' : 'No'}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-2">Capabilities</div>
            <div className="flex flex-wrap gap-2">
              {integration.capabilities.map((cap: string) => (
                <span
                  key={cap}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: integration.color + '20',
                    color: integration.color
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
        >
          Close
        </button>
      </div>
    </div>
  )
}
