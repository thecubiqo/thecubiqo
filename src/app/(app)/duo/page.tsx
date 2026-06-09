'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Plus, RefreshCw, Sparkles, Waypoints, X } from 'lucide-react';
import { apiGet, apiSend, formatDate, statusTone } from '../_components/client-api';

type DuoProject = {
  id: string;
  title?: string | null;
  goal?: string | null;
  domain?: string | null;
  status?: string | null;
  color?: string | null;
  risk_level?: string | null;
  api_cost_gbp?: number | null;
  budget_gate_gbp?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

const COLORS: { key: 'green' | 'yellow' | 'red'; label: string; line: string; tone: string; dot: string }[] = [
  {
    key: 'green',
    label: "GREEN — I'm building toward something",
    line: 'Active goal work',
    tone: 'border-emerald-400/30 bg-emerald-400/5 text-emerald-100',
    dot: 'bg-emerald-400'
  },
  {
    key: 'yellow',
    label: "YELLOW — I'm exploring / not sure yet",
    line: 'Discovery, ambient',
    tone: 'border-amber-400/30 bg-amber-400/5 text-amber-100',
    dot: 'bg-amber-400'
  },
  {
    key: 'red',
    label: "RED — This is urgent or I'm stuck",
    line: 'Critical, time-sensitive',
    tone: 'border-rose-400/30 bg-rose-400/5 text-rose-100',
    dot: 'bg-rose-400'
  }
];

function capsuleColorClasses(color?: string | null) {
  const c = (color || 'yellow').toLowerCase();
  if (c === 'green') return { border: 'border-emerald-400/30', dot: 'bg-emerald-400', label: 'GREEN' };
  if (c === 'red') return { border: 'border-rose-400/30', dot: 'bg-rose-400', label: 'RED' };
  return { border: 'border-amber-400/30', dot: 'bg-amber-400', label: 'YELLOW' };
}

export default function DuoDashboardPage() {
  const [projects, setProjects] = useState<DuoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [colorPick, setColorPick] = useState<'green' | 'yellow' | 'red'>('green');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{ projects: DuoProject[] }>('/api/duo/projects');
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Duo projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (!goal.trim()) return;
    setBusy(true);
    setError('');
    try {
      await apiSend('/api/duo/projects', 'POST', {
        goal: goal.trim(),
        verbosity: 'normal',
        userSelectedColor: colorPick
      });
      setGoal('');
      setColorPick('green');
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Capsules</p>
          <h2 className="text-2xl font-semibold text-slate-50">Your DuoMode</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
          >
            <Plus className="h-4 w-4" />
            New capsule
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
      {loading && <div className="text-sm text-slate-400">Loading capsules…</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map(project => {
          const c = capsuleColorClasses(project.color);
          return (
            <Link
              key={project.id}
              href={`/duo/${project.id}`}
              className={`rounded-lg border ${c.border} bg-neutral-950 p-4 transition hover:border-cyan-400/50`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <span className="text-[0.65rem] font-bold tracking-[0.2em] text-slate-500">{c.label}</span>
              </div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-slate-50">
                    {project.title || project.goal || 'Untitled capsule'}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{project.goal || project.domain || 'No goal recorded'}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-md border px-2 py-1 ${statusTone(project.status)}`}>{project.status || 'draft'}</span>
                <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300">
                  {project.domain || 'general'}
                </span>
                <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-400">
                  {formatDate(project.updated_at || project.created_at)}
                </span>
              </div>
            </Link>
          );
        })}

        {!loading && projects.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-800 bg-neutral-950 p-6 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
            <Waypoints className="mb-3 h-5 w-5 text-cyan-200" />
            No capsules yet. Launch one — CubiQo will plan, route, and run it.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-neutral-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">New capsule</p>
                <h3 className="text-lg font-semibold text-slate-100">What do you want to work on?</h3>
              </div>
              <button
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-slate-800 p-1 text-slate-400 hover:bg-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={createProject} className="space-y-4">
              <textarea
                value={goal}
                onChange={event => setGoal(event.target.value)}
                placeholder="e.g. Set up a Shopify print-on-demand store for graphic tees"
                rows={3}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                autoFocus
              />

              <div>
                <div className="mb-2 text-xs text-slate-400">Pick a colour to frame this goal</div>
                <div className="space-y-2">
                  {COLORS.map(opt => {
                    const selected = colorPick === opt.key;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setColorPick(opt.key)}
                        className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                          selected ? opt.tone : 'border-slate-800 hover:bg-slate-900'
                        }`}
                      >
                        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${opt.dot}`} />
                        <span>
                          <span className="block text-sm font-medium text-slate-100">{opt.label}</span>
                          <span className="block text-xs text-slate-400">{opt.line}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.7rem] text-slate-500">
                  CubiQo may reclassify the colour based on your goal — your pick is always remembered.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !goal.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Launch capsule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
