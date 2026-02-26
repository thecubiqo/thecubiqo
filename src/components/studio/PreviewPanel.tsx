'use client';

import { useState, useEffect, useRef } from 'react';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

interface PreviewPanelProps {
  code?: string;
  language?: string;
}

/** Build sandboxed preview HTML for code */
function buildPreviewHtml(code: string, language: string): string {
  // For TSX/JSX/HTML, try to render it with Babel for JSX support
  if (['tsx', 'jsx', 'html'].includes(language)) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0a0a0a; color: white; margin: 0; font-family: sans-serif; }
    .preview-error { color: #ff4444; background: #221111; padding: 1rem; border-radius: 8px; border: 1px solid #442222; font-family: monospace; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      // Mock React if not available
      if (typeof React === 'undefined') {
        window.React = { createElement: (type, props, ...children) => ({ type, props, children }) };
      }

      // Execute code
      const Component = () => {
        ${code}
      };

      // Basic render simulation
      const root = document.getElementById('root');
      
      // If code looks like it exports something or just has a return
      const result = (function() {
        ${code.includes('return') ? code : `return (${code})`}
      })();

      if (typeof result === 'string') {
        root.innerHTML = result;
      } else if (result && typeof result === 'object') {
        // Fallback for objects/JSON
        root.innerHTML = '<pre class="p-4 bg-black/50 text-cyan-400">' + JSON.stringify(result, null, 2) + '</pre>';
      }
    } catch (e) {
      document.getElementById('root').innerHTML = '<div class="preview-error"><strong>Build Error:</strong><br/>' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
  }

  // For other languages, show the code output
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'SF Mono', Monaco, 'Courier New', monospace; background: #1a1a2e; color: #a8b2d1; padding: 16px; font-size: 13px; }
  pre { white-space: pre-wrap; word-wrap: break-word; }
  .lang { color: #64ffda; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="lang">${language}</div>
<pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
}

export default function PreviewPanel({ code, language }: PreviewPanelProps = {}) {
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Auto-refresh preview when code changes
  useEffect(() => {
    if (!code || !autoRefresh) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsLoading(true);
      setPreviewHtml(buildPreviewHtml(code, language || 'tsx'));
      setTimeout(() => setIsLoading(false), 200);
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code, language, autoRefresh]);

  const handleRefresh = () => {
    if (!code) return;
    setIsLoading(true);
    setPreviewHtml(buildPreviewHtml(code, language || 'tsx'));
    setTimeout(() => setIsLoading(false), 200);
  };

  const getDeviceStyles = () => {
    switch (deviceMode) {
      case 'mobile': return 'max-w-[375px] mx-auto';
      case 'tablet': return 'max-w-[768px] mx-auto';
      default: return 'w-full';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 bg-gray-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-xl">👁️</div>
            <h3 className="text-sm font-semibold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Live Preview
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded transition-all text-xs ${autoRefresh ? 'text-teal-400 bg-teal-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              {autoRefresh ? '🔄 Auto' : '🔄'}
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
              title="Refresh Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
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
            <LoadingSpinner size="lg" message="Rendering preview..." />
          </div>
        ) : previewHtml ? (
          <div className={`${getDeviceStyles()} h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300`}>
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              title="Live Preview"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <EmptyState
            icon="🎨"
            title="Preview Ready"
            description={code ? 'Click the refresh button to render your code' : 'Write or generate code to see a live preview'}
            action={code ? {
              label: "Render Preview",
              onClick: handleRefresh
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}
