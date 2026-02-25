'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Globe, Users, Zap, MessageSquare, Code, Tv,
    AlertTriangle, CheckCircle, Play, Pause, Trash2,
    RefreshCw, Plus, X, ChevronDown, Loader2,
    Twitter, Linkedin, Instagram, Youtube, Activity,
    ExternalLink, BarChart3, Clock, Target, Radio,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────

interface Account {
    id: string;
    platform: string;
    username: string;
    persona_type: string;
    status: string;
    last_posted_at: string | null;
    created_at: string;
}

interface Campaign {
    id: string;
    name: string;
    seed_topic: string;
    status: string;
    total_posts_target: number;
    posted_count: number;
    progress: number;
    created_at: string;
}

interface QueueItem {
    id: string;
    generation_status: string;
    content_type: string;
    caption: string | null;
    asset_url: string | null;
    posted_at: string | null;
    created_at: string;
    social_campaigns: { name: string } | null;
}

interface QueueSummary {
    pending: number;
    processing: number;
    ready: number;
    posted: number;
    failed: number;
}

// ─── Constants ───────────────────────────────────────────

const PLATFORMS = ['twitter', 'tiktok', 'linkedin', 'instagram', 'youtube', 'reddit', 'pinterest', 'threads', 'facebook', 'discord'] as const;
const PERSONAS = ['builder', 'guru', 'philosopher', 'artist', 'memer'] as const;
const PLATFORM_ICONS: Record<string, string> = {
    twitter: '🐦', tiktok: '🎵', linkedin: '💼', instagram: '📸',
    youtube: '▶️', reddit: '🤖', pinterest: '📌', threads: '🧵',
    facebook: '👥', discord: '🎮',
};
const PERSONA_COLORS: Record<string, string> = {
    builder: 'text-blue-400 bg-blue-500/10',
    guru: 'text-yellow-400 bg-yellow-500/10',
    philosopher: 'text-purple-400 bg-purple-500/10',
    artist: 'text-pink-400 bg-pink-500/10',
    memer: 'text-green-400 bg-green-500/10',
};
const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-400 bg-green-500/10',
    limited: 'text-yellow-400 bg-yellow-500/10',
    banned: 'text-red-400 bg-red-500/10',
    offline: 'text-gray-400 bg-gray-500/10',
    running: 'text-green-400 bg-green-500/10',
    paused: 'text-yellow-400 bg-yellow-500/10',
    draft: 'text-gray-400 bg-gray-500/10',
    completed: 'text-blue-400 bg-blue-500/10',
};
const QUEUE_STATUS_COLORS: Record<string, string> = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    ready: 'text-cyan-400',
    posted: 'text-green-400',
    failed: 'text-red-400',
};

// ─── Auth Helper ─────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
    return h;
}

// ─── Sub-components ──────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-center">
            <div className={`text-2xl font-mono font-bold ${color}`}>{value.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
        </div>
    );
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
            {label}
        </span>
    );
}

// ─── Dashboard Tab ───────────────────────────────────────

function DashboardTab({ summary, accounts, campaigns }: {
    summary: QueueSummary;
    accounts: Account[];
    campaigns: Campaign[];
}) {
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    const platformCounts = PLATFORMS.map(p => ({
        p,
        count: accounts.filter(a => a.platform === p).length,
        active: accounts.filter(a => a.platform === p && a.status === 'active').length,
    }));

    const runningCampaigns = campaigns.filter(c => c.status === 'running').length;

    return (
        <div className="space-y-6">
            {/* 10-10-10 Status Banner */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target size={18} className="text-purple-400" />
                            10-10-10 Target
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">10 platforms · 10 accounts each · post in 10 minutes</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${runningCampaigns > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${runningCampaigns > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        {runningCampaigns > 0 ? `${runningCampaigns} campaign${runningCampaigns > 1 ? 's' : ''} live` : 'No active campaigns'}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-mono font-bold text-white">{accounts.filter(a => a.status === 'active').length}</div>
                        <div className="text-xs text-gray-400 mt-1">Active Accounts</div>
                        <div className="text-xs text-purple-400">target: 100</div>
                    </div>
                    <div className="text-center border-x border-white/10">
                        <div className="text-3xl font-mono font-bold text-white">{platformCounts.filter(p => p.active > 0).length}</div>
                        <div className="text-xs text-gray-400 mt-1">Platforms Live</div>
                        <div className="text-xs text-purple-400">target: 10</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-mono font-bold text-white">{summary.posted.toLocaleString()}</div>
                        <div className="text-xs text-gray-400 mt-1">Posts Delivered</div>
                        <div className="text-xs text-purple-400">lifetime</div>
                    </div>
                </div>
            </div>

            {/* Queue Stats */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Content Queue ({total.toLocaleString()} total)</h3>
                <div className="grid grid-cols-5 gap-3">
                    <StatCard label="Pending" value={summary.pending} color="text-yellow-400" />
                    <StatCard label="Generating" value={summary.processing} color="text-blue-400" />
                    <StatCard label="Ready" value={summary.ready} color="text-cyan-400" />
                    <StatCard label="Posted" value={summary.posted} color="text-green-400" />
                    <StatCard label="Failed" value={summary.failed} color="text-red-400" />
                </div>
            </div>

            {/* Platform Coverage */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Platform Coverage</h3>
                <div className="grid grid-cols-5 gap-3">
                    {platformCounts.map(({ p, count, active }) => (
                        <div key={p} className={`bg-black/30 border rounded-lg p-3 text-center transition-colors ${active > 0 ? 'border-purple-500/30' : 'border-white/5'}`}>
                            <div className="text-2xl mb-1">{PLATFORM_ICONS[p]}</div>
                            <div className="text-xs font-bold capitalize text-white">{p}</div>
                            <div className={`text-xs mt-1 ${active > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                {active}/{count} active
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Accounts Tab ────────────────────────────────────────

function AccountsTab({ accounts, onRefresh }: { accounts: Account[]; onRefresh: () => void }) {
    const [filter, setFilter] = useState<string>('all');
    const [showAdd, setShowAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        platform: 'twitter' as typeof PLATFORMS[number],
        username: '',
        password: '',
        persona_type: 'builder' as typeof PERSONAS[number],
        status: 'active',
    });

    const filtered = filter === 'all' ? accounts : accounts.filter(a => a.platform === filter);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/social-army/accounts', {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setShowAdd(false);
            setForm({ platform: 'twitter', username: '', password: '', persona_type: 'builder', status: 'active' });
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        const h = await authHeaders();
        await fetch(`/api/admin/social-army/accounts?id=${id}`, {
            method: 'PATCH',
            headers: h,
            body: JSON.stringify({ status }),
        });
        onRefresh();
    };

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`Delete account @${username}? This cannot be undone.`)) return;
        const h = await authHeaders();
        await fetch(`/api/admin/social-army/accounts?id=${id}`, { method: 'DELETE', headers: h });
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        All ({accounts.length})
                    </button>
                    {PLATFORMS.map(p => {
                        const count = accounts.filter(a => a.platform === p).length;
                        return (
                            <button
                                key={p}
                                onClick={() => setFilter(p)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === p ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                {PLATFORM_ICONS[p]} {p} ({count})
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={14} /> Add Account
                </button>
            </div>

            {/* Add Account Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg">Add Social Account</h3>
                            <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Platform</label>
                                    <select
                                        value={form.platform}
                                        onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                    >
                                        {PLATFORMS.map(p => (
                                            <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Persona</label>
                                    <select
                                        value={form.persona_type}
                                        onChange={e => setForm(f => ({ ...f, persona_type: e.target.value as any }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                    >
                                        {PERSONAS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">
                                    Username
                                    {form.platform === 'discord' && <span className="text-gray-500 ml-1">(server/channel name)</span>}
                                </label>
                                <input
                                    required
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder={form.platform === 'discord' ? 'my-server-general' : `@${form.platform}_handle`}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">
                                    {form.platform === 'discord' ? 'Webhook URL' : 'Password / Credential'}
                                    <span className="text-gray-600 ml-1">(stored encrypted)</span>
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder={form.platform === 'discord'
                                        ? 'https://discord.com/api/webhooks/...'
                                        : 'password or pass|extra'}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                                />
                                {form.platform === 'reddit' && (
                                    <p className="text-xs text-gray-500 mt-1">Tip: use <code className="text-purple-400">password|subreddit</code> to target a specific sub</p>
                                )}
                                {form.platform === 'pinterest' && (
                                    <p className="text-xs text-gray-500 mt-1">Tip: use <code className="text-purple-400">password|Board Name</code> to pin to a specific board</p>
                                )}
                            </div>

                            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAdd(false)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors flex items-center justify-center gap-2">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {saving ? 'Saving…' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Accounts Table */}
            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-4 py-3">Platform</th>
                                <th className="text-left px-4 py-3">Username</th>
                                <th className="text-left px-4 py-3">Persona</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Last Posted</th>
                                <th className="text-right px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                                        No accounts found. Add accounts to get started.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(acc => (
                                    <tr key={acc.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-4 py-3">
                                            <span className="text-lg mr-1">{PLATFORM_ICONS[acc.platform]}</span>
                                            <span className="text-gray-300 capitalize">{acc.platform}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-200">
                                            @{acc.username}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge label={acc.persona_type} colorClass={PERSONA_COLORS[acc.persona_type] || 'text-gray-400 bg-gray-500/10'} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={acc.status}
                                                onChange={e => handleStatusChange(acc.id, e.target.value)}
                                                className="bg-transparent border-none text-xs focus:outline-none cursor-pointer"
                                            >
                                                {['active', 'limited', 'banned', 'offline'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[acc.status] || ''}`}>
                                                {acc.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {acc.last_posted_at
                                                ? new Date(acc.last_posted_at).toLocaleString()
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(acc.id, acc.username)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {filtered.length > 0 && (
                    <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-600">
                        {filtered.length} account{filtered.length !== 1 ? 's' : ''}
                        {filter !== 'all' && ` on ${filter}`}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Campaigns Tab ───────────────────────────────────────

function CampaignsTab({ campaigns, onRefresh }: { campaigns: Campaign[]; onRefresh: () => void }) {
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', seed_topic: 'CubiQo AI Revolution', total_posts_target: 100 });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/social-army', {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setShowNew(false);
            setForm({ name: '', seed_topic: 'CubiQo AI Revolution', total_posts_target: 100 });
            onRefresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleStatus = async (id: string, status: string) => {
        const res = await fetch(`/api/admin/social-army?id=${id}`, {
            method: 'PATCH',
            headers: await authHeaders(),
            body: JSON.stringify({ status }),
        });
        if (res.ok) onRefresh();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete campaign "${name}" and all its queued content?`)) return;
        await fetch(`/api/admin/social-army?id=${id}`, {
            method: 'DELETE',
            headers: await authHeaders(),
        });
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={14} /> New Campaign
                </button>
            </div>

            {/* New Campaign Modal */}
            {showNew && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg">New Campaign</h3>
                            <button onClick={() => setShowNew(false)} className="text-gray-500 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Campaign Name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Product Launch Week 1"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Seed Topic</label>
                                <input
                                    required
                                    value={form.seed_topic}
                                    onChange={e => setForm(f => ({ ...f, seed_topic: e.target.value }))}
                                    placeholder="e.g. CubiQo AI Revolution"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">GFXToolz + AI will generate platform-specific content around this topic</p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Posts Target</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={form.total_posts_target}
                                    onChange={e => setForm(f => ({ ...f, total_posts_target: parseInt(e.target.value) || 100 }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            {error && <p className="text-xs text-red-400 bg-red-500/10 rounded p-2">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowNew(false)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm text-white font-medium transition-colors flex items-center justify-center gap-2">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                    {saving ? 'Creating…' : 'Launch Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <div className="bg-black/20 border border-white/5 rounded-xl p-12 text-center">
                    <Target size={40} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No campaigns yet. Create your first campaign to start posting.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {campaigns.map(c => (
                        <div key={c.id} className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-white truncate">{c.name}</h3>
                                        <Badge label={c.status} colorClass={STATUS_COLORS[c.status] || 'text-gray-400 bg-gray-500/10'} />
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3">Topic: <span className="text-gray-200">{c.seed_topic}</span></p>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{c.posted_count.toLocaleString()} / {c.total_posts_target.toLocaleString()} posts</span>
                                            <span>{c.progress}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5">
                                            <div
                                                className="bg-gradient-to-r from-purple-600 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${c.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {c.status === 'running' && (
                                        <button
                                            onClick={async () => {
                                                const res = await fetch('/api/admin/social-army/generate', {
                                                    method: 'POST',
                                                    headers: await authHeaders(),
                                                    body: JSON.stringify({ campaignId: c.id }),
                                                });
                                                if (res.ok) onRefresh();
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Zap size={12} /> Generate
                                        </button>
                                    )}
                                    {c.status === 'running' ? (
                                        <button
                                            onClick={() => handleStatus(c.id, 'paused')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Pause size={12} /> Pause
                                        </button>
                                    ) : c.status === 'paused' ? (
                                        <button
                                            onClick={() => handleStatus(c.id, 'running')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Play size={12} /> Resume
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatus(c.id, 'running')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Play size={12} /> Start
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(c.id, c.name)}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-600">
                                Created {new Date(c.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Live Queue Tab ───────────────────────────────────────

function LiveQueueTab({ items, summary, onRefresh }: {
    items: QueueItem[];
    summary: QueueSummary;
    onRefresh: () => void;
}) {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const feedRef = useRef<HTMLDivElement>(null);

    const filtered = statusFilter === 'all' ? items : items.filter(i => i.generation_status === statusFilter);

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = 0;
        }
    }, [items]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {(['all', 'pending', 'processing', 'ready', 'posted', 'failed'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${statusFilter === s
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        >
                            {s === 'all' ? `All (${items.length})` : `${s} (${(summary as any)[s] ?? 0})`}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {summary.failed > 0 && (
                        <button
                            onClick={async () => {
                                await fetch('/api/admin/social-army/retry', {
                                    method: 'POST',
                                    headers: await authHeaders(),
                                    body: JSON.stringify({}),
                                });
                                onRefresh();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            <RefreshCw size={12} /> Retry Failed ({summary.failed})
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                    >
                        <RefreshCw size={12} /> Refresh
                    </button>
                </div>
            </div>

            <div
                ref={feedRef}
                className="bg-black/40 border border-white/10 rounded-xl font-mono text-xs h-[600px] overflow-y-auto"
            >
                <div className="sticky top-0 bg-black/80 backdrop-blur px-4 py-2 border-b border-white/5 flex items-center justify-between">
                    <span className="text-gray-500">CONTENT_QUEUE // LIVE FEED</span>
                    <span className={`flex items-center gap-1.5 ${summary.processing > 0 ? 'text-blue-400' : 'text-green-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${summary.processing > 0 ? 'bg-blue-400 animate-pulse' : 'bg-green-500'}`} />
                        {summary.processing > 0 ? `${summary.processing} generating` : 'idle'}
                    </span>
                </div>

                <div className="p-4 space-y-1.5">
                    {filtered.length === 0 ? (
                        <div className="text-gray-600 italic py-8 text-center">
                            No queue items. Launch a campaign to start generating content.
                        </div>
                    ) : (
                        filtered.map(item => (
                            <div key={item.id} className="flex gap-3 items-start hover:bg-white/3 rounded px-2 py-1 -mx-2 transition-colors group">
                                <span className="text-gray-600 shrink-0 tabular-nums">
                                    [{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={`shrink-0 ${QUEUE_STATUS_COLORS[item.generation_status] || 'text-gray-400'} font-bold`}>
                                    {item.generation_status.toUpperCase()}
                                </span>
                                <span className="text-purple-400 shrink-0">
                                    {item.content_type?.toUpperCase() || 'TASK'}
                                </span>
                                <span className="text-gray-400 truncate flex-1">
                                    {item.social_campaigns?.name && (
                                        <span className="text-gray-600">[{item.social_campaigns.name}] </span>
                                    )}
                                    {item.caption
                                        ? `"${item.caption.substring(0, 80)}${item.caption.length > 80 ? '…' : ''}"`
                                        : 'Generating content…'}
                                </span>
                                {item.asset_url && (
                                    <a
                                        href={item.asset_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 shrink-0 transition-opacity"
                                    >
                                        <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────

export default function SocialArmyConsole() {
    const [tab, setTab] = useState<'dashboard' | 'accounts' | 'campaigns' | 'queue'>('dashboard');
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [summary, setSummary] = useState<QueueSummary>({ pending: 0, processing: 0, ready: 0, posted: 0, failed: 0 });
    const [launching, setLaunching] = useState(false);

    const supabase = createClient();

    const fetchAll = useCallback(async () => {
        try {
            const [overviewRes, accountsRes] = await Promise.all([
                fetch('/api/admin/social-army', { headers: await authHeaders() }),
                fetch('/api/admin/social-army/accounts', { headers: await authHeaders() }),
            ]);

            if (overviewRes.ok) {
                const data = await overviewRes.json();
                setCampaigns(data.campaigns ?? []);
                setQueueItems(data.queue?.recent ?? []);
                setSummary(data.queue?.summary ?? { pending: 0, processing: 0, ready: 0, posted: 0, failed: 0 });
            }

            if (accountsRes.ok) {
                const data = await accountsRes.json();
                setAccounts(data.accounts ?? []);
            }
        } catch (err) {
            console.error('[SocialArmy] fetchAll error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();

        const channel = supabase
            .channel('social-army-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'content_queue' }, fetchAll)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'social_campaigns' }, fetchAll)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchAll]);

    // Quick-launch POC: creates a campaign and lets the worker seed all 100 accounts
    const handlePOCLaunch = async () => {
        setLaunching(true);
        try {
            const res = await fetch('/api/admin/social-army', {
                method: 'POST',
                headers: await authHeaders(),
                body: JSON.stringify({
                    name: `POC — ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                    seed_topic: 'CubiQo AI Revolution — the future of personal AI',
                    total_posts_target: 100,
                }),
            });
            if (res.ok) {
                const { campaign } = await res.json();
                // Seed content queue for the new campaign
                if (campaign?.id) {
                    await fetch('/api/admin/social-army/generate', {
                        method: 'POST',
                        headers: await authHeaders(),
                        body: JSON.stringify({ campaignId: campaign.id }),
                    });
                }
                await fetchAll();
                setTab('queue');
            }
        } finally {
            setLaunching(false);
        }
    };

    const TABS = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'accounts', label: `Accounts (${accounts.length})`, icon: Users },
        { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: Target },
        { id: 'queue', label: 'Live Queue', icon: Radio },
    ] as const;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-purple-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="text-purple-500" />
                        Social Army Command Center
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm">
                        10 platforms · 10 accounts each · post in 10 minutes
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${campaigns.filter(c => c.status === 'running').length > 0
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-white/10 bg-black/20 text-gray-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${campaigns.filter(c => c.status === 'running').length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                        {campaigns.filter(c => c.status === 'running').length > 0
                            ? `${campaigns.filter(c => c.status === 'running').length} running`
                            : 'Idle'}
                    </div>
                    <button
                        onClick={handlePOCLaunch}
                        disabled={launching}
                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                        {launching ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                        {launching ? 'Launching…' : '⚡ Run POC'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <t.icon size={14} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {tab === 'dashboard' && (
                <DashboardTab summary={summary} accounts={accounts} campaigns={campaigns} />
            )}
            {tab === 'accounts' && (
                <AccountsTab accounts={accounts} onRefresh={fetchAll} />
            )}
            {tab === 'campaigns' && (
                <CampaignsTab campaigns={campaigns} onRefresh={fetchAll} />
            )}
            {tab === 'queue' && (
                <LiveQueueTab items={queueItems} summary={summary} onRefresh={fetchAll} />
            )}
        </div>
    );
}

