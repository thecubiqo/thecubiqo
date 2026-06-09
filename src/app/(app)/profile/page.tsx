'use client';

import { useEffect, useState } from 'react';
import { Brain, Database, RefreshCw, Save } from 'lucide-react';
import { apiGet, apiSend, formatDate, statusTone } from '../_components/client-api';

type ProfilePayload = {
  profile: Record<string, any> | null;
  aiProfile: Record<string, any> | null;
};

type MemoryPayload = {
  memories: Array<Record<string, any>>;
  total: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [memory, setMemory] = useState<MemoryPayload | null>(null);
  const [rgy, setRgy] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ displayName: '', primaryGoal: '', timezone: 'UTC', languagePreference: 'en' });
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [profileData, memoryData, rgyData] = await Promise.all([
        apiGet<ProfilePayload>('/api/profile'),
        apiGet<MemoryPayload>('/api/memory?per_page=10'),
        apiGet<Record<string, any>>('/api/rgy/status')
      ]);
      setProfile(profileData);
      setMemory(memoryData);
      setRgy(rgyData);
      setForm({
        displayName: profileData.profile?.display_name || '',
        primaryGoal: profileData.profile?.primary_goal || '',
        timezone: profileData.profile?.timezone || 'UTC',
        languagePreference: profileData.profile?.language_preference || 'en'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      await apiSend('/api/profile', 'PATCH', form);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    }
  }

  const ai = profile?.aiProfile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">User Model</p>
          <h2 className="text-2xl font-semibold text-slate-50">Profile</h2>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Brain className="h-4 w-4 text-cyan-200" />
            Context
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-slate-300">
              Display name
              <input value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Primary goal
              <textarea value={form.primaryGoal} onChange={event => setForm({ ...form, primaryGoal: event.target.value })} className="min-h-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm text-slate-300">
                Timezone
                <input value={form.timezone} onChange={event => setForm({ ...form, timezone: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                Language
                <input value={form.languagePreference} onChange={event => setForm({ ...form, languagePreference: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
              </label>
            </div>
            <button onClick={save} className="inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-lg border px-2 py-1 ${statusTone(rgy?.status)}`}>RGY {rgy?.status || 'unknown'} {rgy?.score ?? ''}</span>
              <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">Visits {profile?.profile?.visit_count ?? 0}</span>
              <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">Seen {formatDate(profile?.profile?.last_seen_at)}</span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Occupation</dt><dd className="text-slate-100">{ai?.occupation || 'Not set'}</dd></div>
              <div><dt className="text-slate-500">Drive</dt><dd className="text-slate-100">{ai?.primary_drive || 'Not set'}</dd></div>
              <div><dt className="text-slate-500">Phase</dt><dd className="text-slate-100">{ai?.current_phase || 'Not set'}</dd></div>
              <div><dt className="text-slate-500">Blocker</dt><dd className="text-slate-100">{ai?.what_blocks || 'Not set'}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-800 bg-neutral-950">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
              <Database className="h-4 w-4 text-cyan-200" />
              Memory
            </div>
            <div className="divide-y divide-slate-800">
              {(memory?.memories || []).map(item => (
                <div key={item.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg border border-slate-800 px-2 py-0.5 text-xs text-slate-300">{item.event_type}</span>
                    <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-2 text-slate-200">{item.summary}</p>
                </div>
              ))}
              {!memory?.memories?.length && <div className="px-4 py-4 text-sm text-slate-400">No memory rows.</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
