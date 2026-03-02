'use client';

export default function TestRoute() {
  return (
    <div className="min-h-screen bg-blue-900/20 flex items-center justify-center">
      <div className="text-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-blue-500/30 max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Test Route</h1>
        <p className="text-gray-300 mb-6">
          If you can see this page, Next.js routing is working correctly.
        </p>
        <div className="space-y-3">
          <a 
            href="/coder" 
            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center"
          >
            Try Coder Page Again
          </a>
          <a 
            href="/" 
            className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-center"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}