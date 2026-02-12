/**
 * Founder Experiments Page - Simple Version
 * Control room for toggling cube designs
 */

import SimpleCubeToggle from '@/components/experiments/SimpleCubeToggle'

export default function ExperimentsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Founder Experiments</h1>
          <p className="text-gray-400">
            Control room for testing and toggling between different designs.
          </p>
        </div>

        {/* Main Toggle */}
        <div className="mb-8">
          <SimpleCubeToggle />
        </div>

        {/* Instructions */}
        <div className="bg-gray-900/30 rounded-xl border border-gray-800 p-6">
          <h3 className="text-xl font-bold mb-4">How to Use</h3>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-sm mt-0.5">1</div>
              <span>Toggle between Design A (Plasma) and Design B (HD 3D) using the switch above</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-sm mt-0.5">2</div>
              <span>Preference is saved to your browser's localStorage</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-sm mt-0.5">3</div>
              <span>The main CubiQo interface will use your selected design</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 text-sm mt-0.5">4</div>
              <span>Refresh the main page to see changes take effect</span>
            </li>
          </ul>
        </div>

        {/* Note */}
        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
          <p className="text-sm">
            <span className="font-medium">Note:</span> This is a founder-only feature. 
            Regular users see the default plasma design.
          </p>
        </div>
      </div>
    </div>
  )
}