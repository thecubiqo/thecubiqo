'use client';

import { useState } from 'react';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

export default function PreviewPanel() {
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

  const startDevServer = () => {
    setIsLoading(true);
    // Simulate dev server start
    setTimeout(() => {
      setPreviewUrl('http://localhost:3000');
      setIsLoading(false);
    }, 2000);
  };

  const getDeviceStyles = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px] mx-auto';
      case 'tablet':
        return 'max-w-[768px] mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-xl">👁️</div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Live Preview
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
              title="Reload"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
              title="Open in new window"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>

        {/* URL Bar */}
        <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2 mb-3 border border-gray-700">
          <span className="text-xs text-gray-500">🔒</span>
          <input
            type="text"
            value={previewUrl || 'http://localhost:3000'}
            onChange={(e) => setPreviewUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder-gray-600"
            placeholder="Preview URL"
          />
        </div>

        {/* Device Selector */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${deviceMode === 'desktop'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            🖥️ Desktop
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${deviceMode === 'tablet'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            📱 Tablet
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${deviceMode === 'mobile'
                ? 'bg-teal-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            📱 Mobile
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-950 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" message="Loading preview..." />
          </div>
        ) : !previewUrl ? (
          <EmptyState
            icon="🎨"
            title="No Preview Available"
            description="Start your dev server to see a live preview of your application"
            action={{
              label: "Start Dev Server",
              onClick: startDevServer
            }}
          />
        ) : (
          <div className={`${getDeviceStyles()} h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300`}>
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
