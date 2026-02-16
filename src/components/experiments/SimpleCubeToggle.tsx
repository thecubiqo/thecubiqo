'use client'

/**
 * SimpleCubeToggle - Basic toggle between Design A and Design B
 * No external UI dependencies
 */

import { useState, useEffect } from 'react'

type CubeDesign = 'plasma' | 'hd'

export default function SimpleCubeToggle() {
  const [design, setDesign] = useState<CubeDesign>('plasma')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('cube-design')
    if (saved === 'plasma' || saved === 'hd') {
      setDesign(saved)
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('cube-design', design)
    }
  }, [design, isClient])

  const toggleDesign = () => {
    setDesign(prev => prev === 'plasma' ? 'hd' : 'plasma')
  }

  return (
    <div className="w-full bg-gray-900/30 rounded-xl border border-gray-800 p-6">
      <h3 className="text-xl font-bold mb-2">Cube Design Toggle</h3>
      <p className="text-gray-400 text-sm mb-6">
        Switch between plasma wireframe and HD 3D cube
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg">
        <div>
          <div className="font-medium">
            {design === 'plasma' ? 'Plasma Wireframe' : 'HD 3D Cube'}
          </div>
          <div className="text-sm text-gray-400">
            {design === 'plasma' 
              ? 'Energy-based visualization' 
              : 'Clean metallic 3D design'}
          </div>
        </div>
        
        <button
          onClick={toggleDesign}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${design === 'hd' ? 'bg-blue-600' : 'bg-gray-700'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${design === 'hd' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Preview */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Preview:</div>
        <div className="h-48 bg-gray-900/50 rounded-lg border border-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">
              {design === 'plasma' ? '⚡' : '🔷'}
            </div>
            <div className="text-gray-400">
              {design === 'plasma' ? 'Plasma Cube' : 'HD 3D Cube'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              (Design {design === 'plasma' ? 'A' : 'B'} active)
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <div className={`w-2 h-2 rounded-full ${design === 'plasma' ? 'bg-blue-500' : 'bg-gray-600'}`} />
          <span>Design preference saved to browser</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <div className={`w-2 h-2 rounded-full ${design === 'hd' ? 'bg-blue-500' : 'bg-gray-600'}`} />
          <span>Toggle affects main interface cube</span>
        </div>
      </div>
    </div>
  )
}