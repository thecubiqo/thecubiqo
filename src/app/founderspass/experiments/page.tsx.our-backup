/**
 * Founder Experiments - Cube Design Toggle
 * Simple toggle between Design A and Design B
 */

'use client'

import { useState, useEffect } from 'react'

export default function ExperimentsPage() {
  const [design, setDesign] = useState<'plasma' | 'hd'>('plasma')
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

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 bg-gray-900/50 rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Founder Experiments</h1>
          <p className="text-gray-400">
            Toggle between different cube designs for testing
          </p>
        </div>

        {/* Cube Toggle Card */}
        <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Cube Design Toggle</h2>
          
          {/* Toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg">
            <div>
              <div className="font-medium text-lg">
                {design === 'plasma' ? 'Design A: Plasma' : 'Design B: HD 3D'}
              </div>
              <div className="text-sm text-gray-400">
                {design === 'plasma' 
                  ? 'Energy-based wireframe with plasma effects' 
                  : 'Clean 3D cube with metallic materials'}
              </div>
            </div>
            
            <button
              onClick={toggleDesign}
              className={`
                relative inline-flex h-7 w-12 items-center rounded-full
                transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${design === 'hd' ? 'bg-blue-600' : 'bg-gray-700'}
              `}
              aria-label={`Switch to ${design === 'plasma' ? 'HD 3D' : 'Plasma'} design`}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                  ${design === 'hd' ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">Preview:</div>
            <div className="h-64 bg-gray-900/50 rounded-lg border border-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">
                  {design === 'plasma' ? '⚡' : '🔷'}
                </div>
                <div className="text-gray-300 text-xl mb-2">
                  {design === 'plasma' ? 'Plasma Cube' : 'HD 3D Cube'}
                </div>
                <div className="text-sm text-gray-500">
                  Design {design === 'plasma' ? 'A' : 'B'} active
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${design === 'plasma' ? 'bg-blue-500' : 'bg-gray-600'}`} />
              <span>Preference saved to browser storage</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className={`w-2 h-2 rounded-full ${design === 'hd' ? 'bg-blue-500' : 'bg-gray-600'}`} />
              <span>Toggle affects the main interface cube</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/20 rounded-lg border border-gray-800 p-4">
          <h3 className="font-medium mb-2">How to Use</h3>
          <p className="text-sm text-gray-400">
            This toggle controls which cube design appears in the main CubiQo interface. 
            The preference is saved to your browser's localStorage. 
            Refresh the main page to see changes take effect.
          </p>
        </div>
      </div>
    </div>
  )
}