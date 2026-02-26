'use client';

/**
 * CubiQo Coder — Main Page
 *
 * Full-featured coding IDE with:
 *   - Monaco code editor (multi-file tabs)
 *   - AI conversation panel
 *   - Integrated terminal
 *   - Live preview
 *   - File explorer
 *
 * This page works independently — it can be used to fix/debug
 * other CubiQo features even if they are broken.
 *
 * Routes:
 *   /coder       — within cubiqo.ai
 *   cubiqo.dev   — standalone domain
 */

import { useState, Suspense } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import {
  Code2,
  Terminal,
  MessageSquare,
  Eye,
  FolderTree,
  Plug,
  Activity,
  ExternalLink,
} from 'lucide-react';

/* ─── Integration registry ────────────────────────────────── */
const INTEGRATIONS = [
  { name: 'Monaco Editor', status: 'ready' as const, icon: '📝' },
  { name: 'AI Conversation', status: 'ready' as const, icon: '🤖' },
  { name: 'Terminal (Sandbox)', status: 'ready' as const, icon: '💻' },
  { name: 'Live Preview', status: 'ready' as const, icon: '👁️' },
  { name: 'File Explorer', status: 'ready' as const, icon: '📂' },
  { name: 'Supabase DB', status: 'ready' as const, icon: '🗄️' },
  { name: 'GitHub API', status: 'ready' as const, icon: '🐙' },
  { name: 'Anthropic Claude', status: 'ready' as const, icon: '🧠' },
  { name: 'OpenAI GPT', status: 'ready' as const, icon: '✨' },
  { name: 'Google Gemini', status: 'ready' as const, icon: '💎' },
  { name: 'Vercel Deploy', status: 'ready' as const, icon: '▲' },
  { name: 'Docker Sandbox', status: 'ready' as const, icon: '🐳' },
] as const;

const STATUS_COLORS = {
  ready: 'text-green-400 bg-green-500/10 border-green-500/20',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  offline: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function CoderPage() {
  const [showIntegrations, setShowIntegrations] = 
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if required APIs are available
    try {
      if (typeof window === 'undefined') {
        throw new Error('Coder requires browser environment');
      }
      
      // Check for required Web APIs
      if (!window.localStorage) {
        console.warn('localStorage not available - some features may be limited');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Coder initialization error:', err);
    }
  }, []);
      useState(false);

  
    // Display error if initialization failed
    if (error) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Coder Initialization Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-center"
              >
                Back to CubiQo
              </a>
            </div>
            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-left">
              <p className="text-sm text-gray-400 mb-2">Debug info:</p>
              <code className="text-xs text-gray-500">
                URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
                User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}<br/>
                Time: 2026-02-26T08:33:52.780Z
              </code>
            </div>
          </div>
        </div>
      );
    }
    
    return (
    <div className="flex flex-col h-screen">
      {/* ─── Header bar ──────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Code2 size={20} className="text-purple-400" />
          <h1 className="text-sm font-bold tracking-wider uppercase text-white/80">
            CubiQo Coder
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
            independent
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Integration status pill */}
          <button
            onClick={() => setShowIntegrations(!showIntegrations)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <Plug size={12} />
            {INTEGRATIONS.length} integrations ready
          </button>

          {/* Links to other panels */}
          <a
            href="/marketing"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ExternalLink size={12} />
            Marketing
          </a>
          <a
            href="/admin/social-army"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Activity size={12} />
            Social Army
          </a>
        </div>
      </header>

      {/* ─── Integration panel (collapsible) ──── */}
      {showIntegrations && (
        <div className="bg-[#0d0d14] border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Plug size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              3rd-Party Integrations
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration.name}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUS_COLORS[integration.status]}`}
              >
                <span>{integration.icon}</span>
                <span className="truncate">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main IDE ────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">💻</div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading CubiQo Studio</h3>
              <p className="text-gray-400">Initializing code editor, terminal, and AI...</p>
              <div className="mt-6 w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        }>
          <StudioLayout />
        </Suspense>
  >
      </div>
    </div>
  );
}
