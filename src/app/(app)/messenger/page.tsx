'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle, Plus, Search, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { apiGet } from '../_components/client-api';
import { authHeaders } from '@/next/lib/supabase-browser';

type Thread = {
  id: string;
  cq_number?: string | null;
  display_name?: string | null;
  last_message_preview?: string | null;
  unread_count?: number | null;
  updated_at?: string | null;
};

type RealtimeStatus = 'connecting' | 'live' | 'error' | 'off';

// ── Supabase Realtime client (anon key for client-side subscriptions) ─────────
type SbClient = ReturnType<typeof createClient>;
function getRealtimeClient(): SbClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

export default function MessengerPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [cqNumber, setCqNumber] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('off');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string | null>(null);

  // ── Load initial data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [threadsResult, profileResult] = await Promise.allSettled([
        apiGet<{ threads?: Thread[] }>('/api/cq/threads'),
        apiGet<{ cq_number?: string; user_id?: string }>('/api/cq/profile'),
      ]);

      if (threadsResult.status === 'fulfilled') {
        setThreads(threadsResult.value.threads || []);
      }
      if (profileResult.status === 'fulfilled') {
        setCqNumber(profileResult.value.cq_number || null);
        userIdRef.current = profileResult.value.user_id || null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messenger');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    const sb = getRealtimeClient();
    if (!sb) {
      setRealtimeStatus('off');
      return;
    }

    setRealtimeStatus('connecting');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sbClient = sb as any;

    // Subscribe to cq_messages inserts — any new message triggers a thread refresh
    const channel = sbClient.channel('cq_messenger_live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cq_messages',
        },
        async (_payload: unknown) => {
          // Re-fetch threads to get updated preview + unread count
          // (cheaper than maintaining local state for each thread's last message)
          try {
            const data = await apiGet<{ threads?: Thread[] }>('/api/cq/threads');
            setThreads(data.threads || []);
          } catch { /* silent */ }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cq_threads',
        },
        async () => {
          try {
            const data = await apiGet<{ threads?: Thread[] }>('/api/cq/threads');
            setThreads(data.threads || []);
          } catch { /* silent */ }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
        else if (status === 'CLOSED') setRealtimeStatus('off');
      });

    channelRef.current = channel;

    return () => {
      sbClient.removeChannel(channel).catch(() => null);
      setRealtimeStatus('off');
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = query
    ? threads.filter(t =>
        (t.display_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (t.cq_number || '').toLowerCase().includes(query.toLowerCase()) ||
        (t.last_message_preview || '').toLowerCase().includes(query.toLowerCase())
      )
    : threads;

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Private 1:1 — CQ to CQ</p>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-50">
            <Mail className="h-5 w-5 text-cyan-300" />
            CQ Messenger
            {totalUnread > 0 && (
              <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                {totalUnread}
              </span>
            )}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Encrypted direct messages between CQ users. CubiQo can summarise threads and draft replies — you always approve before anything is sent.
          </p>
        </div>

        <div className="text-right">
          {/* Realtime status indicator */}
          <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
            realtimeStatus === 'live' ? 'bg-emerald-400/10 text-emerald-300'
            : realtimeStatus === 'connecting' ? 'bg-amber-400/10 text-amber-300'
            : realtimeStatus === 'error' ? 'bg-rose-400/10 text-rose-300'
            : 'bg-slate-800 text-slate-500'
          }`}>
            {realtimeStatus === 'live' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {realtimeStatus === 'live' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting…' : realtimeStatus === 'error' ? 'Reconnecting' : 'Offline'}
          </div>

          <div className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Your CQ Number</div>
          <div className="mt-1 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-sm text-cyan-200">
            {cqNumber || 'CQ-—————'}
          </div>
          <div className="mt-1 text-[0.65rem] text-slate-500">Share to receive DMs</div>
        </div>
      </div>

      {/* Search + New */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search threads…"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">
          <Plus className="h-4 w-4" /> New thread
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* Thread list */}
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-slate-800 bg-neutral-950" />
            ))
          : filtered.map(t => (
              <a
                key={t.id}
                href={`/messenger/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-neutral-950 p-3 transition hover:border-cyan-400/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-100">
                      {t.display_name || t.cq_number || 'Untitled'}
                    </span>
                    {(t.unread_count ?? 0) > 0 && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.6rem] font-bold text-cyan-200">
                        {t.unread_count} new
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {t.last_message_preview || '…'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono text-[0.65rem] text-slate-500">{t.cq_number || ''}</span>
                  {t.updated_at && (
                    <p className="text-[0.6rem] text-slate-600">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </a>
            ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-cyan-300" />
            <p className="text-sm text-slate-400">
              {query
                ? 'No threads match your search.'
                : 'No direct conversations yet. Share your CQ Number to start a private thread.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
