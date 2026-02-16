/**
 * Minimal Experiments Page
 * Just the cube toggle - no conflicts
 */

'use client'

import { useState, useEffect } from 'react'

export default function MinimalExperimentsPage() {
  const [design, setDesign] = useState<'plasma' | 'hd'>('plasma')

  useEffect(() => {
    const saved = localStorage.getItem('cube-design')
    if (saved === 'plasma' || saved === 'hd') {
      setDesign(saved)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cube-design', design)
  }, [design])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Founder Experiments</h1>
        <p className="text-gray-400 mb-8">Cube design toggle test</p>

        <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-bold mb-4">Cube Design Toggle</h2>
          
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-900/50 rounded-lg">
            <div>
              <div className="font-medium">
                {design === 'plasma' ? 'Design A: Plasma' : 'Design B: HD 3D'}
              </div>
              <div className="text-sm text-gray-400">
                Toggle between different cube designs
              </div>
            </div>
            
            <button
              onClick={() => setDesign(prev => prev === 'plasma' ? 'hd' : 'plasma')}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors ${design === 'hd' ? 'bg-blue-600' : 'bg-gray-700'}
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

          <div className="h-48 bg-gray-900/50 rounded-lg border border-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {design === 'plasma' ? '⚡' : '🔷'}
              </div>
              <div className="text-gray-400">
                {design === 'plasma' ? 'Plasma Cube (Design A)' : 'HD 3D Cube (Design B)'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Preference saved to browser
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}