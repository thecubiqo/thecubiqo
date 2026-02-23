'use client'

import { useState } from 'react'
import NeonGlassCube from '@/components/NeonGlassCube'

export default function NeonCubeDemoPage() {
  const [autoRotate, setAutoRotate] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')

  const sizes = {
    small: { width: 300, height: 300 },
    medium: { width: 500, height: 500 },
    large: { width: 700, height: 500 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧊 Neon Glass Cube Demo</h1>
          <p className="text-gray-300">
            A modern WebGL cube with procedural neon effects. This could be integrated into Cubiqo's UI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main cube display */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
              <NeonGlassCube
                width={sizes[size].width}
                height={sizes[size].height}
                autoRotate={autoRotate}
                showControls={showControls}
                className="mx-auto"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setSize('small')}
                className={`px-4 py-2 rounded-lg ${size === 'small' ? 'bg-blue-600' : 'bg-gray-800'}`}
              >
                Small (300px)
              </button>
              <button
                onClick={() => setSize('medium')}
                className={`px-4 py-2 rounded-lg ${size === 'medium' ? 'bg-blue-600' : 'bg-gray-800'}`}
              >
                Medium (500px)
              </button>
              <button
                onClick={() => setSize('large')}
                className={`px-4 py-2 rounded-lg ${size === 'large' ? 'bg-blue-600' : 'bg-gray-800'}`}
              >
                Large (700px)
              </button>
            </div>
          </div>

          {/* Controls panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Controls</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-lg">Auto Rotate</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Cube automatically rotates when enabled
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showControls}
                      onChange={(e) => setShowControls(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-lg">Orbit Controls</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    Drag to rotate, scroll to zoom (when enabled)
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Usage Instructions</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Drag to rotate the cube</li>
                    <li>• Scroll to zoom in/out</li>
                    <li>• Toggle auto-rotation</li>
                    <li>• Adjust size with buttons</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">Technical Details</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Built with Three.js WebGL</li>
                    <li>• Custom shader materials</li>
                    <li>• Procedural noise animation</li>
                    <li>• Glass-like transparency</li>
                    <li>• Neon color palette</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Integration ideas */}
            <div className="mt-6 bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Integration Ideas</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
                  <h3 className="font-semibold text-blue-300">Loading Animation</h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Use as an animated loading screen for Cubiqo
                  </p>
                </div>
                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
                  <h3 className="font-semibold text-purple-300">Dashboard Background</h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Subtle animated background for admin dashboards
                  </p>
                </div>
                <div className="p-4 bg-green-900/20 rounded-lg border border-green-800/30">
                  <h3 className="font-semibold text-green-300">Agent Status Visualizer</h3>
                  <p className="text-gray-300 text-sm mt-1">
                    Cube changes color based on agent activity
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code snippet */}
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Implementation</h2>
          <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm">
{`import NeonGlassCube from '@/components/NeonGlassCube'

// Simple usage
<NeonGlassCube 
  width={500}
  height={500}
  autoRotate={true}
  showControls={true}
/>

// Integration with agent status
<NeonGlassCube 
  width={300}
  height={300}
  autoRotate={isAgentActive}
  className="agent-status-cube"
/>`}
          </pre>
        </div>
      </div>
    </div>
  )
}
