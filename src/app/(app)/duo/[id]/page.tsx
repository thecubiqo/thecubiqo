'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { FidelityReport as FidelityReportPanel } from '@/next/components/duo/FidelityReport';
import { TaskGraph } from '@/next/components/duo/TaskGraph';
import type { DuoTaskEdgeView, DuoTaskView } from '@/next/components/duo/TaskGraph';
import { useDuoStream } from '@/next/hooks/useDuoStream';
import type { FidelityReport as FidelityReportData } from '@/next/types/duo-fidelity';
import { apiGet, apiSend, formatDate, statusTone } from '../../_components/client-api';

type ProjectPayload = {
  project: Record<string, any>;
  tasks: Array<Record<string, any>>;
  edges: Array<Record<string, any>>;
  timeline: Array<Record<string, any>>;
  outcomes: Array<Record<string, any>>;
};

export default function DuoProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [payload, setPayload] = useState<ProjectPayload | null>(null);
  const [fidelity, setFidelity] = useState<FidelityReportData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const stream = useDuoStream(id);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [project, fidelityResult] = await Promise.allSettled([
        apiGet<ProjectPayload>(`/api/duo/projects/${id}`),
        apiGet<FidelityReportData>(`/api/duo/projects/${id}/fidelity`)
      ]);
      if (project.status === 'fulfilled') setPayload(project.value);
      else throw project.reason;
      if (fidelityResult.status === 'fulfilled') setFidelity(fidelityResult.value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function runFidelity() {
    await apiSend(`/api/duo/projects/${id}/fidelity`, 'POST', {});
    setTimeout(load, 800);
  }

  async function executeTask(taskId: string) {
    await apiSend(`/api/duo/tasks/${taskId}/execute`, 'POST', {});
    await load();
  }

  const project = payload?.project;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Duo Project</p>
          <h2 className="truncate text-2xl font-semibold text-slate-50">{project?.title || project?.goal || 'Project'}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={runFidelity} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
            <CheckCircle2 className="h-4 w-4" />
            Fidelity
          </button>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
      {loading && <div className="text-sm text-slate-400">Loading...</div>}

      {project && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-lg border px-2 py-1 ${statusTone(project.status)}`}>{project.status || 'draft'}</span>
                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">{project.domain || 'general'}</span>
                <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">{formatDate(project.updated_at || project.created_at)}</span>
                <span className={`rounded-lg border px-2 py-1 ${stream.connected ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                  stream {stream.connected ? 'live' : 'idle'}
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-300">{project.goal || 'No goal recorded.'}</p>
            </div>

            <TaskGraph
              tasks={(payload?.tasks || []).filter(task => task.id) as DuoTaskView[]}
              edges={(payload?.edges || []) as DuoTaskEdgeView[]}
              onExecute={executeTask}
            />
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
              <div className="mb-2 text-sm font-semibold text-slate-100">Fidelity</div>
              {fidelity ? (
                <FidelityReportPanel report={fidelity} />
              ) : (
                <div className="text-sm text-slate-400">No fidelity run yet.</div>
              )}
            </div>

            {stream.messages.length > 0 && (
              <div className="rounded-lg border border-slate-800 bg-neutral-950">
                <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">Live Events</div>
                <div className="divide-y divide-slate-800">
                  {stream.messages.slice(-5).map((event, index) => (
                    <div key={`${event.id || event.type}-${index}`} className="px-4 py-3 text-sm">
                      <div className="text-slate-100">{event.type}</div>
                      <div className="mt-1 truncate text-xs text-slate-500">{JSON.stringify(event).slice(0, 160)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-neutral-950">
              <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">Timeline</div>
              <div className="divide-y divide-slate-800">
                {(payload?.timeline || []).slice(0, 8).map(event => (
                  <div key={event.id} className="px-4 py-3 text-sm">
                    <div className="text-slate-100">{event.summary || event.message || event.event_type || 'Event'}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(event.created_at)}</div>
                  </div>
                ))}
                {payload?.timeline?.length === 0 && <div className="px-4 py-4 text-sm text-slate-400">No timeline events.</div>}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
