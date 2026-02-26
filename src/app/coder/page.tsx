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
  {
    label: 'L1 — Commerce Core', icon: '🛒', items: [
      { name: 'Shopify Plus', status: 'ready' as const, icon: '🛍️' },
    ]
  },
  {
    label: 'L2 — Payments', icon: '💳', items: [
      { name: 'Stripe', status: 'ready' as const, icon: '💳' },
      { name: 'PayPal', status: 'ready' as const, icon: '🅿️' },
      { name: 'Affirm (BNPL)', status: 'ready' as const, icon: '💰' },
      { name: 'Klarna', status: 'ready' as const, icon: '💎' },
    ]
  },
  {
    label: 'L3 — Apparel Production', icon: '👕', items: [
      { name: 'Printful', status: 'ready' as const, icon: '🖨️' },
      { name: 'Apliiq', status: 'ready' as const, icon: '🏷️' },
      { name: 'LA Apparel', status: 'ready' as const, icon: '👔' },
    ]
  },
  {
    label: 'L4 — Fulfillment', icon: '📦', items: [
      { name: 'ShipBob', status: 'ready' as const, icon: '📦' },
      { name: 'ShipHero', status: 'ready' as const, icon: '🏭' },
    ]
  },
  {
    label: 'L5 — Accessories', icon: '👜', items: [
      { name: 'Makers Row', status: 'ready' as const, icon: '🇺🇸' },
      { name: 'Alibaba Group', status: 'ready' as const, icon: '🌏' },
    ]
  },
  {
    label: 'L6 — Fragrance', icon: '🧴', items: [
      { name: 'Onoxa', status: 'ready' as const, icon: '🧴' },
      { name: 'Private Label Dynamics', status: 'ready' as const, icon: '🧪' },
    ]
  },
  {
    label: 'L7 — Analytics', icon: '📊', items: [
      { name: 'Google Analytics', status: 'ready' as const, icon: '📈' },
      { name: 'Triple Whale', status: 'ready' as const, icon: '🐳' },
      { name: 'Hotjar', status: 'ready' as const, icon: '🔥' },
    ]
  },
  {
    label: 'L8 — Marketing', icon: '📣', items: [
      { name: 'Klaviyo', status: 'ready' as const, icon: '📧' },
      { name: 'Meta Ads', status: 'ready' as const, icon: '📱' },
      { name: 'TikTok Ads', status: 'ready' as const, icon: '🎵' },
      { name: 'Google Ads', status: 'ready' as const, icon: '🔍' },
    ]
  },
  {
    label: 'L9 — Customer Experience', icon: '🎁', items: [
      { name: 'Gorgias', status: 'ready' as const, icon: '💬' },
      { name: 'Loop Returns', status: 'ready' as const, icon: '🔄' },
    ]
  },
  {
    label: 'L10 — Enterprise Control', icon: '🏢', items: [
      { name: 'Notion', status: 'ready' as const, icon: '📓' },
      { name: 'Slack', status: 'ready' as const, icon: '💬' },
      { name: 'Figma', status: 'ready' as const, icon: '🎨' },
    ]
  },
  {
    label: 'L11 — Global Protection', icon: '🌍', items: [
      { name: 'USPTO', status: 'ready' as const, icon: '🏛️' },
      { name: 'Madrid Protocol', status: 'ready' as const, icon: '🌐' },
    ]
  },
  {
    label: 'L12 — Experience & Personalization', icon: '✨', items: [
      { name: 'Algolia', status: 'ready' as const, icon: '🔎' },
      { name: 'Dynamic Yield', status: 'ready' as const, icon: '🎯' },
      { name: 'LivePerson', status: 'ready' as const, icon: '💁' },
    ]
  },
  {
    label: 'L13 — Product & Data', icon: '🗂️', items: [
      { name: 'Akeneo PIM', status: 'ready' as const, icon: '📋' },
      { name: 'Segment CDP', status: 'ready' as const, icon: '📡' },
    ]
  },
  {
    label: 'L14 — CRM & Sales', icon: '🤝', items: [
      { name: 'HubSpot', status: 'ready' as const, icon: '🟠' },
      { name: 'Salesforce', status: 'ready' as const, icon: '☁️' },
    ]
  },
  {
    label: 'L15 — Trust & Security', icon: '🛡️', items: [
      { name: 'Snyk', status: 'ready' as const, icon: '🔒' },
      { name: 'Cloudflare Enterprise', status: 'ready' as const, icon: '🛡️' },
    ]
  },
] as const;

const ALL_LUXURY_ITEMS = LUXURY_LAYERS.flatMap(l => [...l.items]);
const TOTAL_INTEGRATIONS = PLATFORM_INTEGRATIONS.length + ALL_LUXURY_ITEMS.length;

const STATUS_COLORS = {
  ready: 'text-green-400 bg-green-500/10 border-green-500/20',
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  offline: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function CoderPage() {
  return (
    <div className="h-screen w-screen bg-black">
      <StudioLayout />
    </div>
  );
}
