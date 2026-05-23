'use client';

/**
 * Global overlay-card system.
 *
 * Per CubiQo-UI-Architecture.md §Card System + APP SHELL §Overlay Cards:
 * - Approval card (z 500) — DuoMode task waiting_approval
 * - Question card (z 490) — DuoMode task awaiting_user
 * - RGY context card (z 470) — significant RGY shift / off-thread signal
 *
 * These cards float over the hero (or any current screen) and dismiss back
 * to it. They never push a URL.
 *
 * Mounted from two places:
 *   - src/app/(app)/layout.tsx (covers /chat, /duo, /chatrooms, /account/*, …)
 *   - frontend/src/App.js     (covers the legacy hero at /app)
 *
 * Both are inside the authenticated experience. Anonymous users see nothing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getBrowserSupabase, authHeaders } from '@/next/lib/supabase-browser';

type PendingApproval = {
  id: string;
  project_id?: string | null;
  task_id?: string | null;
  action_type?: string | null;
  preview_content?: string | null;
  on_reject_note?: string | null;
  reversible?: boolean | null;
  reversible_window_seconds?: number | null;
  expires_at?: string | null;
  capsule_color?: 'green' | 'yellow' | 'red' | null;
  platform?: string | null;
  endpoint?: string | null;
};

type PendingQuestion = {
  id: string;
  project_id?: string | null;
  question_text?: string | null;
  expires_at?: string | null;
  capsule_color?: 'green' | 'yellow' | 'red' | null;
};

type RgyContext = {
  id: string;
  color: 'green' | 'yellow' | 'red';
  headline: string;
  body?: string;
  cta_href?: string;
};

const TONE: Record<'green' | 'yellow' | 'red', { ring: string; glow: string; pillBg: string; pillText: string }> = {
  green: {
    ring: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.15)',
    pillBg: 'rgba(34, 197, 94, 0.12)',
    pillText: '#86efac'
  },
  yellow: {
    ring: 'rgba(250, 204, 21, 0.35)',
    glow: 'rgba(250, 204, 21, 0.15)',
    pillBg: 'rgba(250, 204, 21, 0.12)',
    pillText: '#fde68a'
  },
  red: {
    ring: 'rgba(248, 113, 113, 0.35)',
    glow: 'rgba(248, 113, 113, 0.15)',
    pillBg: 'rgba(248, 113, 113, 0.12)',
    pillText: '#fca5a5'
  }
};

function tone(color?: string | null) {
  const c = String(color || 'yellow').toLowerCase();
  return TONE[(c === 'green' || c === 'red' || c === 'yellow' ? c : 'yellow') as 'green' | 'yellow' | 'red'];
}

function countdown(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

const POLL_MS = 30_000;

export function CubiQoOverlays() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [contexts, setContexts] = useState<RgyContext[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth gate — overlays only for signed-in users.
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(Boolean(data.session));
    });
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const fetchPending = useCallback(async () => {
    if (!authed) return;
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      const [aRes, qRes, cRes] = await Promise.allSettled([
        fetch('/api/duo/approvals?status=pending&limit=5', { headers, cache: 'no-store' }),
        fetch('/api/duo/tasks?status=awaiting_user&limit=5', { headers, cache: 'no-store' }),
        fetch('/api/rgy/context-card', { headers, cache: 'no-store' })
      ]);
      if (aRes.status === 'fulfilled' && aRes.value.ok) {
        const data = await aRes.value.json().catch(() => ({}));
        const list: PendingApproval[] = Array.isArray(data.approvals) ? data.approvals : [];
        setApprovals(list.filter(a => !dismissed.has(`a:${a.id}`)));
      }
      if (qRes.status === 'fulfilled' && qRes.value.ok) {
        const data = await qRes.value.json().catch(() => ({}));
        const list: PendingQuestion[] = Array.isArray(data.tasks) ? data.tasks : [];
        setQuestions(list.filter(q => !dismissed.has(`q:${q.id}`)));
      }
      if (cRes.status === 'fulfilled' && cRes.value.ok) {
        const data = await cRes.value.json().catch(() => ({}));
        const list: RgyContext[] = Array.isArray(data.cards) ? data.cards : [];
        setContexts(list.filter(c => !dismissed.has(`c:${c.id}`)));
      }
    } catch {
      /* silent — overlays must never break the page */
    }
  }, [authed, dismissed]);

  useEffect(() => {
    if (!authed) return;
    fetchPending();
    timerRef.current = setInterval(fetchPending, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchPending(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authed, fetchPending]);

  async function decide(approval: PendingApproval, action: 'approve' | 'reject') {
    try {
      const headers = await authHeaders();
      await fetch(`/api/duo/approvals/${approval.id}/${action}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    } catch {
      /* swallow — refresh below will retry */
    } finally {
      setDismissed(prev => new Set(prev).add(`a:${approval.id}`));
      setApprovals(prev => prev.filter(a => a.id !== approval.id));
    }
  }

  async function answerQuestion(question: PendingQuestion, value: string) {
    if (!value.trim()) return;
    try {
      const headers = await authHeaders();
      await fetch(`/api/duo/tasks/${question.id}/answer`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: value.trim() })
      });
    } catch {
      /* swallow */
    } finally {
      setDismissed(prev => new Set(prev).add(`q:${question.id}`));
      setQuestions(prev => prev.filter(q => q.id !== question.id));
    }
  }

  function dismissContext(id: string) {
    setDismissed(prev => new Set(prev).add(`c:${id}`));
    setContexts(prev => prev.filter(c => c.id !== id));
  }

  if (!authed) return null;

  return (
    <>
      {/* Approval cards — z 500 — block until actioned, no swipe-to-dismiss */}
      {approvals.map((a, i) => {
        const t = tone(a.capsule_color);
        return (
          <ApprovalCardOverlay
            key={a.id}
            approval={a}
            stackIndex={i}
            tone={t}
            onApprove={() => decide(a, 'approve')}
            onReject={() => decide(a, 'reject')}
          />
        );
      })}
      {/* Question cards — z 490 */}
      {questions.map((q, i) => {
        const t = tone(q.capsule_color);
        return (
          <QuestionCardOverlay
            key={q.id}
            question={q}
            stackIndex={i + approvals.length}
            tone={t}
            onAnswer={value => answerQuestion(q, value)}
            onDismiss={() => {
              setDismissed(prev => new Set(prev).add(`q:${q.id}`));
              setQuestions(prev => prev.filter(x => x.id !== q.id));
            }}
          />
        );
      })}
      {/* RGY context cards — z 470 */}
      {contexts.map((c, i) => {
        const t = tone(c.color);
        return (
          <RgyContextCardOverlay
            key={c.id}
            card={c}
            stackIndex={i + approvals.length + questions.length}
            tone={t}
            onDismiss={() => dismissContext(c.id)}
          />
        );
      })}
    </>
  );
}

// ── individual card components ───────────────────────────────────────────────

function stackOffset(index: number) {
  return 8 * Math.min(index, 3);
}

function ApprovalCardOverlay({
  approval,
  stackIndex,
  tone,
  onApprove,
  onReject
}: {
  approval: PendingApproval;
  stackIndex: number;
  tone: { ring: string; glow: string; pillBg: string; pillText: string };
  onApprove: () => void;
  onReject: () => void;
}) {
  const expiry = countdown(approval.expires_at);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16 + stackOffset(stackIndex),
        right: 16 + stackOffset(stackIndex),
        width: 'min(380px, calc(100vw - 32px))',
        maxHeight: '70vh',
        background: 'rgba(12,12,18,0.96)',
        border: `1px solid ${tone.ring}`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.55), 0 0 24px ${tone.glow}`,
        borderRadius: 16,
        padding: 14,
        zIndex: 500,
        color: '#fff',
        overflow: 'auto',
        backdropFilter: 'blur(10px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: 1.6,
            color: tone.pillText,
            background: tone.pillBg,
            padding: '3px 8px',
            borderRadius: 999
          }}
        >
          NEEDS YOUR APPROVAL
        </span>
        {expiry && (
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
            {expiry === 'expired' ? 'expired' : `expires in ${expiry}`}
          </span>
        )}
      </div>

      {approval.action_type && (
        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{approval.action_type}</div>
      )}

      {(approval.platform || approval.endpoint) && (
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
          {[approval.platform, approval.endpoint].filter(Boolean).join(' · ')}
        </div>
      )}

      <pre
        style={{
          margin: 0,
          maxHeight: 240,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: 10,
          fontSize: '0.78rem',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'inherit'
        }}
      >
        {approval.preview_content || 'No preview content provided.'}
      </pre>

      <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
        {approval.reversible
          ? `Reversible · ${approval.reversible_window_seconds || 60}s undo window`
          : 'Not reversible'}
        {approval.on_reject_note ? ` · If denied: ${approval.on_reject_note}` : ' · If denied: draft kept, nothing sent.'}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={onReject}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 10,
            padding: '9px 0',
            color: '#fff',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          Deny
        </button>
        <button
          type="button"
          onClick={onApprove}
          style={{
            flex: 1,
            background: '#67e8f9',
            border: 0,
            borderRadius: 10,
            padding: '9px 0',
            color: '#0a0a14',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Approve
        </button>
      </div>
    </div>
  );
}

function QuestionCardOverlay({
  question,
  stackIndex,
  tone,
  onAnswer,
  onDismiss
}: {
  question: PendingQuestion;
  stackIndex: number;
  tone: { ring: string; glow: string; pillBg: string; pillText: string };
  onAnswer: (value: string) => void;
  onDismiss: () => void;
}) {
  const [value, setValue] = useState('');
  const expiry = countdown(question.expires_at);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16 + stackOffset(stackIndex),
        right: 16 + stackOffset(stackIndex),
        width: 'min(360px, calc(100vw - 32px))',
        background: 'rgba(12,12,18,0.96)',
        border: `1px solid ${tone.ring}`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.55), 0 0 24px ${tone.glow}`,
        borderRadius: 16,
        padding: 14,
        zIndex: 490,
        color: '#fff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: 1.6,
            color: tone.pillText,
            background: tone.pillBg,
            padding: '3px 8px',
            borderRadius: 999
          }}
        >
          CUBIQO NEEDS YOUR INPUT
        </span>
        {expiry && (
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>{expiry}</span>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            width: 22,
            height: 22,
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer'
          }}
        >
          <X size={11} />
        </button>
      </div>

      <div style={{ fontSize: '0.86rem', lineHeight: 1.45, marginBottom: 10 }}>
        {question.question_text || 'Awaiting your input to proceed.'}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onAnswer(value);
              setValue('');
            }
          }}
          placeholder="Type your answer…"
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '8px 10px',
            color: '#fff',
            fontSize: '0.82rem',
            outline: 'none'
          }}
        />
        <button
          type="button"
          onClick={() => {
            onAnswer(value);
            setValue('');
          }}
          style={{
            background: '#67e8f9',
            border: 0,
            borderRadius: 10,
            padding: '0 14px',
            color: '#0a0a14',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function RgyContextCardOverlay({
  card,
  stackIndex,
  tone,
  onDismiss
}: {
  card: RgyContext;
  stackIndex: number;
  tone: { ring: string; glow: string; pillBg: string; pillText: string };
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16 + stackOffset(stackIndex),
        right: 16 + stackOffset(stackIndex),
        width: 'min(340px, calc(100vw - 32px))',
        background: 'rgba(12,12,18,0.96)',
        border: `1px solid ${tone.ring}`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.55), 0 0 24px ${tone.glow}`,
        borderRadius: 16,
        padding: 14,
        zIndex: 470,
        color: '#fff'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Sparkles size={13} color={tone.pillText} />
        <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: 1.6, color: tone.pillText }}>
          CUBIQO NOTICED SOMETHING
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            width: 22,
            height: 22,
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer'
          }}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6 }}>{card.headline}</div>
      {card.body && (
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, marginBottom: 10 }}>
          {card.body}
        </div>
      )}
      {card.cta_href && (
        <a
          href={card.cta_href}
          style={{
            display: 'inline-block',
            background: tone.pillBg,
            border: `1px solid ${tone.ring}`,
            color: tone.pillText,
            borderRadius: 10,
            padding: '7px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
          onClick={onDismiss}
        >
          Talk to CubiQo →
        </a>
      )}
    </div>
  );
}
