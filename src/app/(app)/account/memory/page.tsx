'use client';

import { useEffect, useState } from 'react';
import { Brain, Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { apiGet, apiSend, formatDate } from '../../_components/client-api';

type MemoryEvent = {
  id: string;
  event_type?: string | null;
  summary?: string | null;
  keywords?: string[] | null;
  weight?: number | null;
  created_at?: string | null;
};

type MemoryPayload = {
  memories: MemoryEvent[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export default function MemoryPage() {
  const [payload, setPayload] = useState<MemoryPayload | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(q: string = search) {
    setError('');
    try {
      const data = await apiGet<MemoryPayload>(`/api/memory?per_page=50${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load memory');
    }
  }

  useEffect(() => {
    load('');
  }, []);

  async function clearAll() {
    if (!confirm('Soft-delete every memory item? They are recoverable for 30 days.')) return;
    setBusy(true);
    try {
      await apiSend('/api/memory', 'DELETE');
      await load('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear memory');
    } finally {
      setBusy(false);
    }
  }

  async function deleteOne(id: string) {
    try {
      await apiSend(`/api/memory/${id}`, 'DELETE');
      await load(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Your AI's recall</p>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-50">
            <Brain className="h-5 w-5 text-cyan-300" /> My Memory
          </h2>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/memory/export"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            <Download className="h-4 w-4" /> Export
          </a>
          <button
            onClick={clearAll}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Clear all
          </button>
        </div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          load(search);
        }}
        className="mb-4 flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories…"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>
      )}

      <div className="mb-2 text-xs text-slate-500">
        {payload ? `${payload.total} memory ${payload.total === 1 ? 'item' : 'items'} stored` : 'Loading…'}
      </div>

      <div className="space-y-2">
        {(payload?.memories || []).map(item => (
          <div key={item.id} className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-slate-800 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-slate-400">
                  {item.event_type || 'note'}
                </span>
                {(item.weight ?? 0) >= 2 && (
                  <span className="rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[0.65rem] text-cyan-200">
                    weight {item.weight}
                  </span>
                )}
                <span className="text-[0.65rem] text-slate-500">{formatDate(item.created_at)}</span>
              </div>
              <button
                onClick={() => deleteOne(item.id)}
                className="rounded-md border border-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-400 hover:bg-rose-500/10 hover:text-rose-200"
                title="Delete (recoverable for 30 days)"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{item.summary}</p>
            {Array.isArray(item.keywords) && item.keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.keywords.slice(0, 6).map(k => (
                  <span key={k} className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.65rem] text-slate-400">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {payload && payload.memories.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            No memories {search ? 'match that search' : 'yet'}. Keep chatting — CubiQo writes the meaningful bits here.
          </div>
        )}
      </div>
    </div>
  );
}
