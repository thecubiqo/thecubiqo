'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Plus, Search, ShieldCheck } from 'lucide-react';
import { apiGet } from '../_components/client-api';

type Thread = {
  id: string;
  cq_number?: string | null;
  display_name?: string | null;
  last_message_preview?: string | null;
  unread_count?: number | null;
  updated_at?: string | null;
};

export default function MessengerPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [cqNumber, setCqNumber] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      apiGet<{ threads?: Thread[] }>('/api/cq/threads'),
      apiGet<{ cq_number?: string }>('/api/cq/profile')
    ]).then(results => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setThreads(results[0].value.threads || []);
      if (results[1].status === 'fulfilled') setCqNumber(results[1].value.cq_number || null);
      setLoading(false);
    }).catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Could not load messenger');
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Private 1:1 — CQ to CQ</p>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-50">
            <Mail className="h-5 w-5 text-cyan-300" /> CQ Messenger
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Encrypted direct messages between users who have exchanged CQ Numbers. CubiQo can read these aloud,
            summarise threads, and draft replies on your behalf — you always approve before anything is sent.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Your CQ Number</div>
          <div className="mt-1 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-sm text-cyan-200">
            {cqNumber || 'CQ-—————'}
          </div>
          <div className="mt-1 text-[0.65rem] text-slate-500">Share to receive DMs</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search threads…"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
          <Plus className="h-4 w-4" /> New thread
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>
      )}

      <div className="space-y-2">
        {threads.map(t => (
          <a
            key={t.id}
            href={`/messenger/${t.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-neutral-950 p-3 transition hover:border-cyan-400/40"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-100">{t.display_name || t.cq_number || 'Untitled'}</span>
                {t.unread_count ? (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.6rem] text-cyan-200">
                    {t.unread_count} new
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-slate-400">{t.last_message_preview || '…'}</p>
            </div>
            <span className="font-mono text-[0.65rem] text-slate-500">{t.cq_number || ''}</span>
          </a>
        ))}

        {!loading && threads.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
            No direct conversations yet. Share your CQ Number with someone to start a private thread — CubiQo
            handles the rest (drafts, summaries, read-aloud).
          </div>
        )}
      </div>
    </div>
  );
}
