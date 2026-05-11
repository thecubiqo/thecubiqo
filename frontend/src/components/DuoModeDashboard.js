import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT RESOLVER
// Maps capsule (color + keyword + intent) → panel type + AI persona
// ─────────────────────────────────────────────────────────────────────────────

const JOB_KEYS   = [
  'job', 'career', 'apply', 'application', 'resume', 'hire',
  'linkedin', 'indeed', 'dice', 'monster', 'workday', 'greenhouse',
  'lever', 'ziprecruiter', 'wellfound', 'remote', 'ba', 'business analyst',
  'scrum', 'scrum master', 'pm', 'po', 'product owner', 'analyst',
  'interview', 'recruiter', 'ats', 'cover letter', 'salary', 'offer'
];
const BUILD_KEYS = ['build', 'code', 'ship', 'dev', 'project', 'deploy', 'product', 'sprint'];
const SOCIAL_KEYS = ['post', 'social', 'instagram', 'linkedin', 'content', 'brand', 'thread', 'tweet'];
const WELLNESS_KEYS = ['health', 'wellness', 'yoga', 'journal', 'meditation', 'fitness', 'sleep', 'habit'];
const TRADE_KEYS = ['trade', 'sell', 'buy', 'market', 'stock', 'shop', 'shopify', 'product', 'revenue'];

function resolveContext(capsule = {}) {
  const kw = (capsule.keyword || '').toLowerCase();
  const intents = [
    ...(capsule.confirmed_intents || []),
    ...(capsule.suggested_intents || [])
  ].join(' ').toLowerCase();
  const combined = `${kw} ${intents}`;

  if (JOB_KEYS.some(k => combined.includes(k)))     return { panel: 'jobs',     persona: 'career' };
  if (BUILD_KEYS.some(k => combined.includes(k)))   return { panel: 'tasks',    persona: 'builder' };
  if (SOCIAL_KEYS.some(k => combined.includes(k)))  return { panel: 'social',   persona: 'social' };
  if (WELLNESS_KEYS.some(k => combined.includes(k)))return { panel: 'journal',  persona: 'wellness' };
  if (TRADE_KEYS.some(k => combined.includes(k)))   return { panel: 'trade',    persona: 'trade' };
  return { panel: 'generic', persona: 'general' };
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONA REGISTRY — visible, switchable, auto-assigned from capsule context
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAS = {
  career:   { emoji: '💼', label: 'Career Coach',       desc: 'ATS, LinkedIn, interviews, job market',         color: '#22c55e' },
  builder:  { emoji: '🛠️',  label: 'Technical PM',       desc: 'Sprints, architecture, shipping decisions',     color: '#60a5fa' },
  social:   { emoji: '📣', label: 'Social Strategist',  desc: 'Posts, content calendars, audience growth',     color: '#a855f7' },
  wellness: { emoji: '🌿', label: 'Wellness Coach',     desc: 'Reflection, habits, mental clarity',            color: '#34d399' },
  trade:    { emoji: '📈', label: 'Commerce Analyst',   desc: 'Pricing, market gaps, product-market fit',      color: '#f59e0b' },
  general:  { emoji: '⚡', label: 'CubiQo',             desc: 'General assistant — adaptive to any context',   color: '#e2e8f0' },
};

const PERSONA_PROMPTS = {
  career:   'You are a senior career coach and job application strategist. You know ATS optimisation, LinkedIn, interview prep, and career strategy across any industry or role. Be direct, tactical, and specific.',
  builder:  'You are a technical project manager and senior engineer. You help plan sprints, break down tasks, unblock technical decisions, and ship fast. Be pragmatic and concrete.',
  social:   'You are a social media strategist. You write compelling posts, build content calendars, and grow audiences on LinkedIn, Instagram, and X. Be creative and punchy.',
  wellness: 'You are a mindful wellness coach. You help reflect on journal entries, build habits, and improve mental clarity. Be warm, thoughtful, and grounding.',
  trade:    'You are a sharp e-commerce and trading analyst. You spot market opportunities, analyse product-market fit, and help with pricing and sales strategy. Be data-driven and decisive.',
  general:  'You are CubiQo — an intelligent personal assistant. You help the user think clearly, plan well, and execute on whatever they are working on. Be adaptive and helpful.',
};

const PANEL_TITLES = {
  jobs:    'Job Pipeline',
  tasks:   'Task Board',
  social:  'Social Queue',
  journal: 'Journal Stream',
  trade:   'Trade Board',
  generic: 'Activity',
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MAP
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  green:  { hex: '#22c55e', rgb: '34,197,94',   label: 'Green',  aura: 'rgba(34,197,94,0.12)' },
  yellow: { hex: '#f59e0b', rgb: '245,158,11',  label: 'Yellow', aura: 'rgba(245,158,11,0.12)' },
  red:    { hex: '#ef4444', rgb: '239,68,68',   label: 'Red',    aura: 'rgba(239,68,68,0.12)' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT PANELS — each fetches its own data, renders as a card list
// ─────────────────────────────────────────────────────────────────────────────

function PanelCard({ children, accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent || 'rgba(255,255,255,0.09)'}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 8
    }}>{children}</div>
  );
}

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
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `2px solid rgba(255,255,255,0.1)`,
        borderTopColor: color,
        animation: 'duo-spin 0.8s linear infinite'
      }} />
    </div>
  );
}

// Jobs panel
function JobsPanel({ token, accent }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/jobs/pipeline?limit=20', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setJobs(d.pipeline || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  const STATUS_COLOR = { discovered:'#60a5fa', tailoring:'#f59e0b', ready:'#34d399', applying:'#a78bfa', submitted:'#34d399', failed:'#f87171', interview:'#fbbf24' };

  if (loading) return <LoadingSpinner color={accent} />;
  if (!jobs.length) return <EmptyState icon="💼" text="No jobs in pipeline. Scan to discover new listings." />;

  return (
    <div>
      {jobs.map(j => (
        <PanelCard key={j.id} accent={`${STATUS_COLOR[j.status] || '#60a5fa'}33`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', marginTop: 2 }}>{j.company} · {j.platform}</div>
            </div>
            <span style={{ flexShrink: 0, background: `${STATUS_COLOR[j.status] || '#60a5fa'}22`, color: STATUS_COLOR[j.status] || '#60a5fa', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8 }}>{j.status}</span>
          </div>
          {j.atsScore != null && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${j.atsScore}%`, background: j.atsScore >= 85 ? '#34d399' : j.atsScore >= 70 ? '#f59e0b' : '#f87171', borderRadius: 9999 }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.62rem' }}>{j.atsScore}% ATS</span>
            </div>
          )}
        </PanelCard>
      ))}
    </div>
  );
}

// Tasks panel
function TasksPanel({ token, accent }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/tasks?limit=20', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTasks(d.tasks || d.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner color={accent} />;
  if (!tasks.length) return <EmptyState icon="✅" text="No tasks yet. Tell CubiQo what you're working on." />;

  return (
    <div>
      {tasks.map((t, i) => (
        <PanelCard key={t.id || i} accent={t.status === 'done' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.9rem', marginTop: 1 }}>{t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔄' : '⬜'}</span>
            <div>
              <div style={{ color: t.status === 'done' ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: '0.82rem', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title || t.task}</div>
              {t.due_date && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', marginTop: 3 }}>Due {new Date(t.due_date).toLocaleDateString()}</div>}
            </div>
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

// Social queue panel
function SocialPanel({ token, accent }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/actions/social-post-queue?limit=15', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPosts(d.posts || d.queue || d.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner color={accent} />;
  if (!posts.length) return <EmptyState icon="📢" text="No queued posts. Ask CubiQo to draft something." />;

  const PLT = { linkedin: '🔵', instagram: '📸', twitter: '🐦', threads: '🧵', x: '🐦' };

  return (
    <div>
      {posts.map((p, i) => (
        <PanelCard key={p.id || i} accent="rgba(168,85,247,0.2)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>{PLT[p.platform] || '🌐'} {p.platform}</span>
            <span style={{ color: p.status === 'published' ? '#34d399' : p.status === 'scheduled' ? '#f59e0b' : '#a78bfa', fontSize: '0.6rem', fontWeight: 700 }}>{p.status}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.content || p.body || p.text}
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

// Journal panel
function JournalPanel({ token, accent }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/journal?limit=10', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setEntries(d.entries || d.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner color={accent} />;
  if (!entries.length) return <EmptyState icon="📓" text="No journal entries yet. Start writing." />;

  return (
    <div>
      {entries.map((e, i) => (
        <PanelCard key={e.id || i} accent="rgba(251,191,36,0.15)">
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', marginBottom: 5 }}>
            {new Date(e.created_at || e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {e.content || e.entry || e.body}
          </div>
        </PanelCard>
      ))}
    </div>
  );
}

// Generic / Trade panel — shows recent action approvals
function GenericPanel({ token, accent }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/actions?limit=15', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(d.approvals || d.actions || d.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner color={accent} />;
  if (!items.length) return <EmptyState icon="⚡" text="No recent activity. Ask CubiQo to do something." />;

  return (
    <div>
      {items.map((a, i) => (
        <PanelCard key={a.id || i} accent={accent + '33'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{a.title || a.tool_name || a.action_type}</div>
            <span style={{ color: a.status === 'approved' ? '#34d399' : a.status === 'rejected' ? '#f87171' : '#f59e0b', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>{a.status}</span>
          </div>
          {a.summary && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', marginTop: 4, lineHeight: 1.4 }}>{a.summary}</div>}
        </PanelCard>
      ))}
    </div>
  );
}

// ── Connectors + Plugins panel ─────────────────────────────────────────────
const CONNECTORS = [
  { id: 'google',   label: 'Gmail + Calendar', emoji: '📧', route: '/api/connectors/google/auth',    checkRoute: '/api/connectors/google/gmail?action=list' },
  { id: 'linkedin', label: 'LinkedIn',         emoji: '🔵', route: null,                              checkRoute: null },
  { id: 'shopify',  label: 'Shopify',          emoji: '🛍️',  route: '/api/connectors/shopify/auth',   checkRoute: '/api/connectors/shopify/status' },
  { id: 'slack',    label: 'Slack',            emoji: '💬', route: null,                              checkRoute: null },
  { id: 'notion',   label: 'Notion',           emoji: '📝', route: null,                              checkRoute: null },
];

const PLUGINS = [
  { id: 'web_search',   label: 'Web Search',       emoji: '🔍', desc: 'Live search via Tavily / Brave',      built: true  },
  { id: 'scraper',      label: 'Content Scraper',   emoji: '📄', desc: 'Extract text from any URL',           built: true  },
  { id: 'context',      label: 'Context Engine',    emoji: '🧠', desc: 'Entities, claims, topic extraction',  built: true  },
  { id: 'job_scanner',  label: 'Job Scanner',       emoji: '💼', desc: 'Scan LinkedIn / Indeed / Dice',       built: true  },
  { id: 'easy_apply',   label: 'Easy Apply',        emoji: '✍️',  desc: 'Browser-fill + submit applications',  built: true  },
  { id: 'social_post',  label: 'Social Poster',     emoji: '📣', desc: 'Queue posts to LinkedIn / X / IG',    built: true  },
  { id: 'file_upload',  label: 'File Upload',       emoji: '📎', desc: 'Resume PDF + asset storage',          built: true  },
  { id: 'push_notify',  label: 'Push Notifications',emoji: '🔔', desc: 'Web push alerts',                     built: true  },
  { id: 'video',        label: 'Video Analysis',    emoji: '🎬', desc: 'Frame capture + scene analysis',      built: false },
  { id: 'voice',        label: 'Voice I/O',         emoji: '🎙️',  desc: 'Speech synthesis + recognition',     built: false },
];

function ConnectorsPanel({ token, accent }) {
  const [connStatus, setConnStatus] = useState({});

  useEffect(() => {
    if (!token) return;
    fetch('/api/connectors/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        // API returns { connections: [{ platform, status, ... }] }
        // Build a map: { google: true, shopify: true, ... }
        const map = {};
        (d.connections || []).forEach(c => {
          if (c.platform && (c.status === 'active' || c.status === 'connected')) {
            map[c.platform] = true;
          }
        });
        setConnStatus(map);
      })
      .catch(() => null);
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Connectors */}
      <div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          Connectors — external services
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {CONNECTORS.map(c => {
            const connected = !!connStatus[c.id];
            return (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: connected ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '11px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1rem' }}>{c.emoji}</span>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{c.label}</div>
                  </div>
                </div>
                {c.route ? (
                  <a href={c.route} style={{
                    background: connected ? 'rgba(34,197,94,0.15)' : `${accent}22`,
                    color: connected ? '#34d399' : accent,
                    border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : accent + '44'}`,
                    borderRadius: 8, padding: '4px 12px',
                    fontSize: '0.62rem', fontWeight: 700, textDecoration: 'none',
                    textTransform: 'uppercase', letterSpacing: 0.8
                  }}>{connected ? '✓ Connected' : 'Connect'}</a>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: 0.8 }}>SOON</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plugins */}
      <div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          Plugins — AI capabilities
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PLUGINS.map(p => (
            <div key={p.id} style={{
              background: p.built ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${p.built ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 12, padding: '10px 12px',
              opacity: p.built ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '0.85rem' }}>{p.emoji}</span>
                <span style={{ color: p.built ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 700 }}>{p.label}</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', lineHeight: 1.35 }}>{p.desc}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: p.built ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                  color: p.built ? '#34d399' : 'rgba(255,255,255,0.3)',
                  letterSpacing: 0.8, textTransform: 'uppercase'
                }}>{p.built ? 'Active' : 'Coming'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PANEL_COMPONENTS = {
  jobs:    JobsPanel,
  tasks:   TasksPanel,
  social:  SocialPanel,
  journal: JournalPanel,
  trade:   GenericPanel,
  generic: GenericPanel,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED AI CHAT — streaming, context-aware
// ─────────────────────────────────────────────────────────────────────────────

function DuoChat({ token, persona, capsule, accentColor }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchSuggestions = useCallback(async (lastMsg) => {
    if (!token) return;
    try {
      const res = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ capsule, persona, lastMessage: lastMsg })
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
    } catch {}
  }, [token, capsule, persona]);

  // Greeting on mount
  useEffect(() => {
    const greetings = {
      career:   `I've got your capsule context — **${capsule.keyword || 'career'}**. What are we working on today? Apply to a specific role, prep for an interview, or optimise your resume?`,
      builder:  `Loaded — **${capsule.keyword || 'project'}** context is active. What are we shipping? I can break down tasks, unblock a decision, or plan a sprint.`,
      social:   `**${capsule.keyword || 'content'}** mode on. Want to draft a post, plan a content week, or audit what's working?`,
      wellness: `Here with you — **${capsule.keyword || 'wellness'}** capsule active. Want to reflect on something, set an intention, or review a habit?`,
      trade:    `**${capsule.keyword || 'trade'}** context loaded. Analysing opportunities, pricing strategy, or market positioning — what do you need?`,
      general:  `CubiQo ready — **${capsule.keyword || 'general'}** mode. What are we working on?`,
    };
    setMessages([{ role: 'assistant', content: greetings[persona] || greetings.general }]);
    fetchSuggestions('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || !token) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setStreaming(true);
    setStreamText('');

    const systemContext = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general}

Active capsule: color=${capsule.color || 'green'}, keyword="${capsule.keyword || ''}", intents=[${[...(capsule.confirmed_intents||[]), ...(capsule.suggested_intents||[])].join(', ')}].
Stay focused on this context. Be concise — max 3 short paragraphs unless more detail is explicitly needed.`;

    try {
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, systemContext })
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
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
          if (t.startsWith('0:')) {
            try { const chunk = JSON.parse(t.slice(2)); full += chunk; setStreamText(full); } catch {}
          }
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
  }, [input, streaming, token, persona, capsule, fetchSuggestions]);

  const renderContent = (text) => {
    // minimal markdown — bold and line breaks
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              background: m.role === 'user' ? `rgba(${COLOR_MAP[capsule.color]?.rgb || '34,197,94'},0.18)` : 'rgba(255,255,255,0.06)',
              border: `1px solid ${m.role === 'user' ? (COLOR_MAP[capsule.color]?.hex || '#22c55e') + '44' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '10px 13px',
              color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,0.88)',
              fontSize: '0.8rem',
              lineHeight: 1.55,
            }} dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
          </div>
        ))}

        {/* streaming bubble */}
        {streaming && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px 16px 16px 4px', padding: '10px 13px',
              color: 'rgba(255,255,255,0.88)', fontSize: '0.8rem', lineHeight: 1.55
            }}>
              {streamText
                ? <span dangerouslySetInnerHTML={{ __html: renderContent(streamText) }} />
                : <span style={{ color: 'rgba(255,255,255,0.35)' }}>thinking…</span>
              }
              <span style={{
                display: 'inline-block', width: 2, height: '0.85em',
                background: accentColor, marginLeft: 2, verticalAlign: 'middle',
                animation: 'duo-blink 0.9s step-end infinite'
              }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => {
                setSuggestions([]);
                setInput(s);
                // send directly with this suggestion text
                if (streaming || !token) return;
                setInput('');
                setMessages(m => [...m, { role: 'user', content: s }]);
                setStreaming(true);
                setStreamText('');
                const systemContext = `${PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general}

Active capsule: color=${capsule.color || 'green'}, keyword="${capsule.keyword || ''}", intents=[${[...(capsule.confirmed_intents||[]), ...(capsule.suggested_intents||[])].join(', ')}].
Stay focused on this context. Be concise — max 3 short paragraphs unless more detail is explicitly needed.`;
                fetch('/api/agent/stream', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message: s, systemContext })
                }).then(async res => {
                  if (!res.ok || !res.body) throw new Error('Stream failed');
                  const reader = res.body.getReader();
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
                      if (t.startsWith('0:')) {
                        try { const chunk = JSON.parse(t.slice(2)); full += chunk; setStreamText(full); } catch {}
                      }
                    }
                  }
                  setMessages(m => [...m, { role: 'assistant', content: full || '…' }]);
                  fetchSuggestions(full);
                }).catch(() => {
                  setMessages(m => [...m, { role: 'assistant', content: 'Could not reach the agent. Try again.' }]);
                }).finally(() => {
                  setStreaming(false);
                  setStreamText('');
                  inputRef.current?.focus();
                });
              }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${accentColor}44`,
                  borderRadius: 20, padding: '5px 11px',
                  color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = `${accentColor}22`; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >{s}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${capsule.keyword || 'this'}…`}
            rows={2}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${accentColor}44`,
              borderRadius: 12, padding: '9px 12px',
              color: '#fff', fontSize: '0.8rem',
              outline: 'none', resize: 'none', lineHeight: 1.5
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            style={{
              width: 40, height: 40, flexShrink: 0,
              background: input.trim() && !streaming ? accentColor : 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 12,
              color: '#fff', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'background 0.2s'
            }}
          >↑</button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', marginTop: 5, textAlign: 'right' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DuoModeDashboard({ capsule, token, onClose }) {
  const resolved = resolveContext(capsule);
  const color = COLOR_MAP[capsule?.color] || COLOR_MAP.yellow;

  // Persona is state — auto-assigned from context, manually overridable
  const [persona, setPersona] = useState(resolved.persona);
  const [panel] = useState(resolved.panel);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'board' | 'plugins'
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  const PanelComponent = PANEL_COMPONENTS[panel] || GenericPanel;
  const activePersona = PERSONAS[persona] || PERSONAS.general;

  if (!capsule) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex', flexDirection: 'column',
      animation: 'duo-fadeIn 0.22s ease-out'
    }}>
      {/* ── Top bar ── */}
      <div style={{
        height: 58, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: `linear-gradient(90deg, ${color.aura} 0%, rgba(0,0,0,0) 50%)`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12, position: 'relative'
      }}>
        {/* Capsule dot */}
        <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: color.hex, boxShadow: `0 0 12px ${color.hex}` }} />

        {/* DUO MODE wordmark + keyword */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: '0.95rem', letterSpacing: 2, textTransform: 'uppercase', fontStyle: 'italic' }}>DUO</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', letterSpacing: 2, textTransform: 'uppercase' }}>MODE</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>·</span>
          <span style={{ color: color.hex, fontWeight: 700, fontSize: '0.82rem', textTransform: 'capitalize' }}>{capsule.keyword || color.label}</span>
          {capsule.confirmed_intents?.map(intent => (
            <span key={intent} style={{ background: `${color.hex}22`, color: color.hex, fontSize: '0.55rem', fontWeight: 700, padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8 }}>{intent}</span>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Persona pill — click to switch */}
        <button
          onClick={() => setShowPersonaPicker(v => !v)}
          title="Switch AI personality"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: `${activePersona.color}18`,
            border: `1px solid ${activePersona.color}44`,
            borderRadius: 20, padding: '4px 10px',
            cursor: 'pointer', flexShrink: 0
          }}
        >
          <span style={{ fontSize: '0.85rem' }}>{activePersona.emoji}</span>
          <span style={{ color: activePersona.color, fontSize: '0.65rem', fontWeight: 700 }}>{activePersona.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>▾</span>
        </button>

        {/* Persona picker dropdown */}
        {showPersonaPicker && (
          <div style={{
            position: 'absolute', top: 52, right: 60, zIndex: 10,
            background: 'rgba(10,8,24,0.98)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: 8, width: 230,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.58rem', letterSpacing: 2, textTransform: 'uppercase', padding: '4px 8px 8px', fontWeight: 700 }}>
              AI Personality — auto-assigned · tap to override
            </div>
            {Object.entries(PERSONAS).map(([key, p]) => (
              <button key={key} onClick={() => { setPersona(key); setShowPersonaPicker(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: persona === key ? `${p.color}18` : 'transparent',
                  border: `1px solid ${persona === key ? p.color + '44' : 'transparent'}`,
                  borderRadius: 10, padding: '8px 10px', cursor: 'pointer', marginBottom: 4, textAlign: 'left'
                }}>
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
          {[{ key: 'chat', label: 'Chat' }, { key: 'board', label: 'Board' }, { key: 'plugins', label: '⚡ Plugins' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                background: activeTab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                padding: '4px 9px', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '0.62rem', cursor: 'pointer', fontWeight: 600
              }}>{t.label}</button>
          ))}
        </div>

        {/* Close */}
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: 34, height: 34, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>✕</button>
      </div>

      {/* ── Body — two-column on desktop, tab-switched on mobile ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* LEFT: Specialized AI Chat */}
        <div style={{
          width: 'min(400px, 100%)',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column',
          // On narrow screens, show only active tab
          ...(window.innerWidth < 760 ? { display: activeTab === 'chat' ? 'flex' : 'none', width: '100%' } : {})
        }}>
          {/* Chat header — shows active persona */}
          <div style={{
            padding: '10px 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, #7c3aed, ${activePersona.color})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem'
            }}>{activePersona.emoji}</div>
            <div>
              <div style={{ color: activePersona.color, fontSize: '0.72rem', fontWeight: 700 }}>{activePersona.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>auto-assigned from capsule · tap persona to switch</div>
            </div>
          </div>

          <DuoChat
            key={persona}
            token={token}
            persona={persona}
            capsule={capsule}
            accentColor={activePersona.color}
          />
        </div>

        {/* RIGHT: Dynamic content board OR plugins panel */}
        <div style={{
          flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          ...(window.innerWidth < 760 ? { display: (activeTab === 'board' || activeTab === 'plugins') ? 'flex' : 'none' } : {})
        }}>
          {/* Board header */}
          <div style={{
            padding: '10px 18px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>
              {activeTab === 'plugins' ? 'Connectors & Plugins' : (PANEL_TITLES[panel] || 'Activity')}
            </span>
            <span style={{
              background: `${color.hex}22`, color: color.hex,
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999
            }}>{color.label}</span>
          </div>

          {/* Scrollable board */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {activeTab === 'plugins'
              ? <ConnectorsPanel token={token} accent={color.hex} />
              : <PanelComponent token={token} accent={color.hex} capsule={capsule} />
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes duo-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes duo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes duo-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
