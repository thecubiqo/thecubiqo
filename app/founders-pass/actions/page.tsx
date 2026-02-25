// Founders Pass - Action Templates Builder
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ActionTemplate } from '@/lib/founders-pass/types';

export default function ActionsPage() {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    provider: 'gmail',
    required_scopes: '',
    confirmLabel: 'Confirm',
  });

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/founders-pass/actions');
    const data = await res.json();
    setTemplates(data.templates ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/founders-pass/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: form.key,
        name: form.name,
        description: form.description,
        provider: form.provider,
        required_scopes: form.required_scopes.split(',').map((s) => s.trim()).filter(Boolean),
        ui_schema: {
          title: form.name,
          confirmLabel: form.confirmLabel,
          cancelLabel: 'Cancel',
          fields: [
            { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Generated content…' },
          ],
        },
      }),
    });
    setForm({ key: '', name: '', description: '', provider: 'gmail', required_scopes: '', confirmLabel: 'Confirm' });
    setShowCreate(false);
    loadTemplates();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading action templates…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Action Templates</h1>
          <p className="text-zinc-400 text-sm">
            Define action cards for AI-driven operations requiring user confirmation
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium"
        >
          {showCreate ? 'Cancel' : '+ New Template'}
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
                placeholder="compose_email_draft"
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
                placeholder="Compose Email Draft"
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
              placeholder="AI composes an email draft for user review"
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              >
                <option value="gmail">Gmail</option>
                <option value="shopify">Shopify</option>
                <option value="stripe">Stripe</option>
                <option value="printify">Printify</option>
                <option value="printful">Printful</option>
                <option value="uber">Uber</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Required Scopes</label>
              <input
                type="text"
                value={form.required_scopes}
                onChange={(e) => setForm({ ...form, required_scopes: e.target.value })}
                placeholder="gmail.send"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Confirm Button Label</label>
              <input
                type="text"
                value={form.confirmLabel}
                onChange={(e) => setForm({ ...form, confirmLabel: e.target.value })}
                placeholder="Send Email"
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium"
          >
            Create Template
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{t.name}</h3>
              <span className="px-2 py-0.5 bg-purple-900 text-purple-300 rounded text-xs">
                {t.provider}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mb-2">{t.description}</p>
            <p className="text-xs text-zinc-500 font-mono">key: {t.key}</p>
            {t.required_scopes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {t.required_scopes.map((s) => (
                  <span key={s} className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
            No action templates yet. Create one above.
          </div>
        )}
      </div>
    </div>
  );
}
