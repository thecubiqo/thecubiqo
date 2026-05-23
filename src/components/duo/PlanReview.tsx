'use client';

import { useEffect, useMemo, useState } from 'react';

interface Task {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  approval_required?: boolean;
  depends_on_tasks?: string[];
}

interface Props {
  projectId: string;
  tasks: Task[];
  onApproved?: () => void;
}

export function PlanReview({ projectId, tasks, onApproved }: Props) {
  const riskyTasks = useMemo(() => tasks.filter(task => task.approval_required), [tasks]);
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(30);
  const allAcked = riskyTasks.every(task => acked[task.id]);

  useEffect(() => {
    if (!allAcked) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [allAcked]);

  useEffect(() => {
    if (allAcked && secondsLeft === 0) void approve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAcked, secondsLeft]);

  async function approve() {
    const res = await fetch(`/api/duo/projects/${projectId}/approve`, { method: 'POST' });
    if (res.ok) onApproved?.();
  }

  return (
    <section className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-indigo-200">Plan Review</h2>
        <span className="text-xs text-indigo-200/70">{allAcked ? `Auto-start in ${secondsLeft}s` : 'Review required'}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {tasks.map(task => (
          <label key={task.id} className="flex items-start gap-2 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
            {task.approval_required ? (
              <input type="checkbox" checked={Boolean(acked[task.id])} onChange={event => setAcked(prev => ({ ...prev, [task.id]: event.target.checked }))} />
            ) : (
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-300" />
            )}
            <span>{task.title || task.name || 'Untitled task'}</span>
          </label>
        ))}
      </div>
      <button type="button" disabled={!allAcked} onClick={() => void approve()} className="mt-3 rounded-lg bg-indigo-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
        Approve plan
      </button>
    </section>
  );
}
