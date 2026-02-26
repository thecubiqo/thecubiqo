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
  // For TSX/JSX/HTML, try to render it
  if (['tsx', 'jsx', 'html'].includes(language)) {
    return `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #1a1a2e; color: #e4e4e7; padding: 16px; }
  .error { color: #f87171; font-family: monospace; white-space: pre-wrap; padding: 12px; background: #1e1e2e; border-radius: 8px; border: 1px solid #f8717133; }
  .output { padding: 12px; background: #16213e; border-radius: 8px; border: 1px solid #ffffff11; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  h2 { font-size: 18px; margin-bottom: 6px; }
  p { margin-bottom: 8px; line-height: 1.5; }
  button { padding: 8px 16px; background: #0f3460; color: white; border: none; border-radius: 6px; cursor: pointer; }
  button:hover { background: #1a4a7a; }
  input { padding: 8px 12px; background: #16213e; border: 1px solid #ffffff22; border-radius: 6px; color: white; outline: none; }
  input:focus { border-color: #0f3460; }
</style>
</head>
<body>
<div id="root"></div>
<script>
try {
  const root = document.getElementById('root');
  // Try to execute the code
  const result = (function() {
    ${code}
  })();
  if (result !== undefined) {
    if (typeof result === 'string') {
      root.innerHTML = result;
    } else if (typeof result === 'object') {
      root.innerHTML = '<div class="output"><pre>' + JSON.stringify(result, null, 2) + '</pre></div>';
    } else {
      root.textContent = String(result);
    }
  }
} catch(e) {
  document.getElementById('root').innerHTML = '<div class="error"><strong>Preview Error:</strong>\\n' + e.message + '</div>';
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
              className={`p-2 rounded transition-all text-xs ${
                autoRefresh ? 'text-teal-400 bg-teal-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-700'
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
