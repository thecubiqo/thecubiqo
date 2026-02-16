/**
 * Feature Toggle List Component
 * Displays features grouped by category with global and per-user toggles
 */

'use client'

import { useState } from 'react'

export interface Feature {
  id: string
  feature_key: string
  label: string
  description: string
  category: string
  feature_type: 'toggle' | 'design_variant' | 'config'
  default_enabled: boolean
  risk_level: 'safe' | 'warning' | 'dangerous'
  config: Record<string, any>
  user_enabled?: boolean
  has_user_override: boolean
}

interface FeatureToggleListProps {
  features: Feature[]
  category: string
  onToggle: (feature: Feature, enabled: boolean) => Promise<void>
  searchQuery?: string
}

export function FeatureToggleList({ features, category, onToggle, searchQuery }: FeatureToggleListProps) {
  const [toggling, setToggling] = useState<string | null>(null)

  // Filter features by category and search query
  const filteredFeatures = features.filter(f => {
    const matchesCategory = f.category === category
    const matchesSearch = !searchQuery || 
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.feature_key.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch && f.feature_type === 'toggle'
  })

  if (filteredFeatures.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {searchQuery ? 'No features match your search' : 'No features in this category'}
      </div>
    )
  }

  const handleToggle = async (feature: Feature, newState: boolean) => {
    if (toggling) return
    
    setToggling(feature.feature_key)
    try {
      await onToggle(feature, newState)
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="divide-y divide-gray-800">
      {filteredFeatures.map(feature => {
        const effectiveState = feature.has_user_override 
          ? feature.user_enabled! 
          : feature.default_enabled
        
        const isToggling = toggling === feature.feature_key

        return (
          <div 
            key={feature.id} 
            className="p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Feature Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{feature.config.icon || '⚡'}</span>
                  <span className="font-medium text-gray-200">{feature.label}</span>
                  
                  {feature.has_user_override && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                      CUSTOM
                    </span>
                  )}
                  
                  {feature.risk_level === 'dangerous' && (
                    <span className="px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-900 text-[10px] font-bold rounded">
                      DANGEROUS
                    </span>
                  )}
                  
                  {feature.risk_level === 'warning' && (
                    <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 border border-yellow-900 text-[10px] font-bold rounded">
                      WARNING
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">{feature.description}</p>
                
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="text-gray-600">
                    Global Default: 
                    <span className={feature.default_enabled ? 'text-green-400 ml-1' : 'text-gray-500 ml-1'}>
                      {feature.default_enabled ? 'ON' : 'OFF'}
                    </span>
                  </span>
                  
                  {feature.has_user_override && (
                    <span className="text-blue-400">
                      Your Override: 
                      <span className={feature.user_enabled ? 'text-green-400 ml-1' : 'text-gray-500 ml-1'}>
                        {feature.user_enabled ? 'ON' : 'OFF'}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => handleToggle(feature, !effectiveState)}
                  disabled={isToggling}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black
                    ${effectiveState ? 'bg-green-500' : 'bg-gray-600'}
                    ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={effectiveState ? 'Click to disable' : 'Click to enable'}
                >
                  <div className={`
                    absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all
                    ${effectiveState ? 'left-6' : 'left-0.5'}
                  `} />
                </button>
                
                {isToggling && (
                  <span className="text-xs text-purple-400">Saving...</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
