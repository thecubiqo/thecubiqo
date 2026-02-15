// Founders Pass - Feature Flags Management Page
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { FeatureFlag } from '@/lib/founders-pass/types';

export default function FlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    default_value: false,
    required_scopes: '',
  });

  const loadFlags = useCallback(async () => {
    const res = await fetch('/api/founders-pass/flags');
    const data = await res.json();
    setFlags(data.flags ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/founders-pass/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        required_scopes: form.required_scopes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setForm({ key: '', name: '', description: '', default_value: false, required_scopes: '' });
    setShowCreate(false);
    loadFlags();
  };

  const toggleDefault = async (flag: FeatureFlag) => {
    await fetch('/api/founders-pass/flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: flag.id, default_value: !flag.default_value }),
    });
    loadFlags();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this flag?')) return;
    await fetch(`/api/founders-pass/flags?id=${id}`, { method: 'DELETE' });
    loadFlags();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading flags…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feature Flags</h1>
          <p className="text-zinc-400 text-sm">Create, toggle, and manage feature flags</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium"
        >
          {showCreate ? 'Cancel' : '+ New Flag'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Key</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="gmail_read"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Gmail Read Access"
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
              placeholder="Allow users to connect Gmail for read-only access"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400">Required Scopes (comma-separated)</label>
            <input
              type="text"
              value={form.required_scopes}
              onChange={(e) => setForm({ ...form, required_scopes: e.target.value })}
              placeholder="gmail.readonly, gmail.send"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={form.default_value}
                onChange={(e) => setForm({ ...form, default_value: e.target.checked })}
                className="rounded bg-zinc-800 border-zinc-700"
              />
              Enabled by default
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium"
          >
            Create Flag
          </button>
        </form>
      )}

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-left">
              <th className="p-3">Key</th>
              <th className="p-3">Name</th>
              <th className="p-3">Default</th>
              <th className="p-3">Scopes</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => (
              <tr key={flag.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="p-3 font-mono text-indigo-300">{flag.key}</td>
                <td className="p-3">{flag.name}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleDefault(flag)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.default_value ? 'bg-emerald-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.default_value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="p-3 text-zinc-500 text-xs">
                  {flag.required_scopes?.join(', ') || '—'}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(flag.id)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {flags.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-500">
                  No flags yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
