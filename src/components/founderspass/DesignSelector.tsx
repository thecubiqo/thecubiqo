/**
 * Design Selector Component
 * Allows users to select visual design variants
 */

'use client'

import { useState } from 'react'

interface DesignVariant {
  feature_key: string
  label: string
  description: string
  config: {
    icon?: string
    preview?: string
  }
  default_enabled: boolean
  user_enabled?: boolean
  has_user_override: boolean
}

interface DesignSelectorProps {
  variants: DesignVariant[]
  activeDesign: string
  onSelect: (featureKey: string) => Promise<void>
  disabled?: boolean
}

export function DesignSelector({ variants, activeDesign, onSelect, disabled }: DesignSelectorProps) {
  const [selecting, setSelecting] = useState<string | null>(null)

  const handleSelect = async (featureKey: string) => {
    if (disabled || selecting || featureKey === activeDesign) return
    
    setSelecting(featureKey)
    try {
      await onSelect(featureKey)
    } finally {
      setSelecting(null)
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          🎨 Visual Design Selector
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Choose your preferred landing page visual design
        </p>
      </div>

      <div className="p-4 space-y-3">
        {variants.map((variant) => {
          const isActive = activeDesign === variant.feature_key
          const isSelecting = selecting === variant.feature_key
          const effectiveState = variant.has_user_override 
            ? variant.user_enabled 
            : variant.default_enabled

          return (
            <button
              key={variant.feature_key}
              onClick={() => handleSelect(variant.feature_key)}
              disabled={disabled || isSelecting || isActive}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${isActive 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                }
                ${(disabled || isSelecting) && !isActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelecting ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{variant.config.icon || '🎨'}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">
                      {variant.label}
                    </span>
                    
                    {isActive && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                        ACTIVE
                      </span>
                    )}
                    
                    {variant.has_user_override && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        CUSTOM
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400">
                    {variant.description}
                  </p>
                  
                  {isSelecting && (
                    <div className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Activating...
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-gray-800">
        <p className="text-xs text-gray-500 text-center">
          Your selection is saved and will be applied to the landing page immediately
        </p>
      </div>
    </div>
  )
}
