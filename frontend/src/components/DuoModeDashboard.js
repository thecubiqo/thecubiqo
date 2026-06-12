import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── PERSONA RESOLVER ─────────────────────────────────────────────────────────
// Maps capsule keyword/intents → persona only.
// All capsule types now use the single WorkspacePanel — no panel routing needed.

const JOB_KEYS     = ['job','career','apply','application','resume','hire','linkedin','indeed','dice','monster','workday','greenhouse','lever','ziprecruiter','wellfound','remote','ba','business analyst','scrum','scrum master','pm','po','product owner','analyst','interview','recruiter','ats','cover letter','salary','offer'];
const BUILD_KEYS   = ['build','code','ship','dev','project','deploy','product','sprint'];
const SOCIAL_KEYS  = ['post','social','instagram','linkedin','content','brand','thread','tweet'];
const WELLNESS_KEYS= ['health','wellness','yoga','journal','meditation','fitness','sleep','habit'];
const TRADE_KEYS   = ['trade','sell','buy','market','stock','shop','shopify','product','revenue'];

function resolvePersona(capsule = {}) {
  const kw       = (capsule.keyword || '').toLowerCase();
  const intents  = [...(capsule.confirmed_intents || []), ...(capsule.suggested_intents || [])].join(' ').toLowerCase();
  const combined = `${kw} ${intents}`;
  if (JOB_KEYS.some(k     => combined.includes(k))) return 'career';
  if (BUILD_KEYS.some(k   => combined.includes(k))) return 'builder';
  if (SOCIAL_KEYS.some(k  => combined.includes(k))) return 'social';
  if (WELLNESS_KEYS.some(k=> combined.includes(k))) return 'wellness';
  if (TRADE_KEYS.some(k   => combined.includes(k))) return 'trade';
  return 'general';
}

// ─── PERSONA REGISTRY ─────────────────────────────────────────────────────────

const PERSONAS = {
  career:  { emoji: '💼', label: 'Career Coach',      desc: 'ATS, LinkedIn, interviews, job market',       color: '#22c55e' },
  builder: { emoji: '🛠️', label: 'Technical PM',      desc: 'Sprints, architecture, shipping decisions',   color: '#60a5fa' },
  social:  { emoji: '📣', label: 'Social Strategist', desc: 'Posts, content calendars, audience growth',   color: '#a855f7' },
  wellness:{ emoji: '🌿', label: 'Wellness Coach',    desc: 'Reflection, habits, mental clarity',          color: '#34d399' },
  trade:   { emoji: '📈', label: 'Commerce Analyst',  desc: 'Pricing, market gaps, product-market fit',   color: '#f59e0b' },
  general: { emoji: '⚡', label: 'CubiQo',            desc: 'General assistant — adaptive to any context', color: '#e2e8f0' },
};

const PERSONA_PROMPTS = {
  career:  'You are a senior career coach and job application strategist. You know ATS optimisation, LinkedIn, interview prep, and career strategy. Be direct, tactical, and specific.',
  builder: 'You are a technical project manager and senior engineer. You help plan sprints, break down tasks, unblock technical decisions, and ship fast. Be pragmatic and concrete.',
  social:  'You are a social media strategist. You write compelling posts, build content calendars, and grow audiences. Be creative and punchy.',
  wellness:'You are a mindful wellness coach. You help reflect on journal entries, build habits, and improve mental clarity. Be warm and grounding.',
  trade:   'You are a sharp e-commerce and trading analyst. You spot market opportunities, analyse product-market fit, and help with pricing. Be data-driven and decisive.',
  general: 'You are CubiQo — an intelligent personal assistant. You help the user think clearly, plan well, and execute on whatever they are working on. Be adaptive and helpful.',
};

// ─── COLOR MAP ────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  green:  { hex: '#22c55e', rgb: '34,197,94',  label: 'Green',  aura: 'rgba(34,197,94,0.12)'  },
  yellow: { hex: '#f59e0b', rgb: '245,158,11', label: 'Yellow', aura: 'rgba(245,158,11,0.12)' },
  red:    { hex: '#ef4444', rgb: '239,68,68',  label: 'Red',    aura: 'rgba(239,68,68,0.12)'  },
};

// ─── TASK STATUS COLOURS ──────────────────────────────────────────────────────

const TASK_STATUS_COLOR = {
  completed: '#22c55e', done: '#22c55e', succeeded: '#22c55e', skipped: 'rgba(255,255,255,0.2)',
  running: '#f59e0b', working: '#f59e0b', leased: '#f59e0b',
  pending: 'rgba(255,255,255,0.35)', ready: 'rgba(255,255,255,0.35)',
  draft: '#a855f7', waiting_approval: '#a855f7', awaiting_user: '#a855f7', waiting_user: '#a855f7',
  blocked: '#ef4444', failed: '#ef4444', dead_lettered: '#ef4444',
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
      {text}
    </div>
  );
}

function LoadingSpinner({ color = '#a855f7' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: color, animation: 'duo-spin 0.8s linear infinite' }} />
    </div>
  );
}

// ─── BRIEFING DISPLAY ─────────────────────────────────────────────────────────

const SEVERITY_COLOR = { high: '#ef4444', med: '#f59e0b', low: '#60a5fa' };
const EFFORT_LABEL   = { '10min': '10 min', '1hr': '1 hr', '1day': '1 day', '1week': '1 week' };

function BriefingDisplay({ briefing, onActionComplete, onDismiss }) {
  const [collapsed, setCollapsed]           = useState(false);
  const [completedIndexes, setCompletedIndexes] = useState(new Set());

  if (!briefing || briefing.status === 'not_found') return null;
  if (briefing.status === 'pending' || briefing.status === 'running') {
    return (
      <div style={{ margin: '10px 16px 0', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#a855f7', animation: 'duo-spin 0.8s linear infinite', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 700 }}>AI BRIEFING IN PROGRESS</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', marginTop: 2 }}>Researching your domain · will notify when ready</div>
        </div>
      </div>
    );
  }
  if (briefing.status !== 'ready' || !briefing.briefing) return null;
  const b = briefing.briefing;
  const handleComplete = (index) => {
    if (completedIndexes.has(index)) return;
    setCompletedIndexes(prev => new Set([...prev, index]));
    onActionComplete && onActionComplete(index);
  };
  return (
    <div style={{ margin: '10px 16px 0', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 16, overflow: 'hidden' }}>
      <div onClick={() => setCollapsed(v => !v)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: collapsed ? 'none' : '1px solid rgba(124,58,237,0.15)' }}>
        <span style={{ fontSize: '0.8rem' }}>🔍</span>
        <span style={{ color: '#a855f7', fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>AI BRIEFING</span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.58rem', marginLeft: 2 }}>· {b.domain}</span>
        <div style={{ flex: 1 }} />
        {onDismiss && <button onClick={e => { e.stopPropagation(); onDismiss(); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 4px' }}>✕</button>}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>{collapsed ? '▸' : '▾'}</span>
      </div>
      {!collapsed && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.4 }}>{b.headline}</div>
          {b.blockers?.length > 0 && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>🔴 BLOCKERS ({b.blockers.length})</div>
              {b.blockers.map((blocker, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
                  <span style={{ color: SEVERITY_COLOR[blocker.severity] || '#f59e0b', fontSize: '0.6rem', marginTop: 2, flexShrink: 0 }}>●</span>
                  <div><span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 600 }}>{blocker.title}</span><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}> — {blocker.why}</span></div>
                </div>
              ))}
            </div>
          )}
          {b.recommended_actions?.length > 0 && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>✅ NEXT STEPS</div>
              {b.recommended_actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start', opacity: completedIndexes.has(i) ? 0.4 : 1 }}>
                  <button onClick={() => handleComplete(i)} style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1, background: completedIndexes.has(i) ? '#22c55e' : 'rgba(255,255,255,0.07)', border: `1px solid ${completedIndexes.has(i) ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.55rem' }}>{completedIndexes.has(i) ? '✓' : ''}</button>
                  <div style={{ flex: 1 }}><span style={{ color: completedIndexes.has(i) ? 'rgba(255,255,255,0.3)' : '#fff', fontSize: '0.72rem', fontWeight: 600, textDecoration: completedIndexes.has(i) ? 'line-through' : 'none' }}>{action.step}</span><span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}> · {EFFORT_LABEL[action.effort] || action.effort}</span></div>
                </div>
              ))}
            </div>
          )}
          {b.open_questions?.length > 0 && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>❓ NEED YOUR ANSWER</div>
              {b.open_questions.map((q, i) => <div key={i} style={{ marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>• {q.question}</div>)}
            </div>
          )}
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', textAlign: 'center', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>Ask me anything below — briefing context is loaded ↓</div>
        </div>
      )}
    </div>
  );
}

// ─── CONNECTORS PANEL (Plugins tab) ──────────────────────────────────────────

const CONNECTORS = [
  { id: 'google',   label: 'Gmail + Calendar', emoji: '📧', route: '/api/connectors/google/auth' },
  { id: 'linkedin', label: 'LinkedIn',         emoji: '🔵', route: null },
  { id: 'shopify',  label: 'Shopify',          emoji: '🛍️',  route: '/api/connectors/shopify/auth' },
  { id: 'slack',    label: 'Slack',            emoji: '💬', route: null },
  { id: 'notion',   label: 'Notion',           emoji: '📝', route: null },
];

const PLUGINS = [
  { id: 'web_search',  label: 'Web Search',        emoji: '🔍', desc: 'Live search via Tavily / Brave',      built: true  },
  { id: 'scraper',     label: 'Content Scraper',   emoji: '📄', desc: 'Extract text from any URL',           built: true  },
  { id: 'context',     label: 'Context Engine',    emoji: '🧠', desc: 'Entities, claims, topic extraction',  built: true  },
  { id: 'job_scanner', label: 'Job Scanner',       emoji: '💼', desc: 'Scan LinkedIn / Indeed / Dice',       built: true  },
  { id: 'easy_apply',  label: 'Easy Apply',        emoji: '✍️',  desc: 'Browser-fill + submit applications', built: true  },
  { id: 'social_post', label: 'Social Poster',     emoji: '📣', desc: 'Queue posts to LinkedIn / X / IG',   built: true  },
  { id: 'file_upload', label: 'File Upload',       emoji: '📎', desc: 'Resume PDF + asset storage',         built: true  },
  { id: 'push_notify', label: 'Push Notifications',emoji: '🔔', desc: 'Web push alerts',                    built: true  },
  { id: 'video',       label: 'Video Analysis',    emoji: '🎬', desc: 'Frame capture + scene analysis',     built: false },
  { id: 'voice',       label: 'Voice I/O',         emoji: '🎙️',  desc: 'Speech synthesis + recognition',    built: false },
];

function ConnectorsPanel({ token, accent }) {
  const [connStatus, setConnStatus] = useState({});
  useEffect(() => {
    if (!token) return;
    fetch('/api/connectors/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const map = {};
        (d.connections || []).forEach(c => { if (c.platform && (c.status === 'active' || c.status === 'connected')) map[c.platform] = true; });
        setConnStatus(map);
      })
      .catch(() => null);
  }, [token]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Connectors — external services</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {CONNECTORS.map(c => {
            const connected = !!connStatus[c.id];
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: connected ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '11px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1rem' }}>{c.emoji}</span>
                  <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{c.label}</div>
                </div>
                {c.route
                  ? <a href={c.route} style={{ background: connected ? 'rgba(34,197,94,0.15)' : `${accent}22`, color: connected ? '#34d399' : accent, border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : accent + '44'}`, borderRadius: 8, padding: '4px 12px', fontSize: '0.62rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.8 }}>{connected ? '✓ Connected' : 'Connect'}</a>
                  : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.8 }}>SOON</span>
                }
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Plugins — AI capabilities</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PLUGINS.map(p => (
            <div key={p.id} style={{ background: p.built ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${p.built ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '10px 12px', opacity: p.built ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>{p.emoji}</span>
                <span style={{ color: p.built ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700 }}>{p.label}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', lineHeight: 1.35 }}>{p.desc}</div>
              <div style={{ marginTop: 6 }}><span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: p.built ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: p.built ? '#34d399' : 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{p.built ? 'Active' : 'Coming'}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QUESTION INPUT ───────────────────────────────────────────────────────────
// Inline answer widget used inside WorkspacePanel.

function QuestionInput({ questionId, projectId, token, onAnswered }) {
  const [answer, setAnswer]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!answer.trim() || !projectId || !token) return;
    setSubmitting(true);
    try {
      await fetch(`/api/duo/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: answer, question_id: questionId }),
      });
      onAnswered?.();
      setAnswer('');
    } catch {}
    setSubmitting(false);
  };
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your answer…" disabled={submitting} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 9px', color: '#fff', fontSize: '0.73rem', outline: 'none' }} />
      <button onClick={submit} disabled={submitting || !answer.trim()} style={{ padding: '6px 11px', borderRadius: 7, background: 'rgba(96,165,250,0.25)', border: '1px solid rgba(96,165,250,0.4)', color: '#fff', cursor: submitting || !answer.trim() ? 'not-allowed' : 'pointer', fontSize: '0.73rem' }}>{submitting ? '…' : 'Send'}</button>
    </div>
  );
}

// ─── WORKSPACE PANEL ──────────────────────────────────────────────────────────
// Single panel for every capsule type.
// Reads: duo_projects, duo_tasks, duo_approvals, duo_questions,
//        duo_artifacts, duo_timeline_events via /api/duo/projects/[id].

function WorkspacePanel({ workspaceData, wsLoading, token, accent, projectId, onAction }) {
  if (wsLoading && !workspaceData) return <LoadingSpinner color={accent} />;
  if (!workspaceData) return <EmptyState icon="⚡" text="Workspace loading — sign in if needed." />;

  const project   = workspaceData.project  || {};
  const tasks     = workspaceData.tasks    || [];
  const approvals = (workspaceData.approvals || []).filter(a => a.status === 'pending');
  const questions = (workspaceData.questions || []).filter(q => ['open','pending'].includes(q.status));
  const artifacts = (workspaceData.artifacts || []).filter(a => a.artifact_type !== 'view');
  const timeline  = (workspaceData.timeline  || []).slice(0, 15);

  const DONE      = new Set(['completed','done','succeeded','skipped']);
  const WORKING   = new Set(['running','working','leased']);
  const USER_WAIT = new Set(['draft','waiting_approval','awaiting_user','waiting_user']);
  const FAILED    = new Set(['failed','blocked','dead_lettered']);
  const ELIGIBLE  = new Set(['pending','ready']);

  const groups = [
    { label: 'Needs Action', list: tasks.filter(t => USER_WAIT.has(t.status)), dotColor: '#a855f7' },
    { label: 'Working',      list: tasks.filter(t => WORKING.has(t.status)),   dotColor: '#f59e0b' },
    { label: 'Pending',      list: tasks.filter(t => ELIGIBLE.has(t.status)),  dotColor: 'rgba(255,255,255,0.35)' },
    { label: 'Done',         list: tasks.filter(t => DONE.has(t.status)),      dotColor: '#22c55e' },
    { label: 'Failed',       list: tasks.filter(t => FAILED.has(t.status)),    dotColor: '#ef4444' },
  ].filter(g => g.list.length > 0);

  const approvePlan = async () => {
    if (!projectId || !token) return;
    await fetch(`/api/duo/projects/${projectId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    onAction?.();
  };

  const actOnApproval = async (approvalId, decision) => {
    if (!projectId || !token) return;
    await fetch(`/api/duo/projects/${projectId}/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ approval_id: approvalId, approval_decision: decision, message: decision === 'approved' ? '✓ Approved' : '✗ Denied' }),
    });
    onAction?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Goal + status */}
      {(project.goal || project.title) && (
        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Goal</div>
          <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4 }}>{project.goal || project.title}</div>
          {Array.isArray(project.success_criteria) && project.success_criteria.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {project.success_criteria.map((sc, i) => (
                <div key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>✓ {sc}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8, background: project.status === 'done' ? 'rgba(34,197,94,0.15)' : project.status === 'planning' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)', color: project.status === 'done' ? '#22c55e' : project.status === 'planning' ? '#a855f7' : '#f59e0b' }}>{project.status}</span>
            {project.domain && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem' }}>{project.domain}</span>}
          </div>
        </div>
      )}

      {/* Plan approval gate */}
      {project.status === 'planning' && (
        <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.07)' }}>
          <div style={{ color: '#a855f7', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Plan Ready</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', lineHeight: 1.4, marginBottom: 10 }}>CubiQo has mapped {tasks.length} task{tasks.length !== 1 ? 's' : ''}. Approve the plan to begin execution.</div>
          <button onClick={approvePlan} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>Approve Plan &amp; Start →</button>
        </div>
      )}

      {/* Pending approvals */}
      {approvals.map(a => (
        <div key={a.id} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.07)' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>⚡ Needs Approval</div>
          <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>{a.title || a.action_type || a.approval_type || 'Action approval'}</div>
          {a.risk_level && <div style={{ marginBottom: 4 }}><span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8, background: (a.risk_level === 'high' || a.risk_level === 'critical') ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: (a.risk_level === 'high' || a.risk_level === 'critical') ? '#ef4444' : '#f59e0b' }}>{a.risk_level} risk</span></div>}
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', marginBottom: 10, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{(a.action_summary || a.preview_content || '').slice(0, 350)}</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={() => actOnApproval(a.id, 'approved')} style={{ flex: 1, padding: '7px', borderRadius: 8, background: '#22c55e22', border: '1px solid #22c55e44', color: '#22c55e', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600 }}>Approve</button>
            <button onClick={() => actOnApproval(a.id, 'denied')}   style={{ flex: 1, padding: '7px', borderRadius: 8, background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600 }}>Deny</button>
          </div>
        </div>
      ))}

      {/* Open questions */}
      {questions.map(q => (
        <div key={q.id} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.05)' }}>
          <div style={{ color: '#60a5fa', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>Needs Your Answer</div>
          <div style={{ color: '#fff', fontSize: '0.77rem', fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{q.question || q.prompt || q.description}</div>
          <QuestionInput questionId={q.id} projectId={projectId} token={token} onAnswered={onAction} />
        </div>
      ))}

      {/* Task groups */}
      {groups.map(({ label, list, dotColor }) => (
        <div key={label}>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label} ({list.length})</div>
          {list.map(t => (
            <div key={t.id} style={{ padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: `1px solid ${TASK_STATUS_COLOR[t.status] || 'rgba(255,255,255,0.07)'}22`, marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: TASK_STATUS_COLOR[t.status] || 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: '0.77rem', fontWeight: 500, lineHeight: 1.3 }}>{t.title}</span>
                <span style={{ fontSize: '0.6rem', color: TASK_STATUS_COLOR[t.status] || 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Artifacts / evidence */}
      {artifacts.length > 0 && (
        <div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Evidence &amp; Output</div>
          {artifacts.slice(0, 8).map((a, i) => (
            <div key={a.id || i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                <div style={{ color: '#fff', fontSize: '0.77rem', fontWeight: 500 }}>{a.title}</div>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0 }}>{a.artifact_type}</span>
              </div>
              {a.content && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.content.slice(0, 300)}{a.content.length > 300 ? '…' : ''}</div>}
              {(a.url || a.external_url) && <a href={a.url || a.external_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.7rem', display: 'block', marginTop: 4 }}>{a.url || a.external_url}</a>}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Timeline</div>
          {timeline.map((t, i) => (
            <div key={t.id || i} style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', marginTop: 1, flexShrink: 0 }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', lineHeight: 1.4 }}>{t.message || t.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!project.goal && tasks.length === 0 && artifacts.length === 0 && (
        <EmptyState icon="⚡" text="No active workspace data yet." />
      )}
    </div>
  );
}

// ─── DUO CHAT ─────────────────────────────────────────────────────────────────
// Left-panel streaming chat.
// When projectId is known, routes to /api/duo/projects/[id]/chat (non-streaming,
// board-aware). Otherwise falls back to /api/agent/stream (persona-driven SSE).

function DuoChat({ token, persona, capsule, accentColor, projectId, onMessageSent }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const fetchSuggestions = useCallback(async (lastMsg) => {
    if (!token) return;
    try {
      const res = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule, persona, lastMessage: lastMsg }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {}
  }, [token, capsule, persona]);

  useEffect(() => {
    const greetings = {
      career:  `I've got your capsule context — **${capsule?.keyword || 'career'}**. What are we working on today?`,
      builder: `Loaded — **${capsule?.keyword || 'project'}** context is active. What are we shipping?`,
      social:  `**${capsule?.keyword || 'content'}** mode on. Want to draft a post, plan a content week, or audit what's working?`,
      wellness:`Here with you — **${capsule?.keyword || 'wellness'}** capsule active. Want to reflect, set an intention, or review a habit?`,
      trade:   `**${capsule?.keyword || 'trade'}** context loaded. Analysing opportunities, pricing, or market positioning — what do you need?`,
      general: `CubiQo ready — **${capsule?.keyword || 'general'}** mode. What are we working on?`,
    };
    setMessages([{ role: 'assistant', content: greetings[persona] || greetings.general }]);
    fetchSuggestions('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamText]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || streaming || !token) return;
    setInput('');
    setSuggestions([]);
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setStreaming(true);
    setStreamText('');

    if (projectId) {
      // Project-aware: non-streaming, board-context response
      try {
        const res = await fetch(`/api/duo/projects/${projectId}/chat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        });
        const json = await res.json();
        setMessages(m => [...m, { role: 'assistant', content: json.reply || '…' }]);
        onMessageSent?.();
        fetchSuggestions(json.reply || '');
      } catch {
        setMessages(m => [...m, { role: 'assistant', content: 'Could not reach the agent. Try again.' }]);
      } finally {
        setStreaming(false);
        setStreamText('');
        inputRef.current?.focus();
      }
    } else {
      // Generic persona-driven streaming chat (no project yet)
      const systemContext = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general}\n\nActive capsule: color=${capsule?.color || 'green'}, keyword="${capsule?.keyword || ''}", intents=[${[...(capsule?.confirmed_intents || []), ...(capsule?.suggested_intents || [])].join(', ')}].\nStay focused on this context. Be concise — max 3 short paragraphs unless more detail is explicitly needed.`;
      try {
        const res = await fetch('/api/agent/stream', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, systemContext }),
        });
        if (!res.ok || !res.body) throw new Error('Stream failed');
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            const t = line.trim();
            if (t.startsWith('0:')) { try { const chunk = JSON.parse(t.slice(2)); full += chunk; setStreamText(full); } catch {} }
          }
        }
        setMessages(m => [...m, { role: 'assistant', content: full || '…' }]);
        fetchSuggestions(full);
      } catch {
        setMessages(m => [...m, { role: 'assistant', content: 'Could not reach the agent. Try again.' }]);
      } finally {
        setStreaming(false);
        setStreamText('');
        inputRef.current?.focus();
      }
    }
  }, [input, streaming, token, persona, capsule, projectId, onMessageSent, fetchSuggestions]);

  const renderContent = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  const capsuleColor  = COLOR_MAP[capsule?.color] || COLOR_MAP.yellow;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '88%', background: m.role === 'user' ? `rgba(${capsuleColor.rgb},0.18)` : 'rgba(255,255,255,0.06)', border: `1px solid ${m.role === 'user' ? capsuleColor.hex + '44' : 'rgba(255,255,255,0.1)'}`, borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 13px', color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.88)', fontSize: '0.8rem', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}
        {streaming && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '88%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px 16px 16px 4px', padding: '10px 13px', color: 'rgba(255,255,255,0.88)', fontSize: '0.8rem', lineHeight: 1.55 }}>
              {streamText
                ? <span dangerouslySetInnerHTML={{ __html: renderContent(streamText) }} />
                : <span style={{ color: 'rgba(255,255,255,0.35)' }}>thinking…</span>}
              {!projectId && <span style={{ display: 'inline-block', width: 2, height: '0.85em', background: accentColor, marginLeft: 2, verticalAlign: 'middle', animation: 'duo-blink 0.9s step-end infinite' }} />}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${accentColor}44`, borderRadius: 20, padding: '5px 11px', color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Ask about ${capsule?.keyword || 'this'}…`} rows={2} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${accentColor}44`, borderRadius: 12, padding: '9px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', resize: 'none', lineHeight: 1.5 }} />
          <button onClick={() => send()} disabled={!input.trim() || streaming} style={{ width: 40, height: 40, flexShrink: 0, background: input.trim() && !streaming ? accentColor : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 12, color: '#fff', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'background 0.2s' }}>↑</button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', marginTop: 5, textAlign: 'right' }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// Props:
//   capsule      — { color, keyword, confirmed_intents, suggested_intents, signal? }
//   token        — Supabase session JWT (null = logged out, limited UI)
//   projectId    — pre-resolved duo_projects.id from App.js (may be null → create on mount)
//   onClose      — dismiss handler

export default function DuoModeDashboard({ capsule, token, projectId: projectIdProp, onClose }) {
  const color    = COLOR_MAP[capsule?.color] || COLOR_MAP.yellow;
  const persona0 = resolvePersona(capsule);

  const [persona, setPersona]             = useState(persona0);
  const [activeTab, setActiveTab]         = useState('workspace');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  // Briefing (optional, shown when signal_id is on the capsule)
  const [briefing, setBriefing]                   = useState(null);
  const [briefingDismissed, setBriefingDismissed] = useState(false);

  // Workspace live data
  const [workspaceData, setWorkspaceData] = useState(null);
  const [wsLoading, setWsLoading]         = useState(true);
  // Ref to avoid re-triggering the init effect when the project ID resolves.
  const resolvedProjectId = useRef(projectIdProp || null);

  // On mount: create project if needed, then poll every 8 s.
  useEffect(() => {
    if (!token) { setWsLoading(false); return; }
    let cancelled = false;
    let interval  = null;

    const refresh = async () => {
      const pid = resolvedProjectId.current;
      if (cancelled || !pid) return;
      try {
        const res  = await fetch(`/api/duo/projects/${pid}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!cancelled && !json.error) setWorkspaceData(json);
      } catch {}
      if (!cancelled) setWsLoading(false);
    };

    const init = async () => {
      let pid = resolvedProjectId.current;
      if (!pid) {
        const goal = capsule?.keyword || capsule?.label || capsule?.color || 'Capsule';
        try {
          const res  = await fetch('/api/duo/projects', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal }),
          });
          const json = await res.json();
          if (json.project?.id) { pid = json.project.id; resolvedProjectId.current = pid; }
        } catch {}
      }
      if (pid) {
        await refresh();
        interval = setInterval(refresh, 8000);
      } else {
        setWsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; if (interval) clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // intentionally omits capsule — captured via ref

  // Optional briefing fetch (only when signal_id is present on the capsule)
  useEffect(() => {
    const signalId = capsule?.signal?.id || capsule?.signal_id;
    if (!signalId || !token) return;
    let cancelled = false;
    let pollTimer = null;
    const fetchBriefing = () => {
      fetch(`/api/capsule-briefing/${signalId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (cancelled) return;
          setBriefing(data);
          if (data.status === 'pending' || data.status === 'running') pollTimer = setTimeout(fetchBriefing, 5000);
        })
        .catch(() => null);
    };
    fetchBriefing();
    return () => { cancelled = true; if (pollTimer) clearTimeout(pollTimer); };
  }, [capsule?.signal?.id, capsule?.signal_id, token]);

  const handleBriefingActionComplete = (actionIndex) => {
    const signalId = capsule?.signal?.id || capsule?.signal_id;
    if (!signalId || !token) return;
    fetch(`/api/capsule-briefing/${signalId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_index: actionIndex }),
    }).catch(() => null);
  };

  // Immediate workspace refresh after a board action (approval, question answer, etc.)
  const triggerRefresh = useCallback(async () => {
    const pid = resolvedProjectId.current;
    if (!pid || !token) return;
    try {
      const res  = await fetch(`/api/duo/projects/${pid}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.error) setWorkspaceData(json);
    } catch {}
  }, [token]);

  const activePersona = PERSONAS[persona] || PERSONAS.general;
  if (!capsule) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', display: 'flex', flexDirection: 'column', animation: 'duo-fadeIn 0.22s ease-out' }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{ height: 58, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', background: `linear-gradient(90deg, ${color.aura} 0%, rgba(0,0,0,0) 50%)`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, position: 'relative' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color.hex, boxShadow: `0 0 12px ${color.hex}` }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: '0.95rem', letterSpacing: 2, textTransform: 'uppercase', fontStyle: 'italic' }}>DUO</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 2, textTransform: 'uppercase' }}>MODE</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>·</span>
          <span style={{ color: color.hex, fontWeight: 700, fontSize: '0.82rem', textTransform: 'capitalize' }}>{capsule?.keyword || color.label}</span>
          {(capsule?.confirmed_intents || []).map(intent => (
            <span key={intent} style={{ background: `${color.hex}22`, color: color.hex, fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8 }}>{intent}</span>
          ))}
        </div>
        <div style={{ flex: 1 }} />

        {/* Persona pill */}
        <button onClick={() => setShowPersonaPicker(v => !v)} title="Switch AI personality" style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${activePersona.color}18`, border: `1px solid ${activePersona.color}44`, borderRadius: 20, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
          <span style={{ fontSize: '0.85rem' }}>{activePersona.emoji}</span>
          <span style={{ color: activePersona.color, fontSize: '0.65rem', fontWeight: 700 }}>{activePersona.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>▾</span>
        </button>
        {showPersonaPicker && (
          <div style={{ position: 'absolute', top: 52, right: 60, zIndex: 10, background: 'rgba(10,8,24,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 8, width: 230, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.58rem', letterSpacing: 2, textTransform: 'uppercase', padding: '4px 8px 8px', fontWeight: 700 }}>AI Personality — auto-assigned · tap to override</div>
            {Object.entries(PERSONAS).map(([key, p]) => (
              <button key={key} onClick={() => { setPersona(key); setShowPersonaPicker(false); }} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, background: persona === key ? `${p.color}18` : 'transparent', border: `1px solid ${persona === key ? p.color + '44' : 'transparent'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', marginBottom: 4, textAlign: 'left' }}>
                <span style={{ fontSize: '1rem', marginTop: 1 }}>{p.emoji}</span>
                <div>
                  <div style={{ color: persona === key ? p.color : '#fff', fontWeight: 700, fontSize: '0.75rem' }}>{p.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', marginTop: 2 }}>{p.desc}</div>
                </div>
                {persona === key && <span style={{ color: p.color, marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[{ key: 'chat', label: 'Chat' }, { key: 'workspace', label: 'Workspace' }, { key: 'plugins', label: '⚡ Plugins' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ background: activeTab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 9px', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.62rem', cursor: 'pointer', fontWeight: 600 }}>{t.label}</button>
          ))}
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: 34, height: 34, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>✕</button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Left: Chat */}
        <div style={{ width: 'min(400px, 100%)', flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, #7c3aed, ${activePersona.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{activePersona.emoji}</div>
            <div>
              <div style={{ color: activePersona.color, fontSize: '0.72rem', fontWeight: 700 }}>{activePersona.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>auto-assigned · tap persona to switch</div>
            </div>
          </div>
          {!briefingDismissed && (
            <BriefingDisplay briefing={briefing} onActionComplete={handleBriefingActionComplete} onDismiss={() => setBriefingDismissed(true)} />
          )}
          <DuoChat
            key={persona}
            token={token}
            persona={persona}
            capsule={capsule}
            accentColor={activePersona.color}
            projectId={resolvedProjectId.current}
            onMessageSent={triggerRefresh}
          />
        </div>

        {/* Right: Workspace or Plugins */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 18px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>
              {activeTab === 'plugins' ? 'Connectors & Plugins' : 'Goal Workspace'}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {wsLoading && !workspaceData && (
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: color.hex, animation: 'duo-spin 0.8s linear infinite' }} />
              )}
              <span style={{ background: `${color.hex}22`, color: color.hex, fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{color.label}</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {activeTab === 'plugins'
              ? <ConnectorsPanel token={token} accent={color.hex} />
              : <WorkspacePanel
                  workspaceData={workspaceData}
                  wsLoading={wsLoading}
                  token={token}
                  accent={color.hex}
                  projectId={resolvedProjectId.current}
                  onAction={triggerRefresh}
                />
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes duo-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes duo-spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes duo-blink  { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
