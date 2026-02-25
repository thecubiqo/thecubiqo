// Founders Pass - Sites Management + Launch Site Generator
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Site } from '@/lib/founders-pass/types';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    heroTitle: '',
    heroSubtitle: '',
  });

  const loadSites = useCallback(async () => {
    const res = await fetch('/api/founders-pass/sites');
    const data = await res.json();
    setSites(data.sites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleLaunchSite = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/founders-pass/generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          config: {
            hero: {
              title: form.heroTitle || form.name,
              subtitle: form.heroSubtitle || `Welcome to ${form.name}`,
            },
            seo: {
              title: form.name,
              description: form.description || `${form.name} – powered by CubiQo`,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.site) {
        setForm({ name: '', slug: '', description: '', heroTitle: '', heroSubtitle: '' });
        setShowCreate(false);
        loadSites();
        alert(`Site created! Preview: ${data.previewUrl}`);
      }
    } catch (err) {
      
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this site?')) return;
    await fetch(`/api/founders-pass/sites?id=${id}`, { method: 'DELETE' });
    loadSites();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading sites…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-zinc-400 text-sm">Manage deployed sites and launch new ones</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
        >
          {showCreate ? 'Cancel' : '🚀 Launch Site'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleLaunchSite} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6 space-y-4">
          <h3 className="text-lg font-semibold mb-2">Launch a New Site</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Site Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vollebak Replica"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="vollebak-replica"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="A futuristic clothing brand storefront"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Hero Title</label>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                placeholder="The Future of Clothing"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Hero Subtitle</label>
              <input
                type="text"
                value={form.heroSubtitle}
                onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                placeholder="Clothing from the future, today"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 rounded text-sm font-medium"
          >
            {generating ? 'Generating…' : '🚀 Launch Site'}
          </button>
        </form>
      )}

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-3 font-medium">{site.name}</td>
                <td className="p-3 font-mono text-zinc-400">{site.slug}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      site.status === 'active'
                        ? 'bg-emerald-900 text-emerald-300'
                        : site.status === 'preview'
                          ? 'bg-amber-900 text-amber-300'
                          : 'bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {site.status}
                  </span>
                </td>
                <td className="p-3 text-zinc-500 text-xs">
                  {new Date(site.created_at).toLocaleDateString()}
                </td>
                <td className="p-3 flex gap-2">
                  <Link
                    href={`/sites/${site.slug}`}
                    className="text-indigo-400 hover:underline text-xs"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-500">
                  No sites yet. Launch one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
