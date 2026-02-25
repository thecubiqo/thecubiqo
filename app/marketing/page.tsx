'use client';

/**
 * CubiQo Marketing — Social Army Dashboard (Standalone)
 *
 * Provides the same campaign & account management as
 * /admin/social-army but wrapped in its own independent shell.
 *
 * Features:
 *   - 10-platform overview (Twitter, TikTok, LinkedIn, Instagram,
 *     YouTube, Reddit, Pinterest, Threads, Facebook, Discord)
 *   - Project / campaign creation
 *   - 1-click "Create 1 Account per Platform"
 *   - Sample post generation
 *   - GFXToolz & content engine status
 *
 * Routes:
 *   /marketing           — within cubiqo.ai
 *   cubiqo.marketing     — standalone domain
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Globe,
  Users,
  Zap,
  MessageSquare,
  Plus,
  Loader2,
  ExternalLink,
  BarChart3,
  Target,
  Radio,
  Code2,
  Plug,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────
const PLATFORMS = [
  'twitter',
  'tiktok',
  'linkedin',
  'instagram',
  'youtube',
  'reddit',
  'pinterest',
  'threads',
  'facebook',
  'discord',
] as const;

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '🐦',
  tiktok: '🎵',
  linkedin: '💼',
  instagram: '📸',
  youtube: '▶️',
  reddit: '🤖',
  pinterest: '📌',
  threads: '🧵',
  facebook: '👥',
  discord: '🎮',
};

const PERSONA_DEFAULTS: Record<string, string> = {
  twitter: 'builder',
  tiktok: 'memer',
  linkedin: 'builder',
  instagram: 'artist',
  youtube: 'guru',
  reddit: 'philosopher',
  pinterest: 'artist',
  threads: 'philosopher',
  facebook: 'guru',
  discord: 'builder',
};

// ─── Auth helper ────────────────────────────────────────────
async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
  return h;
}

// ─── Types ──────────────────────────────────────────────────
interface SystemStatus {
  system: { platforms: number; platformsWithAccounts: number; allPlatformsCovered: boolean };
  accounts: { total: number; active: number; byPlatform: Record<string, { total: number; active: number }> };
  contentEngine: {
    status: string;
    gfxtoolz: { connected: boolean; hasUser: boolean; hasPass: boolean };
    fallbacks: { gemini: boolean; openai: boolean; template: boolean };
  };
  campaigns: { total: number; running: number; paused: number };
  queue: Record<string, number>;
  readiness: { canCreateAccounts: boolean; canGenerateContent: boolean; canPost: boolean; canPostAllPlatforms: boolean; message: string };
  timestamp: string;
}

interface SamplePostResult {
  success: boolean;
  campaign: { id: string; name: string };
  platforms: number;
  generated: number;
  skipped: number;
  posts: Array<{
    platform: string;
    username: string;
    caption: string;
    status: string;
    queueItemId?: string;
  }>;
  message: string;
}

// ─── Component ──────────────────────────────────────────────
export default function MarketingPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingAccounts, setCreatingAccounts] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [generatingSamples, setGeneratingSamples] = useState(false);
  const [sampleResults, setSampleResults] = useState<SamplePostResult | null>(null);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Fetch system status ────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social-army/status', {
        headers: await authHeaders(),
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (err) {
      console.error('[Marketing] fetchStatus error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ─── Create 1 account per platform ──────────────────────
  const handleCreateAccounts = async () => {
    setCreatingAccounts(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const results: string[] = [];
      let created = 0;

      for (const platform of PLATFORMS) {
        // Skip if platform already has an active account
        if (status?.accounts.byPlatform[platform]?.active) continue;

        const res = await fetch('/api/admin/social-army/accounts', {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({
            platform,
            username: `cubiqo_${platform}_1`,
            persona_type: PERSONA_DEFAULTS[platform],
            status: 'active',
          }),
        });

        if (res.ok) {
          created++;
          results.push(`✅ ${platform}`);
        } else {
          const data = await res.json().catch(() => ({}));
          results.push(`⚠️ ${platform}: ${data.error || res.statusText}`);
        }
      }

      setSuccessMsg(
        created > 0
          ? `Created ${created} new account${created !== 1 ? 's' : ''}. ${results.join(', ')}`
          : 'All platforms already have active accounts.'
      );
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create accounts');
    } finally {
      setCreatingAccounts(false);
    }
  };

  // ─── Create a project (campaign) ────────────────────────
  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setCreatingProject(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/social-army', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          name: projectName.trim(),
          seed_topic: `${projectName.trim()} — CubiQo AI social media launch`,
          total_posts_target: PLATFORMS.length,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Project "${projectName.trim()}" created!`);
        setProjectName('');
        await fetchStatus();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreatingProject(false);
    }
  };

  // ─── Generate sample posts ──────────────────────────────
  const handleSamplePost = async () => {
    setGeneratingSamples(true);
    setError(null);
    setSampleResults(null);

    try {
      const res = await fetch('/api/admin/social-army/sample-post', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          topic: 'CubiQo AI — Your intelligent life companion',
        }),
      });

      if (res.ok) {
        const data: SamplePostResult = await res.json();
        setSampleResults(data);
        setSuccessMsg(data.message);
        await fetchStatus();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to generate samples');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGeneratingSamples(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ──────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#111118] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Globe size={20} className="text-purple-400" />
          <h1 className="text-sm font-bold tracking-wider uppercase text-white/80">
            CubiQo Marketing
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
            independent
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/coder"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Code2 size={12} />
            Coder
          </a>
          <a
            href="/admin/social-army"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ExternalLink size={12} />
            Full Admin
          </a>
        </div>
      </header>

      {/* ─── Messages ────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle size={14} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle size={14} />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── Main content ────────────────────────── */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ─── System Status Banner ──────────────── */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-purple-400" />
                Social Army — 10 Platform Overview
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                10 platforms · 1 account each · instant sample posts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* GFXToolz status */}
              <div
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
                  status?.contentEngine.gfxtoolz.connected
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                }`}
              >
                <Plug size={12} />
                GFXToolz:{' '}
                {status?.contentEngine.gfxtoolz.connected
                  ? 'Connected'
                  : 'Template Mode'}
              </div>
              {/* Content engine */}
              <div className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-black/20 text-gray-400">
                Engine: {status?.contentEngine.status || '…'}
              </div>
            </div>
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-5 gap-3">
            {PLATFORMS.map((p) => {
              const info = status?.accounts.byPlatform[p];
              const active = info?.active ?? 0;
              return (
                <div
                  key={p}
                  className={`bg-black/30 border rounded-lg p-3 text-center transition-colors ${
                    active > 0
                      ? 'border-purple-500/30'
                      : 'border-white/5'
                  }`}
                >
                  <div className="text-2xl mb-1">{PLATFORM_ICONS[p]}</div>
                  <div className="text-xs font-bold capitalize text-white">
                    {p}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      active > 0 ? 'text-green-400' : 'text-gray-500'
                    }`}
                  >
                    {active > 0 ? `${active} active` : 'no account'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-white">
                {status?.accounts.active ?? 0}
              </div>
              <div className="text-xs text-gray-400">Active Accounts</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-2xl font-mono font-bold text-white">
                {status?.system.platformsWithAccounts ?? 0}/10
              </div>
              <div className="text-xs text-gray-400">Platforms Covered</div>
            </div>
            <div className="text-center border-r border-white/10">
              <div className="text-2xl font-mono font-bold text-white">
                {status?.campaigns.running ?? 0}
              </div>
              <div className="text-xs text-gray-400">Running Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-white">
                {status?.queue.posted ?? 0}
              </div>
              <div className="text-xs text-gray-400">Posts Delivered</div>
            </div>
          </div>
        </div>

        {/* ─── Actions ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create Project */}
          <div className="bg-[#111118] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
              <Target size={14} className="text-purple-400" />
              Create Project
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project 1"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleCreateProject}
                disabled={creatingProject || !projectName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all"
              >
                {creatingProject ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Create
              </button>
            </div>
          </div>

          {/* Create Accounts */}
          <div className="bg-[#111118] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
              <Users size={14} className="text-cyan-400" />
              Accounts (1 per Platform)
            </h3>
            <button
              onClick={handleCreateAccounts}
              disabled={creatingAccounts}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all"
            >
              {creatingAccounts ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Users size={14} />
              )}
              {creatingAccounts
                ? 'Creating…'
                : status?.system.allPlatformsCovered
                ? '✅ All 10 Covered'
                : `Create ${10 - (status?.system.platformsWithAccounts ?? 0)} Account${(10 - (status?.system.platformsWithAccounts ?? 0)) !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Sample Posts */}
          <div className="bg-[#111118] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-green-400" />
              Sample Posts
            </h3>
            <button
              onClick={handleSamplePost}
              disabled={generatingSamples}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all"
            >
              {generatingSamples ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              {generatingSamples
                ? 'Generating…'
                : '📮 Post 1 Sample per Platform'}
            </button>
          </div>
        </div>

        {/* ─── Sample results ────────────────────── */}
        {sampleResults && (
          <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <CheckCircle size={14} />
                {sampleResults.message}
              </h3>
              <button
                onClick={() => setSampleResults(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {sampleResults.posts.map((post) => (
                <div
                  key={post.platform}
                  className={`bg-black/30 border rounded-lg p-3 ${
                    post.status === 'ready'
                      ? 'border-cyan-500/20'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {PLATFORM_ICONS[post.platform]}
                    </span>
                    <span className="text-xs font-bold capitalize text-white">
                      {post.platform}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {post.username}
                  </div>
                  <div
                    className={`text-[10px] mt-1 font-bold uppercase ${
                      post.status === 'ready'
                        ? 'text-cyan-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {post.status}
                  </div>
                  {post.caption && (
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                      {post.caption.substring(0, 80)}…
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Quick links ───────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/admin/social-army"
            className="bg-[#111118] border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-purple-400" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-purple-300">
                  Full Admin Dashboard
                </div>
                <div className="text-xs text-gray-500">
                  Advanced account management, queue inspection, campaign
                  controls
                </div>
              </div>
              <ExternalLink
                size={14}
                className="ml-auto text-gray-600 group-hover:text-gray-400"
              />
            </div>
          </a>
          <a
            href="/coder"
            className="bg-[#111118] border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Code2 size={20} className="text-cyan-400" />
              <div>
                <div className="text-sm font-bold text-white group-hover:text-cyan-300">
                  CubiQo Coder
                </div>
                <div className="text-xs text-gray-500">
                  Independent AI-powered IDE — cubiqo.dev
                </div>
              </div>
              <ExternalLink
                size={14}
                className="ml-auto text-gray-600 group-hover:text-gray-400"
              />
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
