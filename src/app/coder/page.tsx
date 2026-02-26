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
/* ─── Platform core integrations ─────────────────────────── */
const PLATFORM_INTEGRATIONS = [
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
  { name: 'Resend Email', status: 'ready' as const, icon: '📧' },
  { name: 'Telegram Bot', status: 'ready' as const, icon: '📱' },
] as const;

/* ─── 11-Layer Luxury Brand Commerce Stack ───────────────── */
const LUXURY_LAYERS = [
  { label: 'L1 — Commerce Core',       icon: '🛒', items: [
    { name: 'Shopify Plus', status: 'ready' as const, icon: '🛍️' },
  ]},
  { label: 'L2 — Payments',            icon: '💳', items: [
    { name: 'Stripe', status: 'ready' as const, icon: '💳' },
    { name: 'PayPal', status: 'ready' as const, icon: '🅿️' },
    { name: 'Affirm (BNPL)', status: 'ready' as const, icon: '💰' },
    { name: 'Klarna', status: 'ready' as const, icon: '💎' },
  ]},
  { label: 'L3 — Apparel Production',  icon: '👕', items: [
    { name: 'Printful', status: 'ready' as const, icon: '🖨️' },
    { name: 'Apliiq', status: 'ready' as const, icon: '🏷️' },
    { name: 'LA Apparel', status: 'ready' as const, icon: '👔' },
  ]},
  { label: 'L4 — Fulfillment',         icon: '📦', items: [
    { name: 'ShipBob', status: 'ready' as const, icon: '📦' },
    { name: 'ShipHero', status: 'ready' as const, icon: '🏭' },
  ]},
  { label: 'L5 — Accessories',         icon: '👜', items: [
    { name: 'Makers Row', status: 'ready' as const, icon: '🇺🇸' },
    { name: 'Alibaba Group', status: 'ready' as const, icon: '🌏' },
  ]},
  { label: 'L6 — Fragrance',           icon: '🧴', items: [
    { name: 'Onoxa', status: 'ready' as const, icon: '🧴' },
    { name: 'Private Label Dynamics', status: 'ready' as const, icon: '🧪' },
  ]},
  { label: 'L7 — Analytics',           icon: '📊', items: [
    { name: 'Google Analytics', status: 'ready' as const, icon: '📈' },
    { name: 'Triple Whale', status: 'ready' as const, icon: '🐳' },
    { name: 'Hotjar', status: 'ready' as const, icon: '🔥' },
  ]},
  { label: 'L8 — Marketing',           icon: '📣', items: [
    { name: 'Klaviyo', status: 'ready' as const, icon: '📧' },
    { name: 'Meta Ads', status: 'ready' as const, icon: '📱' },
    { name: 'TikTok Ads', status: 'ready' as const, icon: '🎵' },
    { name: 'Google Ads', status: 'ready' as const, icon: '🔍' },
  ]},
  { label: 'L9 — Customer Experience', icon: '🎁', items: [
    { name: 'Gorgias', status: 'ready' as const, icon: '💬' },
    { name: 'Loop Returns', status: 'ready' as const, icon: '🔄' },
  ]},
  { label: 'L10 — Enterprise Control', icon: '🏢', items: [
    { name: 'Notion', status: 'ready' as const, icon: '📓' },
    { name: 'Slack', status: 'ready' as const, icon: '💬' },
    { name: 'Figma', status: 'ready' as const, icon: '🎨' },
  ]},
  { label: 'L11 — Global Protection',  icon: '🌍', items: [
    { name: 'USPTO', status: 'ready' as const, icon: '🏛️' },
    { name: 'Madrid Protocol', status: 'ready' as const, icon: '🌐' },
  ]},
  { label: 'L12 — Experience & Personalization', icon: '✨', items: [
    { name: 'Algolia', status: 'ready' as const, icon: '🔎' },
    { name: 'Dynamic Yield', status: 'ready' as const, icon: '🎯' },
    { name: 'LivePerson', status: 'ready' as const, icon: '💁' },
  ]},
  { label: 'L13 — Product & Data', icon: '🗂️', items: [
    { name: 'Akeneo PIM', status: 'ready' as const, icon: '📋' },
    { name: 'Segment CDP', status: 'ready' as const, icon: '📡' },
  ]},
  { label: 'L14 — CRM & Sales', icon: '🤝', items: [
    { name: 'HubSpot', status: 'ready' as const, icon: '🟠' },
    { name: 'Salesforce', status: 'ready' as const, icon: '☁️' },
  ]},
  { label: 'L15 — Trust & Security', icon: '🛡️', items: [
    { name: 'Snyk', status: 'ready' as const, icon: '🔒' },
    { name: 'Cloudflare Enterprise', status: 'ready' as const, icon: '🛡️' },
  ]},
] as const;

const ALL_LUXURY_ITEMS = LUXURY_LAYERS.flatMap(l => [...l.items]);
const TOTAL_INTEGRATIONS = PLATFORM_INTEGRATIONS.length + ALL_LUXURY_ITEMS.length;

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
            {TOTAL_INTEGRATIONS} integrations ready
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
        <div className="bg-[#0d0d14] border-b border-white/10 px-4 py-3 max-h-[60vh] overflow-y-auto">
          {/* Platform Core */}
          <div className="flex items-center gap-2 mb-2">
            <Plug size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Platform Core
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {PLATFORM_INTEGRATIONS.map((integration) => (
              <div
                key={integration.name}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUS_COLORS[integration.status]}`}
              >
                <span>{integration.icon}</span>
                <span className="truncate">{integration.name}</span>
              </div>
            ))}
          </div>

          {/* Luxury Brand Stack */}
          <div className="flex items-center gap-2 mb-2 mt-3 pt-3 border-t border-white/5">
            <span className="text-sm">🏛️</span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Luxury Brand Commerce Stack
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              15 layers
            </span>
          </div>
          <div className="space-y-3">
            {LUXURY_LAYERS.map((layer) => (
              <div key={layer.label}>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>{layer.icon}</span>
                  {layer.label}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {layer.items.map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUS_COLORS[item.status]}`}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
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
