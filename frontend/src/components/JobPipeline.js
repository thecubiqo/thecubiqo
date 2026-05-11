import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────

const STAGE_LABELS = {
  discovered: { label: 'Discovered', color: '#60a5fa', dot: '#3b82f6' },
  tailoring:  { label: 'Tailoring',  color: '#f59e0b', dot: '#f59e0b' },
  ready:      { label: 'Ready',      color: '#34d399', dot: '#10b981' },
  applying:   { label: 'Applying',   color: '#a78bfa', dot: '#8b5cf6' },
  submitted:  { label: 'Submitted',  color: '#34d399', dot: '#10b981' },
  failed:     { label: 'Failed',     color: '#f87171', dot: '#ef4444' },
  interview:  { label: 'Interview',  color: '#fbbf24', dot: '#f59e0b' },
};

function atsBar(score) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 85 ? '#34d399' : pct >= 70 ? '#f59e0b' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 9999, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ color, fontSize: '0.68rem', fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function timeAgo(dt) {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PLATFORM_ICONS = {
  linkedin: '🔵',
  indeed: '🟡',
  dice: '🔴',
  monster: '🟢',
  greenhouse: '🌿',
  lever: '⚡',
  workday: '☁️',
};

// ── SIGNAL Icon ───────────────────────────────────────────────────────────

function SignalChatIcon({ size = 22, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Open SIGNAL chat for this job"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {/* Traffic light body */}
        <rect x="9" y="4" width="16" height="26" rx="5" fill="url(#tl-grad)" />
        <circle cx="17" cy="10" r="3.5" fill="#ef4444" />
        <circle cx="17" cy="18" r="3.5" fill="#f59e0b" />
        <circle cx="17" cy="26" r="3.5" fill="#22c55e" />
        {/* Chat bubble tail */}
        <path d="M25 20 Q35 20 35 28 Q35 36 27 36 L23 38 L24 34 Q18 34 18 28 Q18 20 25 20Z" fill="#7c3aed" opacity="0.9" />
        {/* Circuit traces */}
        <line x1="25" y1="10" x2="36" y2="10" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="37" cy="10" r="1.5" fill="#f59e0b" />
        <line x1="25" y1="18" x2="32" y2="18" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="33" cy="18" r="1.5" fill="#22c55e" />
        <defs>
          <linearGradient id="tl-grad" x1="9" y1="4" x2="25" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef4444" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>
      </svg>
    </button>
  );
}

// ── DUO MODE CTA ──────────────────────────────────────────────────────────

function DuoModeCta({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Open DUO MODE — collaborate with AI to complete this application"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
        border: 'none', borderRadius: 8, cursor: 'pointer',
        padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6,
        fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.5, color: '#fff',
        boxShadow: '0 0 12px rgba(139,92,246,0.4)',
        textTransform: 'uppercase', transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 22px rgba(192,132,252,0.65)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 12px rgba(139,92,246,0.4)'}
    >
      <span style={{ display: 'inline-block', fontStyle: 'italic', letterSpacing: 1 }}>DUO</span>
      <span>MODE</span>
      <span style={{ fontSize: '0.6rem' }}>▶</span>
    </button>
  );
}

// ── Job Capsule ───────────────────────────────────────────────────────────

function JobCapsule({ job, onDuoMode, onSignalChat, onApply, isApplying }) {
  const stage = STAGE_LABELS[job.status] || STAGE_LABELS.discovered;
  const platformIcon = PLATFORM_ICONS[job.platform] || '🌐';

  return (
    <div style={{
      border: `1px solid ${stage.dot}33`,
      background: 'rgba(8,8,20,0.82)',
      borderRadius: 16, padding: '14px 16px',
      backdropFilter: 'blur(16px)',
      boxShadow: `0 0 0 1px ${stage.dot}22, 0 8px 32px rgba(0,0,0,0.4)`,
      transition: 'box-shadow 0.2s'
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.62rem' }}>{platformIcon}</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
              {job.title}
            </span>
            <span style={{
              background: `${stage.dot}22`, color: stage.color,
              border: `1px solid ${stage.dot}44`, borderRadius: 99,
              padding: '1px 8px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: stage.dot,
                animation: ['applying', 'tailoring'].includes(job.status) ? 'cq-dot 1.4s infinite' : 'none'
              }} />
              {stage.label}
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', marginTop: 3 }}>
            {job.company} · {job.location || 'Location TBD'} · {timeAgo(job.postedAt || job.createdAt)}
          </div>
          {job.salary && (
            <div style={{ color: '#34d399', fontSize: '0.68rem', marginTop: 2 }}>{job.salary}</div>
          )}
          {job.atsScore != null && atsBar(job.atsScore)}
        </div>
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <SignalChatIcon onClick={() => onSignalChat(job)} />
        <DuoModeCta onClick={() => onDuoMode(job)} />
        {['ready', 'prepared', 'discovered'].includes(job.status) && (
          <button
            onClick={() => onApply(job)}
            disabled={isApplying}
            style={{
              background: isApplying ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none', borderRadius: 8, padding: '5px 14px',
              color: isApplying ? 'rgba(255,255,255,0.38)' : '#fff',
              fontSize: '0.68rem', fontWeight: 700, cursor: isApplying ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3
            }}
          >
            {isApplying ? 'Applying…' : 'Easy Apply ▶'}
          </button>
        )}
        {job.applications?.length > 0 && (
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem' }}>
            {job.applications.length} application{job.applications.length > 1 ? 's' : ''}
          </span>
        )}
        {job.applications?.[0]?.screenshot_url && (
          <a
            href={job.applications[0].screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', textDecoration: 'underline' }}
          >
            Receipt
          </a>
        )}
      </div>
    </div>
  );
}

// ── DUO MODE Panel ────────────────────────────────────────────────────────
// The AI drives the application. When it hits a gap it doesn't know how to
// fill it surfaces a targeted question to you. You answer → AI continues.

const PHASE = { briefing: 'briefing', qa: 'qa', ready: 'ready', applying: 'applying', done: 'done' };

function DuoModePanel({ job, onClose, token, onApplied }) {
  const [phase, setPhase] = useState(PHASE.briefing);
  const [briefing, setBriefing] = useState(null);      // { covered: [], gaps: [{field, question, context}] }
  const [gapIndex, setGapIndex] = useState(0);
  const [gapAnswers, setGapAnswers] = useState({});    // field → answer
  const [inputVal, setInputVal] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('review');
  const inputRef = React.useRef(null);

  // Step 1 — AI analyses the job + your profile and identifies gaps
  const startBriefing = useCallback(async () => {
    if (!token || !job) return;
    setLoadingBriefing(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: [
            `I am about to apply to this job and need you to act as my application co-pilot.`,
            `Job: ${job.title} at ${job.company} (${job.platform}, ${job.location || 'location not specified'}).`,
            `Job description excerpt: ${(job.description || '').slice(0, 600) || 'Not available.'}`,
            ``,
            `My profile already has: full name, email, phone, LinkedIn URL, US citizenship (no sponsorship), work authorization, remote preference, salary expectation, availability.`,
            ``,
            `Analyse the job posting and identify up to 5 fields or questions that a typical ${job.platform} application form would ask that my standard profile does NOT cover (e.g. years of experience in a specific tool, GitHub/portfolio URL, cover letter customisation, specific certifications, expected start date format, etc.).`,
            ``,
            `Respond ONLY with a JSON object in this exact shape — no prose, no markdown:`,
            `{"covered":["field1","field2"],"gaps":[{"field":"fieldName","question":"The exact question you need me to answer","context":"Why this matters for this role"}]}`
          ].join('\n')
        })
      });
      const data = await res.json();
      // extract JSON from the response text
      const raw = data.response || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setBriefing(parsed);
        setPhase(parsed.gaps?.length ? PHASE.qa : PHASE.ready);
        setGapIndex(0);
        setGapAnswers({});
      } else {
        // No gaps found — go straight to ready
        setBriefing({ covered: [], gaps: [] });
        setPhase(PHASE.ready);
      }
    } catch {
      setBriefing({ covered: [], gaps: [] });
      setPhase(PHASE.ready);
    } finally {
      setLoadingBriefing(false);
    }
  }, [token, job]);

  useEffect(() => {
    startBriefing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === PHASE.qa) inputRef.current?.focus();
  }, [phase, gapIndex]);

  const currentGap = briefing?.gaps?.[gapIndex];
  const totalGaps = briefing?.gaps?.length || 0;

  const submitAnswer = () => {
    if (!inputVal.trim() || !currentGap) return;
    const next = { ...gapAnswers, [currentGap.field]: inputVal.trim() };
    setGapAnswers(next);
    setInputVal('');
    if (gapIndex + 1 < totalGaps) {
      setGapIndex(i => i + 1);
    } else {
      setPhase(PHASE.ready);
    }
  };

  const skipAnswer = () => {
    if (!currentGap) return;
    const next = { ...gapAnswers, [currentGap.field]: '— skipped —' };
    setGapAnswers(next);
    setInputVal('');
    if (gapIndex + 1 < totalGaps) {
      setGapIndex(i => i + 1);
    } else {
      setPhase(PHASE.ready);
    }
  };

  const handleApply = async () => {
    if (!token || !job) return;
    setPhase(PHASE.applying);
    setApplying(true);
    setResult(null);
    try {
      const res = await fetch('/api/jobs/easy-apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: job.id,
          job_url: job.jobUrl,
          mode,
          gap_answers: gapAnswers   // additional Q&A collected in DUO MODE
        })
      });
      const data = await res.json();
      setResult(data);
      setPhase(PHASE.done);
      if (data.applied || data.status === 'ready_to_submit') onApplied?.(job.id, data.status);
    } catch (err) {
      setResult({ error: err.message });
      setPhase(PHASE.ready);
    } finally {
      setApplying(false);
    }
  };

  if (!job) return null;

  // ── progress bar (briefing → each gap → ready → done) ──
  const totalSteps = 2 + totalGaps; // briefing + gaps + ready
  const currentStep = phase === PHASE.briefing ? 0
    : phase === PHASE.qa ? 1 + gapIndex
    : phase === PHASE.ready || phase === PHASE.applying ? totalSteps - 1
    : totalSteps;
  const progress = totalSteps > 1 ? Math.round((currentStep / (totalSteps - 1)) * 100) : 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100vw)', height: '94vh',
          background: 'linear-gradient(180deg, rgba(10,8,24,0.98) 0%, rgba(5,4,12,0.99) 100%)',
          border: '1px solid rgba(139,92,246,0.32)',
          borderRadius: '20px 0 0 0',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-24px 0 72px rgba(139,92,246,0.18)',
          overflow: 'hidden'
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
          background: 'linear-gradient(90deg, rgba(124,58,237,0.14) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontWeight: 900, fontSize: '1.05rem', letterSpacing: 1.5, textTransform: 'uppercase', fontStyle: 'italic'
              }}>DUO</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>MODE</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7' }} />
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
          </div>

          {/* Job identity */}
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>{job.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: 2 }}>
            {job.company} · {PLATFORM_ICONS[job.platform] || '🌐'} {job.platform} · {job.location || 'Location TBD'}
          </div>
          {job.atsScore != null && <div style={{ marginTop: 6 }}>{atsBar(job.atsScore)}</div>}

          {/* Progress bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {phase === PHASE.briefing ? 'Analysing application…'
                  : phase === PHASE.qa ? `Question ${gapIndex + 1} of ${totalGaps}`
                  : phase === PHASE.ready ? 'Ready to apply'
                  : phase === PHASE.applying ? 'Applying…'
                  : 'Done'}
              </span>
              <span style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: 9999, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* BRIEFING — analysing */}
          {phase === PHASE.briefing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, paddingTop: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', animation: 'spin 0.9s linear infinite' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem' }}>CubiQo is reviewing the job…</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 4 }}>Comparing with your profile to find any gaps</div>
              </div>
            </div>
          )}

          {/* Q&A — AI asks, you answer */}
          {phase === PHASE.qa && currentGap && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Completed gaps */}
              {Object.entries(gapAnswers).map(([field, ans]) => (
                <div key={field} style={{
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)',
                  borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10
                }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', letterSpacing: 1 }}>{field}</div>
                    <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{ans}</div>
                  </div>
                  <span style={{ color: '#34d399', fontSize: '0.9rem' }}>✓</span>
                </div>
              ))}

              {/* Current question */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(168,85,247,0.06) 100%)',
                border: '1px solid rgba(139,92,246,0.38)',
                borderRadius: 16, padding: '18px'
              }}>
                {/* AI avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 900, color: '#fff'
                  }}>AI</div>
                  <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.75rem' }}>CubiQo needs your input</span>
                </div>

                <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>
                  {currentGap.question}
                </div>

                {currentGap.context && (
                  <div style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px', marginBottom: 12
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>Why: </span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>{currentGap.context}</span>
                  </div>
                )}

                <textarea
                  ref={inputRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                  placeholder="Type your answer… (Enter to confirm, Shift+Enter for new line)"
                  rows={3}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    borderRadius: 10, padding: '10px 12px', color: '#fff',
                    fontSize: '0.82rem', outline: 'none', resize: 'none',
                    boxSizing: 'border-box', lineHeight: 1.5
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={submitAnswer} disabled={!inputVal.trim()}
                    style={{
                      flex: 1, background: inputVal.trim() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
                      border: 'none', borderRadius: 10, padding: '10px',
                      color: inputVal.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontWeight: 700, fontSize: '0.78rem', cursor: inputVal.trim() ? 'pointer' : 'not-allowed'
                    }}>
                    Confirm ↵
                  </button>
                  <button onClick={skipAnswer}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: '10px 14px',
                      color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', cursor: 'pointer'
                    }}>
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* READY — all gaps filled */}
          {(phase === PHASE.ready || phase === PHASE.applying) && !result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Summary of what was gathered */}
              <div style={{
                background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 14, padding: '14px 16px'
              }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>✓ Application brief complete</div>
                {briefing?.covered?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>From your profile</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {briefing.covered.map((f, i) => (
                        <span key={i} style={{ background: 'rgba(34,197,94,0.12)', borderRadius: 6, padding: '2px 8px', color: '#34d399', fontSize: '0.65rem' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {Object.keys(gapAnswers).length > 0 && (
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>You provided</div>
                    {Object.entries(gapAnswers).map(([field, ans]) => (
                      <div key={field} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}>{field}</span>
                        <span style={{ color: '#a78bfa', fontSize: '0.68rem', fontWeight: 600, maxWidth: '55%', textAlign: 'right' }}>{ans}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode selector */}
              <div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Apply mode</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'review', label: 'Stage & Review', desc: 'Fill the form and stop at final screen — you click Submit', color: '#7c3aed' }
                  ].map(({ key, label, desc, color }) => (
                    <button key={key} onClick={() => setMode(key)}
                      style={{
                        background: mode === key ? `${color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${mode === key ? color : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12, padding: '12px', cursor: 'pointer', textAlign: 'left'
                      }}>
                      <div style={{ color: mode === key ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.75rem' }}>{label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', marginTop: 4, lineHeight: 1.35 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {phase === PHASE.applying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'rgba(168,85,247,0.08)', borderRadius: 12, border: '1px solid rgba(168,85,247,0.2)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
                  <span style={{ color: '#c084fc', fontSize: '0.78rem' }}>Browser is filling the form… this takes 30–60 seconds</span>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {phase === PHASE.done && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                background: result.error ? 'rgba(248,113,113,0.08)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${result.error ? 'rgba(248,113,113,0.3)' : 'rgba(34,197,94,0.3)'}`,
                borderRadius: 14, padding: '16px'
              }}>
                {result.error ? (
                  <>
                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>⚠ Something went wrong</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{result.error}</div>
                    <button onClick={() => { setPhase(PHASE.ready); setResult(null); }}
                      style={{ marginTop: 12, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}>
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6 }}>
                      {result.applied ? '✓ Application submitted!' : '✓ Form filled — ready for your review'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginBottom: result.screenshotUrl ? 10 : 0 }}>
                      Platform: {result.platform} · Status: {result.status}
                    </div>
                    {result.screenshotUrl && (
                      <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-block', color: '#60a5fa', fontSize: '0.72rem', textDecoration: 'underline' }}>
                        View receipt screenshot →
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer — only shown when ready to launch ── */}
        {(phase === PHASE.ready) && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={handleApply}
              disabled={applying}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed 0%, #22c55e 100%)',
                border: 'none', borderRadius: 14, padding: '14px',
                color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                cursor: applying ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5, boxShadow: '0 8px 28px rgba(124,58,237,0.3)'
              }}
            >
              Stage Application — I&apos;ll Review & Submit
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Job Pipeline Main Component ───────────────────────────────────────────

function buildJobSearchProfileLabel(profile) {
  if (!profile) return 'Your Jobs · Latest';
  const roles = (profile.targetRoles || []).slice(0, 2);
  const location = (profile.preferredLocations || [])[0];
  const workMode = (profile.workModes || [])[0];
  const pieces = [...roles, location, workMode, 'Latest'].filter(Boolean);
  return pieces.length > 1 ? pieces.join(' · ') : 'Your Jobs · Latest';
}

export default function JobPipeline({ token, visible, onClose }) {
  const [pipeline, setPipeline] = useState([]);
  const [counts, setCounts] = useState({});
  const [jobSearchProfile, setJobSearchProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [pipelineError, setPipelineError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeStage, setActiveStage] = useState('all');
  const [duoJob, setDuoJob] = useState(null);
  const [signalJob, setSignalJob] = useState(null);
  const [applyingIds, setApplyingIds] = useState(new Set());
  const [scanMessage, setScanMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setProfileLoading(true);
    setProfileError(null);
    setPipelineError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pipelineRes, profileRes] = await Promise.all([
        fetch('/api/jobs/pipeline?limit=60', { headers }),
        fetch('/api/actions/execute?job_state=1', { headers })
      ]);
      if (!pipelineRes.ok) {
        throw new Error(`Pipeline request failed with ${pipelineRes.status}`);
      }
      const data = await pipelineRes.json();
      setPipeline(data.pipeline || []);
      setCounts(data.counts || {});
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setJobSearchProfile(profileData.profile || null);
      } else {
        setJobSearchProfile(null);
        setProfileError('Profile unavailable');
      }
    } catch (err) {
      setPipeline([]);
      setCounts({});
      setPipelineError(err?.message || 'Could not load pipeline');
      setProfileError('Profile unavailable');
    }
    setLoading(false);
    setProfileLoading(false);
  }, [token]);

  useEffect(() => {
    if (visible && token) load();
  }, [visible, token, load]);

  const triggerScan = async () => {
    if (!token) return;
    setScanning(true);
    setScanMessage('');
    try {
      const res = await fetch('/api/cron/job-scan', {
        headers: { Authorization: `Bearer ${token}`, 'x-cubiqo-manual': '1' }
      });
      const data = await res.json();
      setScanMessage(data.skipped ? `Skipped: ${data.reason}` : `Scan complete — found ${data.ran || 0} profile(s)`);
      await load();
    } catch (err) {
      setScanMessage('Scan failed — check Browserbase credentials');
    } finally {
      setScanning(false);
    }
  };

  const handleApply = async (job) => {
    if (!token || applyingIds.has(job.id)) return;
    setApplyingIds(s => new Set([...s, job.id]));
    try {
      const res = await fetch('/api/jobs/easy-apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: job.id, job_url: job.jobUrl, mode: 'review' })
      });
      const data = await res.json();
      if (data.status) {
        setPipeline(prev => prev.map(j => j.id === job.id ? { ...j, status: data.status } : j));
      }
    } catch {}
    setApplyingIds(s => { const n = new Set(s); n.delete(job.id); return n; });
    load();
  };

  const handleApplied = (id, status) => {
    setPipeline(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };

  if (!visible) return null;

  const displayed = activeStage === 'all' ? pipeline : pipeline.filter(j => j.status === activeStage);
  const stages = Object.keys(STAGE_LABELS);
  const profileLabel = profileLoading ? '…' : buildJobSearchProfileLabel(jobSearchProfile);

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '20px 12px', overflowY: 'auto'
      }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{
          width: 'min(640px, 100%)',
          background: 'linear-gradient(180deg, rgba(8,8,20,0.98) 0%, rgba(4,4,12,1) 100%)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)'
        }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '0.65rem', letterSpacing: 2.5, textTransform: 'uppercase' }}>● GREEN</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: 0.5 }}>JOB PIPELINE</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', marginTop: 3 }}>
                {profileLabel}
                {profileError ? ' · Profile not loaded' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={triggerScan}
                disabled={scanning}
                style={{
                  background: scanning ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '6px 14px',
                  color: scanning ? 'rgba(255,255,255,0.3)' : '#22c55e',
                  fontSize: '0.68rem', fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer'
                }}
              >
                {scanning ? 'Scanning…' : '↻ Scan now'}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
          </div>

          {/* Stage tabs */}
          <div style={{ padding: '10px 20px', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setActiveStage('all')} style={{
              background: activeStage === 'all' ? 'rgba(255,255,255,0.1)' : 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99,
              padding: '4px 12px', color: '#fff', fontSize: '0.65rem', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: activeStage === 'all' ? 700 : 400
            }}>
              All ({pipeline.length})
            </button>
            {stages.map(s => counts[s] > 0 && (
              <button key={s} onClick={() => setActiveStage(s)} style={{
                background: activeStage === s ? `${STAGE_LABELS[s].dot}22` : 'none',
                border: `1px solid ${activeStage === s ? STAGE_LABELS[s].dot : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 99, padding: '4px 12px',
                color: activeStage === s ? STAGE_LABELS[s].color : 'rgba(255,255,255,0.5)',
                fontSize: '0.65rem', cursor: 'pointer', whiteSpace: 'nowrap',
                fontWeight: activeStage === s ? 700 : 400
              }}>
                {STAGE_LABELS[s].label} ({counts[s]})
              </button>
            ))}
          </div>

          {scanMessage && (
            <div style={{ padding: '8px 20px', background: 'rgba(34,197,94,0.06)', color: '#34d399', fontSize: '0.72rem' }}>
              {scanMessage}
            </div>
          )}

          {pipelineError && (
            <div style={{
              margin: '12px 20px 0',
              padding: '12px 14px',
              border: '1px solid rgba(248,113,113,0.28)',
              background: 'rgba(248,113,113,0.08)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ color: '#fca5a5', fontSize: '0.76rem', fontWeight: 800 }}>Could not load pipeline</div>
                <div style={{ color: 'rgba(255,255,255,0.46)', fontSize: '0.68rem', marginTop: 3 }}>{pipelineError}</div>
              </div>
              <button
                onClick={load}
                disabled={loading}
                style={{
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.32)',
                  borderRadius: 9,
                  color: '#fecaca',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '7px 11px',
                  whiteSpace: 'nowrap'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Jobs list */}
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto' }}>
            {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: 24 }}>Loading pipeline…</div>}
            {!loading && displayed.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32 }}>
                {pipelineError ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Fix the pipeline error above, then retry.</div>
                ) : pipeline.length === 0 && !jobSearchProfile ? (
                  <>
                    <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>🎯</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>Set a job goal to start scanning</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginBottom: 16, lineHeight: 1.5 }}>
                      Tell your Career Coach what role you're targeting — it will build your search profile and start finding matches.
                    </div>
                    <div style={{ display: 'inline-block', padding: '7px 16px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 99, color: '#22c55e', fontSize: '0.72rem', fontWeight: 700 }}>
                      💼 Open Career Coach in Duo Mode to get started
                    </div>
                  </>
                ) : pipeline.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No jobs discovered yet — click ↻ Scan now to find recent matches.</div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No jobs in this stage.</div>
                )}
              </div>
            )}
            {displayed.map(job => (
              <JobCapsule
                key={job.id}
                job={job}
                onDuoMode={setDuoJob}
                onSignalChat={setSignalJob}
                onApply={handleApply}
                isApplying={applyingIds.has(job.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {duoJob && (
        <DuoModePanel
          job={duoJob}
          token={token}
          onClose={() => setDuoJob(null)}
          onApplied={handleApplied}
        />
      )}
    </>
  );
}
