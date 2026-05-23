'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Sparkles, ArrowUpRight, Users } from 'lucide-react';
import { apiGet } from './client-api';

type Capsule = {
  id: string;
  title?: string | null;
  goal?: string | null;
  status?: string | null;
  color?: string | null;
  domain?: string | null;
};

type Signal = {
  id: string;
  color?: string | null;
  keyword?: string | null;
  created_at?: string;
};

type Chatroom = {
  id: string;
  name?: string | null;
  color?: string | null;
  unread_count?: number | null;
  last_message_preview?: string | null;
};

const colorClasses: Record<string, { dot: string; border: string; bg: string; text: string; label: string }> = {
  green: {
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/5',
    text: 'text-emerald-200',
    label: 'GREEN'
  },
  red: {
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,114,114,0.6)]',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/5',
    text: 'text-rose-200',
    label: 'RED'
  },
  yellow: {
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    text: 'text-amber-200',
    label: 'YELLOW'
  }
};

function toneFor(color?: string | null) {
  return colorClasses[String(color || 'yellow').toLowerCase()] || colorClasses.yellow;
}

export function RightPanel() {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      apiGet<{ projects?: Capsule[] }>('/api/duo/projects'),
      apiGet<{ signals?: Signal[] }>('/api/signals'),
      apiGet<{ rooms?: Chatroom[] }>('/api/chatrooms')
    ]).then(results => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setCapsules((results[0].value.projects || []).slice(0, 5));
      if (results[1].status === 'fulfilled') setSignals((results[1].value.signals || []).slice(0, 20));
      if (results[2].status === 'fulfilled') setChatrooms((results[2].value.rooms || []).slice(0, 4));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = signals.reduce(
    (acc, s) => {
      const k = String(s.color || 'yellow').toLowerCase();
      if (k === 'green' || k === 'red' || k === 'yellow') acc[k as 'green' | 'red' | 'yellow'] += 1;
      return acc;
    },
    { green: 0, red: 0, yellow: 0 }
  );
  const totalCount = totals.green + totals.red + totals.yellow || 1;
  const pct = {
    green: Math.round((totals.green / totalCount) * 100),
    red: Math.round((totals.red / totalCount) * 100),
    yellow: Math.round((totals.yellow / totalCount) * 100)
  };

  const activeCapsule = capsules.find(c => c.status === 'working' || c.status === 'running') || null;

  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-neutral-950/95 p-4 lg:block">
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">MY CAPSULES</span>
          <Link
            href="/duo"
            className="inline-flex items-center gap-1 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900"
          >
            <Plus className="h-3 w-3" /> New
          </Link>
        </div>
        <div className="space-y-2">
          {capsules.length === 0 && loaded && (
            <div className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">
              No capsules yet. Launch one from chat or the Duo grid.
            </div>
          )}
          {capsules.map(c => {
            const tone = toneFor(c.color);
            return (
              <Link
                key={c.id}
                href={`/duo/${c.id}`}
                className={`flex items-center justify-between gap-2 rounded-lg border ${tone.border} ${tone.bg} px-3 py-2 transition hover:border-cyan-400/50`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                  <span className="truncate text-sm text-slate-100">{c.title || c.goal || 'Untitled'}</span>
                </div>
                <span className="text-[0.6rem] uppercase tracking-wider text-slate-500">{c.status || 'idle'}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <hr className="my-4 border-slate-800" />

      <section className="mb-6">
        <div className="mb-3 text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">RGY TODAY</div>
        <div className="space-y-2">
          {(['green', 'yellow', 'red'] as const).map(color => {
            const tone = toneFor(color);
            return (
              <div key={color} className="flex items-center gap-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className={`h-full ${color === 'green' ? 'bg-emerald-400' : color === 'red' ? 'bg-rose-400' : 'bg-amber-400'}`}
                      style={{ width: `${pct[color]}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">{pct[color]}%</span>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="my-4 border-slate-800" />

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">CHATROOMS</span>
          <Link href="/chatrooms" className="text-[0.65rem] text-slate-400 hover:text-slate-200">
            View all →
          </Link>
        </div>
        <div className="space-y-1">
          {chatrooms.length === 0 && loaded && (
            <div className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">
              <Users className="mb-1 inline h-3 w-3" /> Join a room from the Chatrooms page.
            </div>
          )}
          {chatrooms.map(room => {
            const tone = toneFor(room.color);
            return (
              <Link
                key={room.id}
                href={`/chatrooms/${room.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-900"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                  <span className="truncate text-slate-200">{room.name || 'Room'}</span>
                </div>
                {room.unread_count ? (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.6rem] text-cyan-200">
                    {room.unread_count} new
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {activeCapsule && (
        <>
          <hr className="my-4 border-slate-800" />
          <section>
            <div className="mb-3 text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">ACTIVE CAPSULE</div>
            <Link
              href={`/duo/${activeCapsule.id}`}
              className={`block rounded-lg border ${toneFor(activeCapsule.color).border} ${toneFor(activeCapsule.color).bg} p-3 transition hover:border-cyan-400/50`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  {activeCapsule.title || activeCapsule.goal || 'Project'}
                </span>
                <ArrowUpRight className="h-3 w-3 text-slate-400" />
              </div>
              <p className="line-clamp-2 text-xs text-slate-400">
                {activeCapsule.goal || activeCapsule.domain || 'Running…'}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[0.65rem] text-cyan-300">
                <Sparkles className="h-3 w-3" /> Open dashboard
              </div>
            </Link>
          </section>
        </>
      )}
    </aside>
  );
}
