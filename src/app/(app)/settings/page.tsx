'use client';

import { useEffect, useState } from 'react';
import { Bell, CreditCard, Database, PlugZap, RefreshCw, Save, ShieldCheck, Unplug } from 'lucide-react';
import { apiGet, apiSend, statusTone } from '../_components/client-api';

export default function SettingsPage() {
  const [billing, setBilling] = useState<Record<string, any> | null>(null);
  const [connectors, setConnectors] = useState<Record<string, any> | null>(null);
  const [byod, setByod] = useState<Record<string, any> | null>(null);
  const [byodForm, setByodForm] = useState({ supabaseUrl: '', serviceRoleKey: '' });
  const [prefs, setPrefs] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setError('');
    setNotice('');
    try {
      const [billingData, connectorData, byodData, prefData] = await Promise.allSettled([
        apiGet<Record<string, any>>('/api/billing/status'),
        apiGet<Record<string, any>>('/api/duo/connectors'),
        apiGet<Record<string, any>>('/api/byod/health'),
        apiGet<Record<string, any>>('/api/notifications/preferences')
      ]);
      if (billingData.status === 'fulfilled') setBilling(billingData.value);
      if (connectorData.status === 'fulfilled') setConnectors(connectorData.value);
      if (byodData.status === 'fulfilled') setByod(byodData.value);
      if (prefData.status === 'fulfilled') setPrefs(prefData.value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePrefs() {
    try {
      const updated = await apiSend<Record<string, any>>('/api/notifications/preferences', 'PATCH', prefs);
      setPrefs(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    }
  }

  async function connectByod() {
    setError('');
    setNotice('');
    try {
      const result = await apiSend<Record<string, any>>('/api/byod/connect', 'POST', byodForm);
      setByod({ connected: false, status: result.status || 'pending_verification' });
      setByodForm({ supabaseUrl: byodForm.supabaseUrl, serviceRoleKey: '' });
      setNotice('BYOD workspace saved. Run verification to activate it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect BYOD workspace');
    }
  }

  async function verifyByod() {
    setError('');
    setNotice('');
    try {
      const result = await apiSend<Record<string, any>>('/api/byod/verify', 'POST');
      setByod(result);
      setNotice(result.ok ? 'BYOD workspace verified.' : 'BYOD verification finished with warnings.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify BYOD workspace');
    }
  }

  async function disconnectByod() {
    setError('');
    setNotice('');
    try {
      await apiSend<Record<string, any>>('/api/byod/disconnect', 'POST');
      setByod({ connected: false, status: 'disconnected' });
      setByodForm({ supabaseUrl: '', serviceRoleKey: '' });
      setNotice('BYOD workspace disconnected.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect BYOD workspace');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Controls</p>
          <h2 className="text-2xl font-semibold text-slate-50">Settings</h2>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{notice}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <CreditCard className="h-4 w-4 text-cyan-200" />
            Billing
          </div>
          <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${statusTone(billing?.isPro ? 'active' : billing?.status)}`}>
            {billing?.isPro ? 'Pro' : billing?.status || 'free'}
          </span>
        </section>

        <section className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <PlugZap className="h-4 w-4 text-cyan-200" />
            Connectors
          </div>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-xs text-slate-400">
            {JSON.stringify(connectors || {}, null, 2)}
          </pre>
        </section>

        <section className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Database className="h-4 w-4 text-cyan-200" />
            BYOD Supabase
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${statusTone(byod?.connected ? 'active' : byod?.status)}`}>
              {byod?.connected ? 'connected' : byod?.status || 'not connected'}
            </span>
            {byod?.health && (
              <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${statusTone(byod.health.reachable ? 'active' : 'failed')}`}>
                {byod.health.reachable ? 'reachable' : 'unreachable'} · {byod.health.latencyMs}ms
              </span>
            )}
            {byod?.migrationPending && (
              <span className="inline-flex rounded-lg border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs text-amber-100">migration pending</span>
            )}
          </div>
          {byod?.supabaseUrl && <p className="mb-3 truncate text-xs text-slate-400">{byod.supabaseUrl}</p>}
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-slate-300">
              Supabase URL
              <input value={byodForm.supabaseUrl} onChange={event => setByodForm({ ...byodForm, supabaseUrl: event.target.value })} placeholder="https://project.supabase.co" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Service role key
              <input type="password" value={byodForm.serviceRoleKey} onChange={event => setByodForm({ ...byodForm, serviceRoleKey: event.target.value })} placeholder="Stored encrypted, never displayed" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={connectByod} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950">
                <ShieldCheck className="h-4 w-4" />
                Connect
              </button>
              <button onClick={verifyByod} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900">
                <RefreshCw className="h-4 w-4" />
                Verify
              </button>
              <button onClick={disconnectByod} className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/10">
                <Unplug className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Bell className="h-4 w-4 text-cyan-200" />
            Notifications
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm text-slate-300">
              DND start
              <input value={prefs.dndStart || ''} onChange={event => setPrefs({ ...prefs, dndStart: event.target.value || null })} placeholder="22:00" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              DND end
              <input value={prefs.dndEnd || ''} onChange={event => setPrefs({ ...prefs, dndEnd: event.target.value || null })} placeholder="08:00" className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300">
              Urgent calls
              <input type="checkbox" checked={Boolean(prefs.urgentCall)} onChange={event => setPrefs({ ...prefs, urgentCall: event.target.checked })} />
            </label>
            <button onClick={savePrefs} className="inline-flex w-fit items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950">
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
