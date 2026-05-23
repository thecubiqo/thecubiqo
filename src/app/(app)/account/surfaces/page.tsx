'use client';

import { useEffect, useState } from 'react';
import { Chrome, Cpu, Monitor, RefreshCw, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { apiGet, formatDate } from '../../_components/client-api';

type SurfaceSession = {
  id: string;
  surface_type?: string | null;
  device_id?: string | null;
  capabilities?: Record<string, boolean> | null;
  ollama_models?: Array<{ name?: string; size?: string }> | null;
  last_heartbeat?: string | null;
  is_online?: boolean;
  app_version?: string | null;
  os_platform?: string | null;
};

function surfaceIcon(type?: string | null) {
  const t = (type || '').toLowerCase();
  if (t.includes('mobile') || t.includes('ios') || t.includes('android')) return Smartphone;
  if (t.includes('extension') || t.includes('chrome')) return Chrome;
  return Monitor;
}

function surfaceLabel(s: SurfaceSession) {
  const t = (s.surface_type || '').toLowerCase();
  if (t.includes('mobile')) return 'Mobile';
  if (t.includes('extension')) return 'Chrome Extension';
  if (t.includes('desktop')) return 'Desktop';
  return s.surface_type || 'Surface';
}

export default function SurfacesPage() {
  const [sessions, setSessions] = useState<SurfaceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{ sessions: SurfaceSession[] }>('/api/surfaces/active');
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load surfaces');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">Devices where CubiQo runs</p>
          <h2 className="text-2xl font-semibold text-slate-50">My Surfaces</h2>
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

      <div className="space-y-3">
        {sessions.map(s => {
          const Icon = surfaceIcon(s.surface_type);
          const online = s.is_online !== false;
          const caps = s.capabilities || {};
          const models = Array.isArray(s.ollama_models) ? s.ollama_models : [];
          return (
            <div key={s.id} className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{surfaceLabel(s)}</div>
                    <div className="text-[0.7rem] text-slate-500">
                      {s.os_platform || 'unknown OS'} · v{s.app_version || '?'}
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.65rem] ${
                    online
                      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {online ? 'Online' : 'Offline'} · {formatDate(s.last_heartbeat)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[0.7rem]">
                {Object.entries(caps).map(([k, v]) => (
                  <span
                    key={k}
                    className={`rounded-md border px-2 py-0.5 ${
                      v
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-500'
                    }`}
                  >
                    {v ? '✓' : '✗'} {k}
                  </span>
                ))}
              </div>

              {models.length > 0 && (
                <div className="mt-3 border-t border-slate-800 pt-3">
                  <div className="mb-2 flex items-center gap-1 text-[0.65rem] uppercase tracking-wider text-slate-500">
                    <Cpu className="h-3 w-3" /> Local AI models (Ollama)
                  </div>
                  <div className="space-y-1 text-xs">
                    {models.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-slate-300">{m.name}</span>
                        <span className="text-slate-500">{m.size || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && sessions.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
            No active surfaces. Install the desktop, mobile, or browser extension to extend CubiQo to your devices.
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                Download Desktop
              </button>
              <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                Download Mobile
              </button>
              <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                Install Extension
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
