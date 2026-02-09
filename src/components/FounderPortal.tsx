'use client'

/**
 * Founder Portal - Control Panel for Feature Toggles
 * Only visible to aditya@cubiqo.ai
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  isFounder, 
  getUserAccessState, 
  updateUserAccess,
  FEATURE_METADATA,
  type FeatureAccess,
  type FeatureMetadata
} from '@/lib/auth'
import { ConnectionsPanel } from './admin/ConnectionsPanel'

export function FounderPortal() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'connections' | 'features'>('connections')
  const [userAccess, setUserAccess] = useState<FeatureAccess>(getUserAccessState())
  
  // Only show for founders
  if (!isFounder(user?.email)) {
    return null
  }

  const handleToggle = (featureId: keyof FeatureAccess) => {
    const newValue = !userAccess[featureId]
    const updates = { [featureId]: newValue }
    
    updateUserAccess(updates)
    setUserAccess(getUserAccessState())
  }

  const groupedFeatures = FEATURE_METADATA.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = []
    }
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, FeatureMetadata[]>)

  return (
    <>
      {/* Founder Portal Button - Top Right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
      >
        <span>🎚️</span>
        <span>Founder Portal</span>
      </button>

      {/* Portal Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    🎚️ Founder Portal
                  </h2>
                  <p className="text-purple-100">
                    Control what features generic users see
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-lg px-4 py-2 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 px-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                    activeTab === 'connections'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  🔗 Connections
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                    activeTab === 'features'
                      ? 'text-purple-400 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-gray-300'
                  }`}
                >
                  🎚️ Feature Toggles
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'connections' ? (
                <ConnectionsPanel />
              ) : (
              <div className="space-y-8">
                {Object.entries(groupedFeatures).map(([category, features]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-purple-400">
                        {category === 'Navigation' ? '🧭' : category === 'Agent Features' ? '🤖' : '🔗'}
                      </span>
                      {category}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {features.map((feature) => {
                        const isEnabled = userAccess[feature.id]
                        const isFounderOnly = feature.id === 'admin'
                        
                        return (
                          <div
                            key={feature.id}
                            className={`
                              bg-gray-800 rounded-xl p-4 border transition-all
                              ${isEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-gray-700'}
                              ${isFounderOnly ? 'opacity-60' : ''}
                            `}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white">
                                    {feature.name}
                                  </h4>
                                  {isFounderOnly && (
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                      Founder Only
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400">
                                  {feature.description}
                                </p>
                              </div>
                              
                              <button
                                onClick={() => handleToggle(feature.id)}
                                disabled={isFounderOnly}
                                className={`
                                  relative w-14 h-8 rounded-full transition-all
                                  ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}
                                  ${isFounderOnly ? 'cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                <div
                                  className={`
                                    absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all
                                    ${isEnabled ? 'left-7' : 'left-1'}
                                  `}
                                />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-800 p-4 bg-gray-900/50">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-400">
                  Logged in as: <span className="text-purple-400 font-semibold">{user?.email}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
