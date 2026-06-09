'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Sparkles, ArrowUpRight, Users, Radio } from 'lucide-react';
import { apiGet } from './client-api';
import { Capsule, signalIntent } from './Capsule';

type CapsuleProject = {
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
  confirmed_intents?: string[] | null;
  suggested_intents?: string[] | null;
  created_at?: string;
};

type Chatroom = {
  id: string;
  name?: string | null;
  color?: string | null;
  unread_count?: number | null;
  last_message_preview?: string | null;
};

const colorClasses: Record<string, { dot: string; border: string; bg: string }> = {
  green: { dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]', border: 'border-emerald-400/30', bg: 'bg-emerald-400/5' },
  red: { dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,114,114,0.6)]', border: 'border-rose-400/30', bg: 'bg-rose-400/5' },
  yellow: { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]', border: 'border-amber-400/30', bg: 'bg-amber-400/5' },
};
function toneFor(color?: string | null) {
  return colorClasses[String(color || 'yellow').toLowerCase()] || colorClasses.yellow;
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">{label}</span>
      {action}
    </div>
  );
}

export function RightPanel() {
  const pathname = usePathname();
  // Social surfaces lead with chatrooms; work surfaces lead with the dashboard.
  const social = pathname.startsWith('/chatrooms') || pathname.startsWith('/messenger');

  const [projects, setProjects] = useState<CapsuleProject[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      apiGet<{ projects?: CapsuleProject[] }>('/api/duo/projects'),
      apiGet<{ signals?: Signal[] }>('/api/signals'),
      apiGet<{ rooms?: Chatroom[] }>('/api/chatrooms'),
    ]).then(results => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setProjects((results[0].value.projects || []).slice(0, 6));
      if (results[1].status === 'fulfilled') setSignals((results[1].value.signals || []).slice(0, 8));
      if (results[2].status === 'fulfilled') setChatrooms((results[2].value.rooms || []).slice(0, 5));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [pathname]);

  const activeCapsule = projects.find(c => c.status === 'working' || c.status === 'running') || null;

  // ── Section: LIVE SIGNALS — the RGY capsules (color · keyword · intent) ──────
  const signalsSection = (
    <section key="signals" className="mb-6">
      <SectionHeader
        label="LIVE SIGNALS"
        action={<span className="inline-flex items-center gap-1 text-[0.6rem] text-slate-500"><Radio className="h-3 w-3" /> RGY</span>}
      />
      <div className="space-y-1.5">
        {signals.length === 0 && loaded && (
          <div className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">
            No signals yet — chat and CubiQo will read your green / yellow / red intent.
          </div>
        )}
        {signals.map(s => (
          <Capsule key={s.id} color={s.color} keyword={s.keyword} intent={signalIntent(s)} />
        ))}
      </div>
    </section>
  );

  // ── Section: DASHBOARD — your capsules (Duo projects) + active/proactive ─────
  const dashboardSection = (
    <section key="dashboard" className="mb-6">
      <SectionHeader
        label="DASHBOARD"
        action={
          <Link href="/duo" className="inline-flex items-center gap-1 rounded-md border border-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900">
            <Plus className="h-3 w-3" /> New
          </Link>
        }
      />
      {activeCapsule && (
        <Link
          href={`/duo/${activeCapsule.id}`}
          className={`mb-2 block rounded-lg border ${toneFor(activeCapsule.color).border} ${toneFor(activeCapsule.color).bg} p-3 transition hover:border-cyan-400/50`}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-100">{activeCapsule.title || activeCapsule.goal || 'Project'}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-400" />
          </div>
          <div className="flex items-center gap-1 text-[0.65rem] text-cyan-300"><Sparkles className="h-3 w-3" /> Working now · open dashboard</div>
        </Link>
      )}
      <div className="space-y-2">
        {projects.length === 0 && loaded && (
          <div className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">
            No capsules yet. Launch one from chat or the Duo grid.
          </div>
        )}
        {projects.filter(c => c.id !== activeCapsule?.id).map(c => {
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
  );

  // ── Section: CHATROOMS ──────────────────────────────────────────────────────
  const chatroomsSection = (
    <section key="chatrooms" className="mb-6">
      <SectionHeader
        label="CHATROOMS"
        action={<Link href="/chatrooms" className="text-[0.65rem] text-slate-400 hover:text-slate-200">View all →</Link>}
      />
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
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.6rem] text-cyan-200">{room.unread_count} new</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );

  // Context-aware order: chatrooms-first on social surfaces, dashboard-first on work.
  const order = social
    ? [chatroomsSection, signalsSection, dashboardSection]
    : [signalsSection, dashboardSection, chatroomsSection];

  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-neutral-950/95 p-4 lg:block">
      {order}
    </aside>
  );
}
