'use client';

import { useState } from 'react';

export default function PreviewPanel() {
  const [previewUrl, setPreviewUrl] = useState('about:blank');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">👁️ Live Preview</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsLoading(!isLoading)}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              ↻ Reload
            </button>
            <button className="text-xs text-gray-400 hover:text-gray-200">
              ⬜ Pop out
            </button>
          </div>
        </div>
        
        {/* URL Bar */}
        <div className="flex items-center gap-2 bg-gray-900 rounded px-3 py-2">
          <span className="text-xs text-gray-500">🔒</span>
          <input
            type="text"
            value={previewUrl === 'about:blank' ? 'http://localhost:3000' : previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs text-gray-300 outline-none"
            placeholder="Preview URL"
          />
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading preview...</div>
          </div>
        ) : previewUrl === 'about:blank' ? (
          <div className="flex items-center justify-center h-full flex-col gap-4">
            <div className="text-6xl">🎨</div>
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Preview Coming Soon
              </h4>
              <p className="text-sm text-gray-600">
                Your app will appear here once it's running
              </p>
              <button className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md text-sm hover:bg-teal-600">
                Start Dev Server
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
          />
        )}
      </div>

      {/* Device Selector */}
      <div className="p-2 border-t border-gray-700 flex items-center gap-2 justify-center">
        <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
          💻 Desktop
        </button>
        <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
          📱 Mobile
        </button>
        <button className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded">
          📱 Tablet
        </button>
      </div>
    </div>
  );
}
