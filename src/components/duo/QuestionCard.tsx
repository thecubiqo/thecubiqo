'use client';

import { useState } from 'react';

interface Props {
  taskId: string;
  question: string;
  onAnswered?: () => void;
}

export function QuestionCard({ taskId, question, onAnswered }: Props) {
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!answer.trim()) return;
    setSaving(true);
    await fetch(`/api/duo/tasks/${taskId}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    }).finally(() => setSaving(false));
    setAnswer('');
    onAnswered?.();
  }

  return (
    <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 p-3">
      <div className="text-xs font-semibold text-purple-300">{question}</div>
      <div className="mt-2 flex gap-2">
        <input
          value={answer}
          onChange={event => setAnswer(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') void submit();
          }}
          className="min-w-0 flex-1 rounded border border-purple-500/30 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none"
          placeholder="Answer and press Enter"
        />
        <button type="button" disabled={saving || !answer.trim()} onClick={() => void submit()} className="rounded bg-purple-400 px-2 py-1 text-xs font-medium text-slate-950 disabled:opacity-50">
          Send
        </button>
      </div>
      <p className="mt-2 text-[11px] text-purple-300/70">Other branches can continue while this waits.</p>
    </div>
  );
}
