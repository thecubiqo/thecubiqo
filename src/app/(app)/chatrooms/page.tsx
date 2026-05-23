'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake, RefreshCw, Users } from 'lucide-react';
import { apiGet } from '../_components/client-api';

type Chatroom = {
  id: string;
  name?: string | null;
  color?: string | null;
  tier?: string | null;
  description?: string | null;
  member_count?: number | null;
  unread_count?: number | null;
};

const TIER_COPY = {
  green: {
    title: '🟢 GREEN — Professional & Active',
    blurb: 'Skill exchange · active goals · projects · portfolio · builder rooms · hire & work'
  },
  yellow: {
    title: '🟡 YELLOW — Casual & Social',
    blurb: 'Interest groups · local events · hobbies · low-commitment connection'
  },
  red: {
    title: '🔴 RED — Dating, Intimacy & Adult',
    blurb: 'Age-gated · consent-first · explicit opt-in required'
  }
} as const;

export default function ChatroomsPage() {
  const [rooms, setRooms] = useState<Chatroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{ rooms?: Chatroom[] }>('/api/chatrooms');
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch (err) {
      // /api/chatrooms list endpoint may not be implemented yet — keep the page useful
      const msg = err instanceof Error ? err.message : 'Could not load chatrooms';
      if (!/404|not found/i.test(msg)) setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byTier = (tier: 'green' | 'yellow' | 'red') =>
    rooms.filter(r => String(r.color || r.tier || '').toLowerCase() === tier);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">RGY social layer</p>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-50">
            <HeartHandshake className="h-5 w-5 text-cyan-300" /> Chatrooms
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Rooms organised by the same RGY system that powers CubiQo. CubiQo matches you to rooms based on your active
            capsule keyword and RGY state.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>
      )}

      {(['green', 'yellow', 'red'] as const).map(tier => {
        const tierRooms = byTier(tier);
        const t = TIER_COPY[tier];
        const tone =
          tier === 'green'
            ? 'border-emerald-400/30 bg-emerald-400/5'
            : tier === 'red'
              ? 'border-rose-400/30 bg-rose-400/5'
              : 'border-amber-400/30 bg-amber-400/5';
        return (
          <section key={tier} className="mb-6">
            <div className={`mb-3 rounded-lg border ${tone} p-3`}>
              <div className="text-sm font-semibold text-slate-100">{t.title}</div>
              <div className="text-xs text-slate-400">{t.blurb}</div>
            </div>
            {tierRooms.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                {loading ? 'Loading rooms…' : 'No rooms in this tier yet.'}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {tierRooms.map(room => (
                  <a
                    key={room.id}
                    href={`/chatrooms/${room.id}`}
                    className="rounded-lg border border-slate-800 bg-neutral-950 p-3 transition hover:border-cyan-400/50"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">{room.name || 'Room'}</span>
                      {room.unread_count ? (
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.6rem] text-cyan-200">
                          {room.unread_count} new
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-400">{room.description || ''}</p>
                    <div className="mt-2 flex items-center gap-1 text-[0.65rem] text-slate-500">
                      <Users className="h-3 w-3" /> {room.member_count ?? 0} members
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
