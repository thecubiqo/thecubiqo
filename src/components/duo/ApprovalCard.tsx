'use client';

import { useMemo, useState } from 'react';

interface Props {
  approval: {
    id: string;
    action_type?: string;
    preview_content?: string;
    expires_at?: string;
    reversible?: boolean;
    on_reject_note?: string;
  };
  onDecision?: () => void;
}

export function ApprovalCard({ approval, onDecision }: Props) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const expiresIn = useMemo(() => {
    if (!approval.expires_at) return '24h';
    const ms = new Date(approval.expires_at).getTime() - Date.now();
    return ms > 0 ? `${Math.ceil(ms / 3_600_000)}h` : 'expired';
  }, [approval.expires_at]);

  async function decide(action: 'approve' | 'reject') {
    setBusy(action);
    await fetch(`/api/duo/approvals/${approval.id}/${action}`, { method: 'POST' }).finally(() => setBusy(null));
    onDecision?.();
  }

  return (
    <div className="rounded-lg border border-orange-500/40 bg-orange-950/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-orange-300">{approval.action_type || 'Approval required'}</h3>
        <span className="text-[10px] text-orange-200/70">{expiresIn}</span>
      </div>
      <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-2 text-[11px] text-slate-200">{approval.preview_content || 'No preview content available.'}</pre>
      <p className="mt-2 text-[11px] text-orange-100/70">
        {approval.reversible ? 'This action has a reversible window.' : 'No automatic undo will be shown for irreversible actions.'}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy !== null} onClick={() => void decide('reject')} className="flex-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 disabled:opacity-50">
          Reject
        </button>
        <button type="button" disabled={busy !== null} onClick={() => void decide('approve')} className="flex-1 rounded bg-orange-400 px-2 py-1 text-xs font-medium text-slate-950 disabled:opacity-50">
          Approve
        </button>
      </div>
      {approval.on_reject_note && <p className="mt-2 text-[10px] text-slate-400">{approval.on_reject_note}</p>}
    </div>
  );
}
