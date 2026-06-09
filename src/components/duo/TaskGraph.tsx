'use client';

import { CheckCircle2, CircleDashed, Clock, Play, ShieldAlert, XCircle } from 'lucide-react';
import type { DuoRiskLevel, DuoTaskStatus } from '@/next/types/duo';

export type DuoTaskView = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: DuoTaskStatus | string | null;
  risk_level?: DuoRiskLevel | string | null;
  approval_required?: boolean | null;
  can_parallelize?: boolean | null;
  selected_route?: string | null;
  assigned_route?: string | null;
  last_error?: string | null;
  result?: string | null;
  dependencies?: string[] | null;
};

export type DuoTaskEdgeView = {
  id?: string;
  from_task_id?: string | null;
  to_task_id?: string | null;
  edge_type?: string | null;
};

type Props = {
  tasks: DuoTaskView[];
  edges?: DuoTaskEdgeView[];
  onExecute?: (taskId: string) => Promise<void> | void;
};

const STATUS_TONE: Record<string, string> = {
  pending: 'border-slate-700 bg-slate-900 text-slate-300',
  ready: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100',
  running: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
  waiting_user: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
  waiting_approval: 'border-violet-300/40 bg-violet-300/10 text-violet-100',
  completed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  failed: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
  skipped: 'border-slate-700 bg-slate-900 text-slate-400',
  blocked: 'border-rose-400/40 bg-rose-400/10 text-rose-100'
};

function TaskIcon({ status }: { status?: string | null }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === 'failed' || status === 'blocked') return <XCircle className="h-4 w-4 text-rose-300" />;
  if (status === 'running') return <Clock className="h-4 w-4 text-amber-300" />;
  if (status === 'waiting_approval') return <ShieldAlert className="h-4 w-4 text-violet-300" />;
  return <CircleDashed className="h-4 w-4 text-slate-400" />;
}

function dependenciesFor(task: DuoTaskView, edges: DuoTaskEdgeView[]) {
  const explicit = task.dependencies || [];
  const edgeDeps = edges.filter(edge => edge.to_task_id === task.id).map(edge => edge.from_task_id).filter(Boolean) as string[];
  return [...new Set([...explicit, ...edgeDeps])];
}

export function TaskGraph({ tasks, edges = [], onExecute }: Props) {
  const titleById = new Map(tasks.map(task => [task.id, task.title || task.description || task.id.slice(0, 8)]));

  if (tasks.length === 0) {
    return <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4 text-sm text-slate-400">No tasks yet.</div>;
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task, index) => {
        const deps = dependenciesFor(task, edges);
        const status = task.status || 'pending';
        return (
          <article key={task.id} className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-400">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskIcon status={status} />
                  <h3 className="text-sm font-semibold text-slate-100">{task.title || task.description || task.id}</h3>
                  <span className={`rounded-lg border px-2 py-0.5 text-xs ${STATUS_TONE[String(status)] || STATUS_TONE.pending}`}>
                    {String(status).replace(/_/g, ' ')}
                  </span>
                  {task.approval_required && (
                    <span className="rounded-lg border border-violet-300/40 bg-violet-300/10 px-2 py-0.5 text-xs text-violet-100">approval</span>
                  )}
                </div>
                {task.description && <p className="mt-2 text-sm leading-5 text-slate-400">{task.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {(task.selected_route || task.assigned_route) && (
                    <span className="rounded-lg bg-slate-900 px-2 py-1">{task.selected_route || task.assigned_route}</span>
                  )}
                  {task.risk_level && <span className="rounded-lg bg-slate-900 px-2 py-1">risk {task.risk_level}</span>}
                  {task.can_parallelize && <span className="rounded-lg bg-slate-900 px-2 py-1">parallel-ready</span>}
                </div>
                {deps.length > 0 && (
                  <div className="mt-3 text-xs text-slate-500">
                    Depends on {deps.map(dep => titleById.get(dep) || dep.slice(0, 8)).join(', ')}
                  </div>
                )}
                {task.last_error && <p className="mt-2 text-xs leading-5 text-rose-200">{task.last_error}</p>}
                {task.result && <p className="mt-2 text-xs leading-5 text-emerald-100">{task.result}</p>}
              </div>
              {onExecute && (status === 'ready' || status === 'pending') && (
                <button
                  type="button"
                  onClick={() => onExecute(task.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-900"
                >
                  <Play className="h-3.5 w-3.5" />
                  Run
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
