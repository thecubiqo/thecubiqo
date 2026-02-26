'use client';

// Simple test page to verify hydration works
export default function TestPage() {
  return (
    <div className="min-h-screen bg-green-900/20 flex items-center justify-center">
      <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-green-500/30 max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Hydration Test</h1>
        <p className="text-gray-300 mb-6">
          If you can see this page, hydration is working correctly!
          No server/client component boundary violations.
        </p>
        <div className="space-y-3">
          <a 
            href="/" 
            className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-center"
          >
            Back to CubiQo
          </a>
          <button 
            onClick={() => console.log('Test button clicked')}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Test Client Interaction
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg text-left">
          <p className="text-sm text-gray-400 mb-2">Debug info:</p>
          <code className="text-xs text-gray-500">
            Time: {new Date().toISOString()}<br/>
            URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
            User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
          </code>
        </div>
      </div>
    </div>
  );
}