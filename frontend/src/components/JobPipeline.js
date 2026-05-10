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
            {job.company} · {job.location || 'Remote-US'} · {timeAgo(job.postedAt || job.createdAt)}
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

function DuoModePanel({ job, onClose, token, onApplied }) {
  const [answers, setAnswers] = useState([]);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [chat, setChat] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [mode, setMode] = useState('review'); // 'review' | 'submit'

  useEffect(() => {
    if (!token) return;
    fetch('/api/jobs/answers', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAnswers(d.answers || []))
      .catch(() => null);
  }, [token]);

  const handleApply = async () => {
    if (!token || !job) return;
    setApplying(true);
    setResult(null);
    try {
      const res = await fetch('/api/jobs/easy-apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: job.id, job_url: job.jobUrl, mode })
      });
      const data = await res.json();
      setResult(data);
      if (data.applied || data.status === 'ready_to_submit') onApplied?.(job.id, data.status);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setApplying(false);
    }
  };

  const handleChat = async () => {
    if (!chat.trim() || isChatting || !token) return;
    const userMsg = chat.trim();
    setChatHistory(h => [...h, { role: 'user', content: userMsg }]);
    setChat('');
    setIsChatting(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Regarding this job application — ${job?.title} at ${job?.company}: ${userMsg}`
        })
      });
      const data = await res.json();
      setChatHistory(h => [...h, { role: 'assistant', content: data.response || 'No response' }]);
    } catch {
      setChatHistory(h => [...h, { role: 'assistant', content: 'Could not reach the agent right now.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (!job) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100vw)', height: '92vh',
          background: 'linear-gradient(180deg, rgba(10,8,24,0.97) 0%, rgba(6,6,14,0.99) 100%)',
          border: '1px solid rgba(139,92,246,0.28)',
          borderRadius: '20px 0 0 0',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(139,92,246,0.15)',
          overflow: 'hidden'
        }}
      >
        {/* DUO MODE Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
          background: 'linear-gradient(90deg, rgba(124,58,237,0.12) 0%, transparent 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontWeight: 900, fontSize: '1.1rem', letterSpacing: 1, textTransform: 'uppercase',
                fontStyle: 'italic'
              }}>DUO</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', letterSpacing: 1, textTransform: 'uppercase' }}>MODE</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', marginLeft: 4, boxShadow: '0 0 8px #a855f7' }} />
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{job.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginTop: 2 }}>
              {job.company} · {PLATFORM_ICONS[job.platform] || '🌐'} {job.platform} · {job.location || 'Remote-US'}
            </div>
            {job.atsScore != null && (
              <div style={{ marginTop: 6 }}>{atsBar(job.atsScore)}</div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Q&A answers */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Pre-Filled Answers
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {answers.length ? answers.map((a, i) => (
                <div key={a.id || i} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '8px 12px'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.65rem' }}>{a.question}</div>
                  <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{a.answer}</div>
                </div>
              )) : (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>No answers saved yet. Go to Settings → Job Answers to add them.</div>
              )}
            </div>
          </div>

          {/* SIGNAL Chat */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <rect x="9" y="4" width="16" height="26" rx="5" fill="url(#tl2)" />
                <circle cx="17" cy="10" r="3.5" fill="#ef4444" /><circle cx="17" cy="18" r="3.5" fill="#f59e0b" /><circle cx="17" cy="26" r="3.5" fill="#22c55e" />
                <defs><linearGradient id="tl2" x1="9" y1="4" x2="25" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#ef4444" /><stop offset="0.5" stopColor="#f59e0b" /><stop offset="1" stopColor="#22c55e" /></linearGradient></defs>
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase' }}>SIGNAL Chat</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 10, minHeight: 80, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {chatHistory.length === 0 && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>Ask CubiQo about this role, the company, how to answer a question…</div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.8)' : '#a78bfa', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, marginRight: 6 }}>{m.role === 'user' ? 'You' : 'CubiQo'}:</span>{m.content}
                </div>
              ))}
              {isChatting && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>CubiQo is thinking…</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chat}
                onChange={e => setChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about this job…"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: '0.78rem', outline: 'none'
                }}
              />
              <button onClick={handleChat} disabled={isChatting || !chat.trim()}
                style={{ background: '#7c3aed', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}>
                Ask
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{
              background: result.error ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
              border: `1px solid ${result.error ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: 12, padding: '12px 14px'
            }}>
              {result.error ? (
                <div style={{ color: '#f87171', fontSize: '0.78rem' }}>Error: {result.error}</div>
              ) : (
                <>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem' }}>
                    {result.applied ? '✓ Application submitted!' : '✓ Ready to submit — review and confirm'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', marginTop: 4 }}>
                    Platform: {result.platform} · Status: {result.status}
                  </div>
                  {result.screenshotUrl && (
                    <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', color: '#60a5fa', fontSize: '0.68rem', marginTop: 6, textDecoration: 'underline' }}>
                      View receipt screenshot →
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer apply */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>Mode:</span>
            {['review', 'submit'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  background: mode === m ? (m === 'submit' ? '#16a34a' : '#7c3aed') : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 8, padding: '4px 10px', color: '#fff',
                  fontSize: '0.65rem', cursor: 'pointer', fontWeight: mode === m ? 700 : 400
                }}>
                {m === 'review' ? 'Stage only' : 'Auto-submit'}
              </button>
            ))}
          </div>
          <button
            onClick={handleApply}
            disabled={applying || !!result?.applied}
            style={{
              flex: 1, background: applying ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #7c3aed 0%, #22c55e 100%)',
              border: 'none', borderRadius: 12, padding: '12px',
              color: applying ? 'rgba(255,255,255,0.38)' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', cursor: applying ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3, transition: 'opacity 0.2s'
            }}
          >
            {applying ? 'Applying via browser…' : result?.applied ? '✓ Done' : mode === 'submit' ? 'Apply Now ▶' : 'Stage Application ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Job Pipeline Main Component ───────────────────────────────────────────

export default function JobPipeline({ token, visible, onClose }) {
  const [pipeline, setPipeline] = useState([]);
  const [counts, setCounts] = useState({});
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
    try {
      const res = await fetch('/api/jobs/pipeline?limit=60', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPipeline(data.pipeline || []);
      setCounts(data.counts || {});
    } catch {}
    setLoading(false);
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
                BA · SM · PO · Remote-US · 24h filter
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

          {/* Jobs list */}
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto' }}>
            {loading && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: 24 }}>Loading pipeline…</div>}
            {!loading && displayed.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: 24 }}>
                {pipeline.length === 0
                  ? 'No jobs discovered yet. Click "Scan now" to find recent BA/SM/PO remote jobs.'
                  : 'No jobs in this stage.'}
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
