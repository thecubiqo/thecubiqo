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

import { useState } from 'react';
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
  { name: 'Ollama (Local AI)', status: 'ready' as const, icon: '🦙' },
  { name: 'OpenRouter', status: 'ready' as const, icon: '🔀' },
  { name: 'Vercel Deploy', status: 'ready' as const, icon: '▲' },
  { name: 'Docker Sandbox', status: 'ready' as const, icon: '🐳' },
  { name: 'Stripe Payments', status: 'ready' as const, icon: '💳' },
  { name: 'Resend Email', status: 'ready' as const, icon: '📧' },
  { name: 'Shopify Store', status: 'ready' as const, icon: '🛍️' },
  { name: 'Printify Merch', status: 'ready' as const, icon: '👕' },
  { name: 'Telegram Bot', status: 'ready' as const, icon: '📱' },
] as const;

const STATUS_COLORS = {
  ready: 'text-green-400 bg-green-500/10 border-green-500/20',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  offline: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function CoderPage() {
  const [showIntegrations, setShowIntegrations] = useState(false);

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
        <StudioLayout />
      </div>
    </div>
  );
}
