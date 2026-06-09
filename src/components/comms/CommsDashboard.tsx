'use client';

/**
 * CommsDashboard — proactive outbound comms settings.
 *
 * Lets the user configure:
 *  • Wake-up time + timezone
 *  • Delivery channel (SMS / email / both)
 *  • What to include in the briefing
 *  • Enable / disable
 *
 * This is CubiQo texting and emailing YOU — wake-up calls, task nudges,
 * goal reminders, whatever you set here.
 */

import { useEffect, useState } from 'react';
import { Bell, BellOff, Mail, MessageSquare, Save, Sunrise } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';

const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Colombo', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
  'Pacific/Auckland',
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? '12 AM (midnight)' : i < 12 ? `${i} AM` : i === 12 ? '12 PM (noon)' : `${i - 12} PM`;
  return { value: i, label };
});

type BriefingConfig = {
  tasks: boolean;
  calendar: boolean;
  goals: boolean;
  blockers: boolean;
  weather: boolean;
  custom_note: string;
};

type Settings = {
  active: boolean;
  wake_hour: number;
  timezone: string;
  channel: 'sms' | 'email' | 'both';
  briefing_config: BriefingConfig;
  last_briefing_date: string | null;
};

async function apiCall(method: 'GET' | 'PATCH', body?: object) {
  const headers = await authHeaders();
  const res = await fetch('/api/comms/settings', {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as Settings;
}

export function CommsDashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiCall('GET')
      .then(setSettings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await apiCall('PATCH', {
        active: settings.active,
        wake_hour: settings.wake_hour,
        timezone: settings.timezone,
        channel: settings.channel,
        briefing_config: settings.briefing_config,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function patch(partial: Partial<Settings>) {
    setSettings(prev => prev ? { ...prev, ...partial } : prev);
  }

  function patchBriefing(partial: Partial<BriefingConfig>) {
    setSettings(prev => prev
      ? { ...prev, briefing_config: { ...prev.briefing_config, ...partial } }
      : prev);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="h-3 w-3 animate-spin rounded-full border border-slate-700 border-t-slate-300" />
        Loading…
      </div>
    );
  }

  if (!settings) return null;

  const cfg = settings.briefing_config;

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-neutral-950 p-4">
        <div className="flex items-center gap-3">
          {settings.active
            ? <Bell className="h-5 w-5 text-cyan-300" />
            : <BellOff className="h-5 w-5 text-slate-500" />}
          <div>
            <p className="text-sm font-semibold text-slate-100">Morning briefings</p>
            <p className="text-xs text-slate-500">
              CubiQo{settings.active ? ' will message you' : ' is currently silent'}
              {settings.last_briefing_date && ` · Last sent ${settings.last_briefing_date}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => patch({ active: !settings.active })}
          className={`relative h-6 w-11 rounded-full transition-colors ${settings.active ? 'bg-cyan-400' : 'bg-slate-700'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.active ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {settings.active && (
        <>
          {/* Wake time + timezone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><Sunrise className="h-3.5 w-3.5 text-amber-300" /> Wake-up hour</span>
              <select
                value={settings.wake_hour}
                onChange={e => patch({ wake_hour: parseInt(e.target.value, 10) })}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              >
                {HOURS.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Your timezone</span>
              <select
                value={settings.timezone}
                onChange={e => patch({ timezone: e.target.value })}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
                {/* If user's timezone isn't in our list, show it */}
                {!TIMEZONES.includes(settings.timezone) && (
                  <option value={settings.timezone}>{settings.timezone}</option>
                )}
              </select>
            </label>
          </div>

          {/* Channel */}
          <div className="grid gap-2">
            <p className="text-sm text-slate-300">Send via</p>
            <div className="flex flex-wrap gap-2">
              {(['email', 'sms', 'both'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => patch({ channel: ch })}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    settings.channel === ch
                      ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
                      : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {ch === 'email' && <Mail className="h-4 w-4" />}
                  {ch === 'sms' && <MessageSquare className="h-4 w-4" />}
                  {ch === 'both' && <><Mail className="h-4 w-4" /><MessageSquare className="h-4 w-4" /></>}
                  {ch === 'both' ? 'Both' : ch.toUpperCase()}
                </button>
              ))}
            </div>
            {(settings.channel === 'sms' || settings.channel === 'both') && (
              <p className="text-xs text-slate-500">SMS requires a verified phone number in Contact & Verification above.</p>
            )}
          </div>

          {/* What to include */}
          <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-100">Include in briefing</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { key: 'tasks', label: "Today's tasks" },
                  { key: 'calendar', label: 'Calendar events' },
                  { key: 'goals', label: 'Active goals' },
                  { key: 'blockers', label: 'Blockers & commitments' },
                  { key: 'weather', label: 'Weather (coming soon)', disabled: true },
                ] as const
              ).map(item => (
                <label
                  key={item.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    cfg[item.key]
                      ? 'border-cyan-400/30 bg-cyan-400/5 text-slate-100'
                      : 'border-slate-800 text-slate-500'
                  } ${'disabled' in item && item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(cfg[item.key])}
                    disabled={'disabled' in item && item.disabled}
                    onChange={e => patchBriefing({ [item.key]: e.target.checked } as Partial<BriefingConfig>)}
                    className="accent-cyan-400"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            {/* Custom note */}
            <label className="mt-3 grid gap-1.5 text-sm text-slate-300">
              <span>Custom note (always included)</span>
              <textarea
                value={cfg.custom_note}
                onChange={e => patchBriefing({ custom_note: e.target.value })}
                placeholder="E.g. 'Focus on deep work before 10am' or 'No meetings until coffee'"
                rows={2}
                maxLength={500}
                className="resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
              <span className="text-right text-xs text-slate-600">{cfg.custom_note.length}/500</span>
            </label>
          </div>
        </>
      )}

      {/* Errors / feedback */}
      {error && (
        <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          ✓ Saved — CubiQo will message you at {HOURS.find(h => h.value === settings.wake_hour)?.label} ({settings.timezone})
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  );
}
