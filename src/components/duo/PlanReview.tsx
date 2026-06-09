'use client';

/**
 * PlanReview — the Plan Review Gate shown before a capsule starts executing.
 *
 * Trust-model rules baked in here:
 *  • The approve call carries the user's auth header (the approve API is
 *    auth-gated; without it every approval silently 401'd).
 *  • Plans that contain approval-required ("risky") tasks are NEVER auto-started
 *    on a timer — they require an explicit click after each risky task is
 *    acknowledged. Only fully low-risk plans auto-start after a short countdown.
 *  • approve() is one-shot guarded so it can't double-fire (timer + click).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';

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
  const hasRisky = riskyTasks.length > 0;
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const firedRef = useRef(false);
  const allAcked = riskyTasks.every(task => acked[task.id]);
  const canApprove = !hasRisky || allAcked;

  // Auto-start countdown ONLY for fully low-risk plans. Risky plans wait for an
  // explicit, per-task-acknowledged click.
  useEffect(() => {
    if (hasRisky) return;
    const timer = window.setInterval(() => setSecondsLeft(value => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [hasRisky]);

  useEffect(() => {
    if (!hasRisky && secondsLeft === 0) void approve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRisky, secondsLeft]);

  async function approve() {
    if (firedRef.current || approving) return; // one-shot guard against double-fire
    firedRef.current = true;
    setApproving(true);
    setError('');
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/duo/projects/${projectId}/approve`, { method: 'POST', headers });
      if (res.ok) {
        onApproved?.();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Approval failed (${res.status})`);
        firedRef.current = false; // allow retry
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
      firedRef.current = false;
    } finally {
      setApproving(false);
    }
  }

  return (
    <section className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-indigo-200">Plan Review</h2>
        <span className="text-xs text-indigo-200/70">
          {hasRisky ? 'Approval required' : canApprove ? `Auto-start in ${secondsLeft}s` : 'Review required'}
        </span>
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
      {error && <p className="mt-2 rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">{error}</p>}
      <button
        type="button"
        disabled={!canApprove || approving}
        onClick={() => void approve()}
        className="mt-3 rounded-lg bg-indigo-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"
      >
        {approving ? 'Approving…' : 'Approve plan'}
      </button>
    </section>
  );
}
