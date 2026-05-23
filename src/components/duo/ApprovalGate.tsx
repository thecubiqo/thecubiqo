'use client';

import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { DuoRiskLevel } from '@/next/types/duo';

type Props = {
  taskId: string;
  taskTitle: string;
  riskLevel?: DuoRiskLevel | string | null;
  reversible?: boolean;
  previewContent?: string | null;
  onApprove: (taskId: string) => Promise<void> | void;
  onReject: (taskId: string) => Promise<void> | void;
};

const RISK_TONE: Record<string, string> = {
  low: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
  medium: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
  high: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
  critical: 'border-rose-300 bg-rose-500/20 text-rose-50'
};

export function ApprovalGate({
  taskId,
  taskTitle,
  riskLevel = 'medium',
  reversible = false,
  previewContent,
  onApprove,
  onReject
}: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const tone = RISK_TONE[String(riskLevel)] ?? RISK_TONE.medium;

  async function act(kind: 'approve' | 'reject') {
    setLoading(kind);
    try {
      if (kind === 'approve') await onApprove(taskId);
      else await onReject(taskId);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-neutral-950 p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-200">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-50">Approval Required</h3>
          <p className="mt-1 text-sm leading-5 text-slate-300">{taskTitle}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${tone}`}>Risk {String(riskLevel)}</span>
        <span className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300">
          {reversible ? 'Reversible' : 'No automatic undo'}
        </span>
      </div>

      {previewContent && (
        <pre className="mb-3 max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs leading-5 text-slate-300">
          {previewContent}
        </pre>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => act('reject')}
          disabled={loading != null}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          {loading === 'reject' ? 'Rejecting' : 'Reject'}
        </button>
        <button
          type="button"
          onClick={() => act('approve')}
          disabled={loading != null}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {loading === 'approve' ? 'Approving' : 'Approve'}
        </button>
      </div>
    </div>
  );
}
