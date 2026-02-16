'use client'

import { useState, useEffect } from 'react'

export default function SimpleCubeToggle() {
  const [design, setDesign] = useState<'plasma' | 'hd3d'>('plasma')

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('cubeDesign')
    if (saved === 'hd3d') {
      setDesign('hd3d')
    }
  }, [])

  const handleToggle = () => {
    const newDesign = design === 'plasma' ? 'hd3d' : 'plasma'
    setDesign(newDesign)
    localStorage.setItem('cubeDesign', newDesign)
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Cube Design</h3>
          <p className="text-sm text-gray-400">
            Currently using: <span className="text-white font-medium">{design === 'plasma' ? 'Design A (Plasma)' : 'Design B (HD 3D)'}</span>
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-16 h-8 rounded-full transition-colors ${
            design === 'hd3d' ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
              design === 'hd3d' ? 'transform translate-x-8' : ''
            }`}
          />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className={`p-4 rounded-lg border ${design === 'plasma' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/30'}`}>
          <div className="text-sm font-bold mb-1">Design A</div>
          <div className="text-xs text-gray-400">Plasma Energy Cube</div>
        </div>
        <div className={`p-4 rounded-lg border ${design === 'hd3d' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/30'}`}>
          <div className="text-sm font-bold mb-1">Design B</div>
          <div className="text-xs text-gray-400">HD 3D Cube</div>
        </div>
      </div>
    </div>
  )
}
