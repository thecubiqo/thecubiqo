import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import CubiQoVisual from "./components/CubiQoVisual";
import ParticleWaveHD from "./components/ParticleWaveHD";
import { Menu, Activity, X, Mail, Lock, Send, Plus, Volume2, Moon, Sun, Minus, User, LogOut, LayoutDashboard, BookOpen, Briefcase, Rocket, ShoppingBag, Code2, ShieldCheck, Globe2, Camera, Fingerprint, Bot, Search } from "lucide-react";
import { supabase } from "./lib/supabase";

const SignalIcon = ({ size = 18 }) => (
  <img
    src="/assets/rgy-signal-mark.png"
    alt=""
    aria-hidden="true"
    style={{
      display: 'block',
      height: size * 1.55,
      width: 'auto',
      objectFit: 'contain',
      filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.12))'
    }}
  />
);

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div data-testid="landing-page" className="landing-page" onClick={() => navigate('/app')}>
      <div className="landing-visual" aria-hidden="true">
        <ParticleWaveHD isVoiceMode={false} presentation="landing" />
      </div>
      <div className="landing-lockup">
        <h1 className="landing-title">CubiQo</h1>
        <p className="landing-subtitle">One Mind. Many Dimensions.</p>
      </div>
      <p className="landing-entry">Tap anywhere to begin</p>
    </div>
  );
};

const VISITOR_MEMORY_KEY = 'cubiqo_visit_memory_v1';
const MEMORY_EVENT_LIMIT = 10;

const readVisitorMemory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(VISITOR_MEMORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-MEMORY_EVENT_LIMIT) : [];
  } catch {
    return [];
  }
};

const writeVisitorMemory = (events) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VISITOR_MEMORY_KEY, JSON.stringify(events.slice(-MEMORY_EVENT_LIMIT)));
};

const memoryEventsToHistory = (events = []) => events
  .slice(-6)
  .flatMap(event => [
    { role: 'user', content: event.user_message || event.userMessage || '' },
    { role: 'assistant', content: event.assistant_response || event.assistantResponse || '' }
  ])
  .filter(item => item.content);

const normalizeKeywordRows = (keywords = {}, userId) => Object.entries(keywords)
  .flatMap(([color, words]) => (Array.isArray(words) ? words : []).map(keyword => ({
    user_id: userId,
    color,
    keyword: String(keyword).slice(0, 80),
    source: 'conversation',
    metadata: { captured_by: 'cubiqo-client' }
  })))
  .filter(row => ['green', 'yellow', 'red'].includes(row.color) && row.keyword);

const LEGACY_FEATURES = [
  {
    id: 'auth',
    label: 'Auth + Account',
    status: 'Live',
    detail: 'Email/password auth and profile sync are wired in QA.',
    Icon: User,
    color: '#34d399'
  },
  {
    id: 'daily-journal',
    label: 'Daily Journal',
    status: 'Code ready',
    detail: 'Guided journal, local fallback, API, and migration SQL are in branch; DB migration is pending.',
    Icon: BookOpen,
    color: '#fbbf24',
    path: '/journal'
  },
  {
    id: 'dashboard',
    label: 'My Dashboard',
    status: 'Live shell',
    detail: 'Account stats, journal count fallback, and quick links are now in this QA console.',
    Icon: LayoutDashboard,
    color: '#60a5fa'
  },
  {
    id: 'job-hunter',
    label: 'Job Hunter',
    status: 'Staged',
    detail: 'Legacy UI/API/schema found. Next move is Supabase job schema plus workflow pages.',
    Icon: Briefcase,
    color: '#22c55e'
  },
  {
    id: 'launchpad',
    label: 'Website Launcher',
    status: 'Staged',
    detail: 'Legacy launchpad and site template ideas are represented; production launcher backend remains.',
    Icon: Rocket,
    color: '#38bdf8'
  },
  {
    id: 'commerce',
    label: 'Ecomm Business Pack',
    status: 'Staged',
    detail: 'Shopify/Printify/business-pack concepts found; real provider keys and workflows are not complete.',
    Icon: ShoppingBag,
    color: '#fb7185'
  },
  {
    id: 'social-army',
    label: 'Social Army 10/10/10',
    status: 'Admin gated',
    detail: 'Planner/queue should come first. Posting needs accounts, GFXToolz, proxy, and approval gates.',
    Icon: Globe2,
    color: '#f97316'
  },
  {
    id: 'agent-engine',
    label: 'Agent Engine',
    status: 'Design gated',
    detail: 'Legacy agents exist, but deploy/git/workspace isolation are incomplete. Port through tool layer.',
    Icon: Bot,
    color: '#a78bfa'
  },
  {
    id: 'coder',
    label: 'Coder / Studio',
    status: 'Sandbox gated',
    detail: 'Legacy Monaco/terminal UI exists. Current QA should start read-only before code actions.',
    Icon: Code2,
    color: '#c084fc'
  },
  {
    id: 'browser',
    label: 'Browser Automation',
    status: 'Sandbox gated',
    detail: 'Legacy Puppeteer/browser code is not Vercel-safe as-is. Needs hosted browser or sandbox.',
    Icon: Search,
    color: '#2dd4bf'
  },
  {
    id: 'self-heal',
    label: 'Self-Heal / NOC',
    status: 'Read-only first',
    detail: 'Diagnostics and reporting can move first; repair actions need owner approval.',
    Icon: ShieldCheck,
    color: '#93c5fd'
  },
  {
    id: 'biometrics-camera',
    label: 'Biometrics + Camera',
    status: 'Consent gated',
    detail: 'Legacy biometric and camera traces exist. Must be explicit opt-in with local-device privacy boundaries.',
    Icon: Fingerprint,
    color: '#facc15'
  },
  {
    id: 'camera-awareness',
    label: 'Visual Awareness',
    status: 'Consent gated',
    detail: 'Camera reaction should become a multimodal tool only after permission, purpose, and retention rules.',
    Icon: Camera,
    color: '#fb923c'
  }
];

const JournalPage = () => {
  const navigate = useNavigate();
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [responses, setResponses] = useState(["", "", "", ""]);
  const [journalStatus, setJournalStatus] = useState("");
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [savedEntry, setSavedEntry] = useState(null);
  const [journalHistory, setJournalHistory] = useState([]);
  const journalPrompts = [
    {
      label: "Signal",
      prompt: "What is the honest state of you today?",
      placeholder: "Mood, energy, focus, pressure..."
    },
    {
      label: "Moment",
      prompt: "What happened that actually mattered?",
      placeholder: "The moment, person, task, thought, or tension..."
    },
    {
      label: "Meaning",
      prompt: "What did it teach you or ask from you?",
      placeholder: "A pattern, lesson, risk, or decision..."
    },
    {
      label: "Move",
      prompt: "What is the next small move?",
      placeholder: "One clear action for tomorrow..."
    }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('cubiqo_daily_journal_latest') || 'null');
      if (stored?.createdAt) setSavedEntry(stored);
    } catch {
      setSavedEntry(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadJournalHistory = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/journal?limit=5', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;
      const payload = await response.json();
      if (cancelled) return;

      const entries = Array.isArray(payload.entries) ? payload.entries : [];
      setJournalHistory(entries);
      if (payload.latest) {
        setSavedEntry({
          id: payload.latest.id,
          createdAt: payload.latest.created_at,
          content: payload.latest.content,
          responses: payload.latest.responses || [],
          rgyColor: payload.latest.rgy_color,
          wordCount: payload.latest.word_count || 0
        });
      }
    };

    loadJournalHistory().catch(error => {
      console.warn('Journal history load failed:', error.message);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentJournalPrompt = journalPrompts[promptIndex];
  const journalProgress = Math.round(((promptIndex + 1) / journalPrompts.length) * 100);
  const canAdvanceJournal = responses[promptIndex]?.trim().length > 0;

  const detectJournalTone = (text) => {
    const lower = text.toLowerCase();
    if (/(stuck|hard|stress|angry|tired|afraid|pressure|anxious|sad|overwhelmed)/.test(lower)) return 'yellow';
    if (/(career|build|ship|learn|health|focus|work|plan|train|wellness|grow)/.test(lower)) return 'green';
    return 'yellow';
  };

  const saveJournal = async (nextResponses) => {
    setIsSavingJournal(true);
    setJournalStatus("");
    const content = journalPrompts
      .map((item, index) => `${item.label}: ${nextResponses[index]?.trim() || ""}`)
      .join("\n\n");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const color = detectJournalTone(content);
    const entry = {
      id: `journal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      content,
      responses: nextResponses,
      rgyColor: color,
      wordCount
    };

    try {
      if (typeof window !== 'undefined') {
        const history = JSON.parse(localStorage.getItem('cubiqo_daily_journal_history') || '[]');
        localStorage.setItem('cubiqo_daily_journal_latest', JSON.stringify(entry));
        localStorage.setItem('cubiqo_daily_journal_history', JSON.stringify([entry, ...history].slice(0, 30)));
      }

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            responses: nextResponses,
            rgyColor: color,
            wordCount
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Journal sync failed');

        const cloudEntry = payload.entry;
        if (cloudEntry) {
          entry.id = cloudEntry.id;
          entry.createdAt = cloudEntry.created_at;
          entry.rgyColor = cloudEntry.rgy_color;
          entry.wordCount = cloudEntry.word_count || wordCount;
          setJournalHistory(history => [cloudEntry, ...history.filter(item => item.id !== cloudEntry.id)].slice(0, 5));
          localStorage.setItem('cubiqo_daily_journal_latest', JSON.stringify(entry));
        }
        setJournalStatus("Journal saved to your CubiQo memory.");
      } else {
        setJournalStatus("Journal saved on this device. Sign in to sync it.");
      }

      setSavedEntry(entry);
    } catch (error) {
      console.warn('Journal save failed:', error.message);
      setJournalStatus("Saved on this device. Cloud sync is unavailable right now.");
      setSavedEntry(entry);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleJournalNext = () => {
    if (!canAdvanceJournal || isSavingJournal) return;
    if (promptIndex < journalPrompts.length - 1) {
      setPromptIndex(index => index + 1);
      return;
    }
    saveJournal(responses);
  };

  return (
    <div data-testid="journal-page" style={{ width: '100%', minHeight: '100vh', background: '#020208', position: 'relative', overflow: 'hidden', color: '#fff' }}>
      <CubiQoVisual isEnabled={speakerEnabled} aiState={speakerEnabled ? "listening" : "neutral"} />
      <div style={{ position: 'absolute', top: 28, left: 28, zIndex: 100 }}>
        <button onClick={() => navigate('/app')} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '10px 20px', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >
          <X size={16} /> Close Journal
        </button>
      </div>
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '88px 20px 32px'
      }}>
        <div style={{
          width: 'min(720px, calc(100vw - 40px))',
          minHeight: 460,
          borderRadius: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          color: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'linear-gradient(180deg, rgba(18,18,28,0.76), rgba(6,6,12,0.62))',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.18), inset 0 -22px 40px rgba(0,0,0,0.2), 0 0 46px rgba(251,191,36,0.18), 0 34px 90px rgba(0,0,0,0.34)',
          backdropFilter: 'blur(26px) saturate(1.35)',
          WebkitBackdropFilter: 'blur(26px) saturate(1.35)',
          padding: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 2.8, textTransform: 'uppercase' }}>Daily Journal</div>
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.92)', fontSize: 'clamp(1.45rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: 0 }}>Check in. Extract signal. Move cleanly.</div>
            </div>
            <button
              type="button"
              onClick={() => setSpeakerEnabled(v => !v)}
              aria-label="Toggle journal ambient cube"
              style={{ width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: speakerEnabled ? 'rgba(251,191,36,0.16)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}
            >
              {speakerEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${journalProgress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(251,191,36,0.84), rgba(34,211,238,0.68))', transition: 'width 220ms ease' }} />
          </div>

          {savedEntry ? (
            <div style={{ display: 'grid', gap: 18, flex: 1, alignContent: 'center' }}>
              <div style={{ color: 'rgba(251,191,36,0.84)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase' }}>Saved</div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem', lineHeight: 1.65, maxHeight: 220, overflow: 'auto' }}>{savedEntry.content}</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.78rem' }}>{savedEntry.wordCount} words · {new Date(savedEntry.createdAt).toLocaleString()}</div>
              {journalHistory.length > 1 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.68rem', letterSpacing: 1.8, textTransform: 'uppercase' }}>Recent</div>
                  {journalHistory.slice(1, 4).map(entry => (
                    <div key={entry.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px', color: 'rgba(255,255,255,0.52)', fontSize: '0.74rem', lineHeight: 1.35 }}>
                      {new Date(entry.created_at).toLocaleDateString()} · {entry.word_count || 0} words
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSavedEntry(null);
                  setPromptIndex(0);
                  setResponses(["", "", "", ""]);
                  setJournalStatus("");
                }}
                style={{ justifySelf: 'start', border: '1px solid rgba(251,191,36,0.26)', background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.92)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer' }}
              >
                Start another entry
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, flex: 1 }}>
              <div style={{ color: 'rgba(251,191,36,0.84)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase' }}>{currentJournalPrompt.label} · {promptIndex + 1}/{journalPrompts.length}</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.32rem', lineHeight: 1.35 }}>{currentJournalPrompt.prompt}</div>
              <textarea
                value={responses[promptIndex]}
                onChange={(event) => {
                  const next = [...responses];
                  next[promptIndex] = event.target.value;
                  setResponses(next);
                }}
                placeholder={currentJournalPrompt.placeholder}
                style={{
                  width: '100%',
                  minHeight: 160,
                  resize: 'vertical',
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.24)',
                  color: '#fff',
                  outline: 'none',
                  padding: '16px',
                  fontSize: '1rem',
                  lineHeight: 1.55
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setPromptIndex(index => Math.max(0, index - 1))}
                  disabled={promptIndex === 0 || isSavingJournal}
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', opacity: promptIndex === 0 ? 0.36 : 1, borderRadius: 14, padding: '12px 16px', cursor: promptIndex === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleJournalNext}
                  disabled={!canAdvanceJournal || isSavingJournal}
                  style={{ border: '1px solid rgba(251,191,36,0.3)', background: canAdvanceJournal ? 'linear-gradient(135deg, rgba(251,191,36,0.9), rgba(249,115,22,0.84))' : 'rgba(255,255,255,0.06)', color: canAdvanceJournal ? '#111' : 'rgba(255,255,255,0.38)', borderRadius: 14, padding: '12px 18px', cursor: canAdvanceJournal ? 'pointer' : 'not-allowed', fontWeight: 700 }}
                >
                  {isSavingJournal ? 'Saving...' : promptIndex === journalPrompts.length - 1 ? 'Save entry' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {journalStatus && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.45 }}>{journalStatus}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [stats, setStats] = useState({
    conversations: 0,
    keywords: 0,
    journals: null,
    localJournals: 0,
    migrationPending: false
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const readLocalJournalCount = () => {
      if (typeof window === 'undefined') return 0;
      try {
        const history = JSON.parse(localStorage.getItem('cubiqo_daily_journal_history') || '[]');
        return Array.isArray(history) ? history.length : 0;
      } catch {
        return 0;
      }
    };

    const loadDashboard = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;
      const token = data?.session?.access_token;
      if (cancelled) return;
      setSessionUser(user);
      setStats(current => ({ ...current, localJournals: readLocalJournalCount() }));

      if (!token) {
        setRequiresAuth(true);
        setIsLoadingStats(false);
        return;
      }

      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (cancelled) return;

      if (response.ok) {
        setRequiresAuth(false);
        setStats({
          conversations: payload.stats?.conversations || 0,
          keywords: payload.stats?.keywords || 0,
          journals: payload.stats?.journals ?? null,
          localJournals: readLocalJournalCount(),
          migrationPending: Boolean(payload.stats?.journalMigrationPending)
        });
      }
      if (response.status === 401) {
        setRequiresAuth(true);
      }
      setIsLoadingStats(false);
    };

    loadDashboard().catch(() => {
      if (!cancelled) setIsLoadingStats(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const quickStats = [
    { label: 'Account', value: sessionUser ? 'Signed in' : 'Guest', color: sessionUser ? '#34d399' : '#fbbf24' },
    { label: 'Conversations', value: stats.conversations, color: '#60a5fa' },
    { label: 'Keywords', value: stats.keywords, color: '#22c55e' },
    { label: 'Journals', value: stats.journals ?? stats.localJournals, color: stats.migrationPending ? '#f97316' : '#fbbf24' }
  ];

  const statusTone = (status) => {
    if (/live/i.test(status)) return '#34d399';
    if (/ready|staged/i.test(status)) return '#fbbf24';
    return '#fb923c';
  };

  return (
    <div data-testid="dashboard-page" style={{ width: '100%', minHeight: '100vh', background: '#020208', position: 'relative', overflow: 'hidden', color: '#fff' }}>
      <CubiQoVisual isEnabled={false} aiState="neutral" />
      <div style={{ position: 'absolute', inset: 0, zIndex: 90, overflow: 'auto', padding: '28px clamp(18px, 4vw, 56px) 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/app')}
              style={{ width: 44, height: 44, borderRadius: 15, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              aria-label="Close dashboard"
            >
              <X size={18} />
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/journal')}
                style={{ border: '1px solid rgba(251,191,36,0.28)', background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.92)', borderRadius: 14, padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <BookOpen size={16} /> Journal
              </button>
            </div>
          </div>

          <section style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, background: 'linear-gradient(180deg, rgba(16,16,25,0.74), rgba(6,6,12,0.56))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '28px', boxShadow: '0 30px 90px rgba(0,0,0,0.32)' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', letterSpacing: 2.4, textTransform: 'uppercase' }}>QA Legacy Console</div>
            <div style={{ marginTop: 10, fontSize: 'clamp(1.55rem, 3vw, 2.25rem)', fontWeight: 400, letterSpacing: 0 }}>Portable features are now tracked from one place.</div>
            {requiresAuth && !isLoadingStats && (
              <div style={{ marginTop: 18, border: '1px solid rgba(34,211,238,0.18)', borderRadius: 18, background: 'rgba(34,211,238,0.07)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.86)', fontSize: '0.94rem', fontWeight: 650 }}>Sign in required</div>
                  <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.78rem', lineHeight: 1.45, marginTop: 4 }}>Dashboard data is user-owned and protected. Sign in to see account stats and history.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('cubiqo_open_auth', '1');
                    navigate('/app');
                  }}
                  style={{ border: '1px solid rgba(34,211,238,0.34)', background: 'rgba(34,211,238,0.12)', color: '#67e8f9', borderRadius: 13, padding: '10px 13px', cursor: 'pointer', fontWeight: 750 }}
                >
                  Sign in
                </button>
              </div>
            )}
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {quickStats.map(item => (
                <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, background: 'rgba(255,255,255,0.045)', padding: '14px 15px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.68rem', letterSpacing: 1.4, textTransform: 'uppercase' }}>{item.label}</div>
                  <div style={{ color: item.color, marginTop: 8, fontSize: '1.1rem', fontWeight: 600 }}>{isLoadingStats && item.label !== 'Account' ? '...' : item.value}</div>
                </div>
              ))}
            </div>
            {stats.migrationPending && (
              <div style={{ marginTop: 14, color: 'rgba(251,146,60,0.9)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                Daily Journal cloud count is waiting on the Supabase `journal_entries` migration.
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 14 }}>
            {LEGACY_FEATURES.map(feature => {
              const Icon = feature.Icon;
              return (
                <article key={feature.id} style={{ minHeight: 178, border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 20, background: 'rgba(9,9,15,0.72)', padding: 18, display: 'grid', alignContent: 'space-between', gap: 16, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 48px rgba(0,0,0,0.18)` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: `${feature.color}18`, border: `1px solid ${feature.color}38`, color: feature.color }}>
                      <Icon size={19} />
                    </div>
                    <div style={{ color: statusTone(feature.status), fontSize: '0.66rem', letterSpacing: 1.4, textTransform: 'uppercase', paddingTop: 4 }}>{feature.status}</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', fontWeight: 600, letterSpacing: 0 }}>{feature.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', lineHeight: 1.5, marginTop: 8 }}>{feature.detail}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => feature.path ? navigate(feature.path) : undefined}
                    disabled={!feature.path}
                    style={{ justifySelf: 'start', border: `1px solid ${feature.path ? `${feature.color}45` : 'rgba(255,255,255,0.08)'}`, background: feature.path ? `${feature.color}12` : 'rgba(255,255,255,0.035)', color: feature.path ? feature.color : 'rgba(255,255,255,0.32)', borderRadius: 12, padding: '9px 12px', cursor: feature.path ? 'pointer' : 'default', fontSize: '0.76rem' }}
                  >
                    {feature.path ? 'Open' : 'Queued'}
                  </button>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    let cancelled = false;

    const finishAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(error.message || 'Sign in link could not be completed.');
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data?.session?.user) {
        setStatus('Signed in. Opening CubiQo...');
        setTimeout(() => navigate('/app', { replace: true }), 650);
      } else {
        setStatus('No active session found. Please sign in again.');
        localStorage.setItem('cubiqo_open_auth', '1');
        setTimeout(() => navigate('/app', { replace: true }), 1200);
      }
    };

    finishAuth().catch(error => {
      setStatus(error.message || 'Sign in callback failed.');
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div data-testid="auth-callback-page" style={{ width: '100%', minHeight: '100vh', background: '#020208', color: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: 'min(420px, 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, background: 'rgba(12,12,18,0.82)', padding: 28, textAlign: 'center', boxShadow: '0 28px 80px rgba(0,0,0,0.36)' }}>
        <div style={{ color: 'rgba(34,211,238,0.9)', fontSize: '0.68rem', letterSpacing: 2.2, textTransform: 'uppercase' }}>Auth Callback</div>
        <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.86)', fontSize: '1.18rem', lineHeight: 1.4 }}>{status}</div>
      </div>
    </div>
  );
};

const DemoPage = () => {
  const navigate = useNavigate();
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [keywords, setKeywords] = useState({ green: [], yellow: [], red: [] });
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');
  const [rgyCapsule, setRgyCapsule] = useState({
    color: 'yellow',
    signal: 'YELLOW',
    label: 'Casual',
    intent: 'casual_general',
    voice: 'friendly',
    routing_mode: 'intelligent',
    color_is_ui_only: true
  });
  const [modelUsed, setModelUsed] = useState('local-fallback');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [colorLock, setColorLock] = useState(null);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profileSyncError, setProfileSyncError] = useState('');
  const [uiVisible, setUiVisible] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [conversationError, setConversationError] = useState('');
  const [speakingAudioLevel, setSpeakingAudioLevel] = useState(0);
  const [visitMemory, setVisitMemory] = useState(() => readVisitorMemory());
  const [userMemory, setUserMemory] = useState([]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const storedTheme = localStorage.getItem('cubiqo_page_theme') || localStorage.getItem('cubiqo_tray_theme');
    return storedTheme !== 'light';
  });
  const [visualScale, setVisualScale] = useState(() => {
    if (typeof window === 'undefined') return 100;
    const saved = parseInt(localStorage.getItem('cubiqo_visual_scale') || '100', 10);
    return Number.isFinite(saved) ? Math.min(130, Math.max(80, saved)) : 100;
  });

  // Periodic UI Breathing (Back and Forth between functional and cinematic)
  useEffect(() => {
    const interval = setInterval(() => {
      setUiVisible(prev => !prev);
    }, 15000); // 15s cycle
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('cubiqo_page_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('cubiqo_visual_scale', String(visualScale));
  }, [visualScale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('cubiqo_open_auth') === '1') {
      localStorage.removeItem('cubiqo_open_auth');
      setActiveModal('auth');
    }
  }, []);

  const aiState = isSpeaking ? 'speaking' : (speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral'));
  const recognitionRef = useRef(null);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const audioAnalysisContextRef = useRef(null);
  const audioAnalysisSourceRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const audioAnalysisFrameRef = useRef(null);
  const micAnalysisContextRef = useRef(null);
  const micAnalysisSourceRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAnalysisFrameRef = useRef(null);
  const transcriptRef = useRef('');
  const manualStopRef = useRef(false);
  const listeningActiveRef = useRef(false);
  const callBackendRef = useRef(null);

  const ensureUserProfile = async (session) => {
    const sessionUser = session?.user;
    if (!sessionUser) return true;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: sessionUser.id,
        email: sessionUser.email,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Profile sync failed:', error.message);
      setProfileSyncError('Account auth worked, but the Supabase profiles table is not reachable.');
      return false;
    }

    setProfileSyncError('');
    return true;
  };

  const loadUserMemory = async (sessionUser) => {
    if (!sessionUser?.id) {
      setUserMemory([]);
      return;
    }

    const { data, error } = await supabase
      .from('conversation_events')
      .select('user_message,assistant_response,rgy_color,rgy_intent,keywords,model_used,created_at')
      .eq('user_id', sessionUser.id)
      .order('created_at', { ascending: false })
      .limit(MEMORY_EVENT_LIMIT);

    if (error) {
      console.warn('Memory load failed:', error.message);
      return;
    }

    setUserMemory((data || []).reverse());
  };

  const rememberConversation = async (userMessage, assistantResponse, data = {}) => {
    const event = {
      user_message: userMessage,
      assistant_response: assistantResponse,
      rgy_color: normalizeKeywordColor(data.rgy?.color || 'yellow'),
      rgy_intent: data.rgy?.intent || null,
      keywords: normalizeKeywords(data.keywords || {}),
      model_used: data.model_used || 'unknown',
      created_at: new Date().toISOString()
    };

    const nextVisitMemory = [...visitMemory, event].slice(-MEMORY_EVENT_LIMIT);
    setVisitMemory(nextVisitMemory);
    writeVisitorMemory(nextVisitMemory);

    if (!user?.id) return;

    const dbEvent = { ...event, user_id: user.id };
    const { error: eventError } = await supabase.from('conversation_events').insert(dbEvent);
    if (eventError) {
      console.warn('Conversation memory save failed:', eventError.message);
      return;
    }

    const keywordRows = normalizeKeywordRows(event.keywords, user.id);
    if (keywordRows.length) {
      const { error: keywordError } = await supabase
        .from('user_activity_keywords')
        .insert(keywordRows.slice(0, 24));
      if (keywordError) console.warn('Keyword memory save failed:', keywordError.message);
    }

    setUserMemory(prev => [...prev, event].slice(-MEMORY_EVENT_LIMIT));
  };

  // Supabase auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await ensureUserProfile(data.session);
      await loadUserMemory(data.session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      await ensureUserProfile(session);
      await loadUserMemory(session?.user);
      if (session?.user) setActiveModal(null);
    });
    // Profile and memory helpers only depend on stable Supabase client module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    setProfileSyncError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else await ensureUserProfile(data.session);
    setAuthLoading(false);
  };
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    setProfileSyncError('');
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else {
      const profileReady = await ensureUserProfile(data.session);
      setAuthError(data.session && profileReady ? 'Account created and profile synced.' : 'Account created. Confirm your email, then sign in to sync your profile.');
    }
    setAuthLoading(false);
  };
  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleMagicLink = async () => {
    setMagicLinkLoading(true);
    setAuthError('');
    setProfileSyncError('');
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setAuthError(error ? error.message : 'Magic link sent. Check your email to continue.');
    setMagicLinkLoading(false);
  };

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      transcriptRef.current = t;
    };
    rec.onerror = (e) => {
      console.warn('Speech error:', e.error);
      listeningActiveRef.current = false;
      stopMicAnalysis();
      setSpeakerEnabled(false);
      setIsProcessing(false);
      setConversationError(e.error === 'not-allowed' ? 'Microphone permission denied. Use the text field instead.' : 'Voice input stopped. Use the text field or try again.');
    };
    rec.onend = () => {
      const text = transcriptRef.current.trim();
      const wasManualStop = manualStopRef.current;
      manualStopRef.current = false;
      listeningActiveRef.current = false;
      stopMicAnalysis();
      transcriptRef.current = '';
      setSpeakerEnabled(false);
      if (text) {
        setIsProcessing(true);
        callBackendRef.current?.(text);
      } else if (wasManualStop) {
        setConversationError('');
      } else {
        setConversationError('No speech detected. Tap again or type below.');
      }
    };
    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeKeywordColor = (color) => color === 'teal' ? 'green' : (['green', 'yellow', 'red'].includes(color) ? color : 'yellow');
  const normalizeKeywords = (raw = {}) => ({
    green: [...new Set([...(raw.green || []), ...(raw.teal || [])])].slice(-12),
    yellow: [...new Set(raw.yellow || [])].slice(-12),
    red: [...new Set(raw.red || [])].slice(-12)
  });

  const speechProfileForRgy = (color) => {
    if (color === 'green') return { rate: 0.96, pitch: 0.92, volume: 0.95 };
    if (color === 'red') return { rate: 0.82, pitch: 0.72, volume: 0.72 };
    return { rate: 0.88, pitch: 0.82, volume: 0.9 };
  };

  const stopAudioAnalysis = () => {
    if (audioAnalysisFrameRef.current) {
      cancelAnimationFrame(audioAnalysisFrameRef.current);
      audioAnalysisFrameRef.current = null;
    }
    setSpeakingAudioLevel(0);
  };

  const stopMicAnalysis = () => {
    if (micAnalysisFrameRef.current) {
      cancelAnimationFrame(micAnalysisFrameRef.current);
      micAnalysisFrameRef.current = null;
    }
    micAnalysisSourceRef.current?.disconnect?.();
    micAnalysisSourceRef.current = null;
    micAnalyserRef.current = null;
    micStreamRef.current?.getTracks?.().forEach(track => track.stop());
    micStreamRef.current = null;
    setSpeakingAudioLevel(0);
  };

  const startMicAnalysis = async () => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor || !navigator.mediaDevices?.getUserMedia) return;

    try {
      stopMicAnalysis();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      if (!listeningActiveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      if (!micAnalysisContextRef.current || micAnalysisContextRef.current.state === 'closed') {
        micAnalysisContextRef.current = new AudioContextCtor();
      }
      const ctx = micAnalysisContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.72;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      micStreamRef.current = stream;
      micAnalysisSourceRef.current = source;
      micAnalyserRef.current = analyser;

      const samples = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!listeningActiveRef.current || !micAnalyserRef.current) {
          stopMicAnalysis();
          return;
        }
        micAnalyserRef.current.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          const normalized = (samples[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / samples.length);
        const voiceLevel = Math.max(0, Math.min(0.72, (rms - 0.018) * 5.2));
        setSpeakingAudioLevel(prev => prev * 0.78 + voiceLevel * 0.22);
        micAnalysisFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      console.warn('Mic analysis unavailable:', error.message);
      setSpeakingAudioLevel(0);
    }
  };

  const playListeningCue = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    stopAudioAnalysis();
    setSpeakingAudioLevel(0);
    try {
      const res = await fetch('/api/voice-cue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cue: 'listening' })
      });
      const data = await res.json();
      if (!data.audio_url) throw new Error(data.error || 'No listening cue audio');

      await new Promise((resolve) => {
        audio.pause();
        audio.currentTime = 0;
        audio.onplay = null;
        audio.onpause = null;
        audio.src = data.audio_url;
        audio.volume = 0.78;
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
    } catch (error) {
      if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
      const utterance = new SpeechSynthesisUtterance('I am listening');
      utterance.rate = 0.88;
      utterance.pitch = 0.72;
      utterance.volume = 0.62;
      await new Promise((resolve) => {
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis?.speak(utterance);
        setTimeout(resolve, 1600);
      });
    } finally {
      setSpeakingAudioLevel(0);
    }
  };

  const startAudioAnalysis = async () => {
    const audio = audioRef.current;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!audio || !AudioContextCtor) {
      setSpeakingAudioLevel(0.18);
      return;
    }

    try {
      if (!audioAnalysisContextRef.current) {
        audioAnalysisContextRef.current = new AudioContextCtor();
      }
      const ctx = audioAnalysisContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      if (!audioAnalysisSourceRef.current) {
        audioAnalysisSourceRef.current = ctx.createMediaElementSource(audio);
        audioAnalyserRef.current = ctx.createAnalyser();
        audioAnalyserRef.current.fftSize = 256;
        audioAnalysisSourceRef.current.connect(audioAnalyserRef.current);
        audioAnalyserRef.current.connect(ctx.destination);
      }

      const analyser = audioAnalyserRef.current;
      const samples = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          const normalized = (samples[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / samples.length);
        const level = Math.max(0.04, Math.min(0.72, (rms - 0.012) * 3.2));
        setSpeakingAudioLevel(prev => prev * 0.7 + level * 0.3);
        audioAnalysisFrameRef.current = requestAnimationFrame(tick);
      };
      stopAudioAnalysis();
      tick();
    } catch (error) {
      console.warn('Audio analysis unavailable:', error.message);
      setSpeakingAudioLevel(0.18);
    }
  };

  useEffect(() => {
    return () => {
      stopAudioAnalysis();
      stopMicAnalysis();
      audioAnalysisContextRef.current?.close?.();
      micAnalysisContextRef.current?.close?.();
    };
  }, []);

  const callBackend = async (text) => {
    const cleanInput = text.trim();
    if (!cleanInput) return;
    setLastUserMessage(cleanInput);
    setAiResponse('');
    setConversationError('');

    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanInput,
          history: memoryEventsToHistory(user?.id ? [...visitMemory, ...userMemory] : visitMemory)
        })
      });
      if (!res.ok) throw new Error(`Conversation failed with ${res.status}`);
      const data = await res.json();
      const responseText = data.response || "I am here. Say that once more and I will stay with it.";
      setAiResponse(responseText);
      if (data.keywords) setKeywords(normalizeKeywords(data.keywords));
      if (data.model_used) setModelUsed(data.model_used);
      if (data.rgy) {
        const normalizedColor = normalizeKeywordColor(data.rgy.color);
        setRgyCapsule({ ...data.rgy, color: normalizedColor });
        if (!colorLock && data.rgy.color) setSelectedKeywordColor(normalizedColor);
      }
      if (data.audio_url) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = data.audio_url;
        audioRef.current.volume = 1;
        audioRef.current.onplay = () => {
          setIsSpeaking(true);
          startAudioAnalysis();
        };
        audioRef.current.onpause = stopAudioAnalysis;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          stopAudioAnalysis();
        };
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsSpeaking(false);
          stopAudioAnalysis();
        });
      } else if (window.speechSynthesis) {
        // Fallback to browser TTS if no audio_url (e.g., missing API key)
        const profile = speechProfileForRgy(data.rgy?.color || rgyCapsule.color);
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;
        utterance.volume = profile.volume;
        utterance.onstart = () => {
          setIsSpeaking(true);
          setSpeakingAudioLevel(data.rgy?.color === 'red' ? 0.12 : 0.18);
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingAudioLevel(0);
        };
        window.speechSynthesis.speak(utterance);
      }
      await rememberConversation(cleanInput, responseText, data);
    } catch (err) {
      // Fallback: local keyword extraction
      const words = cleanInput.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const activityVerbs = new Set(['build', 'ship', 'code', 'draft', 'write', 'plan', 'book', 'schedule', 'train', 'review', 'call', 'send', 'buy', 'sell', 'trade', 'collaborate', 'run', 'fix', 'linkedin', 'yoga', 'wellness', 'career', 'vibe']);
      const casualTerms = new Set(['facebook', 'fb', 'instagram', 'insta', 'threads', 'post', 'story', 'comfort', 'chat', 'friends', 'mood']);
      const explicitTerms = new Set(['nsfw', 'explicit', 'adult', 'private', 'grindr', 'tinder', 'hookup', 'dating', 'kink', 'fetish']);
      const nk = { red: [...keywords.red], green: [...keywords.green], yellow: [...keywords.yellow] };
      words.forEach(w => {
        if (explicitTerms.has(w)) nk.red.push(w);
        else if (activityVerbs.has(w)) nk.green.push(w);
        else if (casualTerms.has(w)) nk.yellow.push(w);
        else nk.yellow.push(w);
      });
      nk.red = [...new Set(nk.red)].slice(-10);
      nk.green = [...new Set(nk.green)].slice(-10);
      nk.yellow = [...new Set(nk.yellow)].slice(-10);
      setKeywords(nk);
      setModelUsed('local-fallback');
      setRgyCapsule({
        color: 'yellow',
        signal: 'YELLOW',
        label: 'Casual',
        intent: 'degraded_connection',
        voice: 'friendly',
        routing_mode: 'local',
        color_is_ui_only: true
      });
      if (!colorLock) setSelectedKeywordColor('yellow');
      const fallbackResponse = "I am here, but the live model connection is degraded. I still caught your intent; try again in a moment or keep typing and I will keep tracking the signal.";
      setAiResponse(fallbackResponse);
      setConversationError('Model connection degraded');
      await rememberConversation(cleanInput, fallbackResponse, {
        keywords: nk,
        model_used: 'local-fallback',
        rgy: { color: 'yellow', intent: 'degraded_connection' }
      });
    } finally {
      setIsProcessing(false);
    }
  };
  callBackendRef.current = callBackend;

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || isProcessing) return;
    setChatInput('');
    setIsProcessing(true);
    callBackend(text);
  };

  const toggleListening = async () => {
    // Unlock audio context for iOS/Safari
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});
    }
    
    if (isProcessing) return;
    if (speakerEnabled) {
      manualStopRef.current = true;
      listeningActiveRef.current = false;
      transcriptRef.current = '';
      setConversationError('');
      setSpeakerEnabled(false);
      stopMicAnalysis();
      recognitionRef.current?.stop?.();
      return;
    }
    if (!speakerEnabled) {
      if (!recognitionRef.current) {
        setConversationError('Voice input unavailable in this browser. Use the text field instead.');
        return;
      }
      transcriptRef.current = '';
      manualStopRef.current = false;
      listeningActiveRef.current = true;
      setSpeakerEnabled(true);
      try {
        await playListeningCue();
        if (!listeningActiveRef.current) return;
        recognitionRef.current?.start();
        startMicAnalysis();
      } catch (e) {
        // Fallback: simulate for browsers without mic/Speech API
        setSpeakerEnabled(true);
        setTimeout(() => {
          const fake = 'simulated voice input about balance and focus';
          transcriptRef.current = fake;
          recognitionRef.current?.dispatchEvent && recognitionRef.current.dispatchEvent(new Event('end'));
          // manual fallback
          setSpeakerEnabled(false);
          setIsProcessing(true);
          callBackend(fake);
        }, 3000);
      }
    }
  };

  const colorMap = {
    green: { label: 'Help', desc: 'Action / Growth', hex: '#22c55e', rgb: '34,197,94', aura: 'rgba(34,197,94,0.15)' },
    yellow: { label: 'Comfort', desc: 'Casual / Social', hex: '#f59e0b', rgb: '245,158,11', aura: 'rgba(245,158,11,0.15)' },
    red: { label: 'Age Gate', desc: 'Adult / Private', hex: '#ef4444', rgb: '239,68,68', aura: 'rgba(239,68,68,0.15)' }
  };
  const activeColor = normalizeKeywordColor(selectedKeywordColor);
  const active = colorMap[activeColor] || colorMap.yellow;
  const signalColor = normalizeKeywordColor(colorLock || rgyCapsule.color || 'yellow');
  const signal = colorMap[signalColor] || colorMap.yellow;
  const rgySelectorOrder = ['red', 'yellow', 'green'];
  const showVoiceEnablePrompt = !speakerEnabled && !isProcessing && !isSpeaking;
  const activeHeroScale = ((speakerEnabled || isProcessing || isSpeaking) ? 1.04 : 1) * (visualScale / 100);
  const pageTheme = isDark ? {
    background: '#08080f',
    text: '#f8fafc',
    toggleBg: 'rgba(255,255,255,0.045)',
    toggleBgActive: 'rgba(255,255,255,0.12)',
    toggleBorder: 'rgba(255,255,255,0.1)',
    toggleColor: '#fff',
    promptText: 'rgba(235,238,245,0.66)',
    promptIcon: 'rgba(235,238,245,0.7)',
    promptBubble: 'linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.035))',
    responseBg: 'rgba(10,10,16,0.56)',
    responseBorder: 'rgba(255,255,255,0.08)',
    responseMuted: 'rgba(255,255,255,0.46)',
    responseText: 'rgba(255,255,255,0.92)',
    inputBg: 'rgba(20,20,25,0.5)',
    inputBorder: 'rgba(255,255,255,0.08)',
    inputText: '#fff',
    inputPlaceholder: 'rgba(255,255,255,0.42)',
    canvasFilter: 'none'
  } : {
    background: 'radial-gradient(circle at 50% 36%, #ffffff 0%, #f5f5f7 46%, #ececf2 100%)',
    text: '#17171f',
    toggleBg: 'rgba(255,255,255,0.58)',
    toggleBgActive: 'rgba(255,255,255,0.9)',
    toggleBorder: 'rgba(24,24,32,0.11)',
    toggleColor: '#242630',
    promptText: 'rgba(24,24,32,0.62)',
    promptIcon: 'rgba(24,24,32,0.66)',
    promptBubble: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.52))',
    responseBg: 'rgba(255,255,255,0.84)',
    responseBorder: 'rgba(24,24,32,0.1)',
    responseMuted: 'rgba(24,24,32,0.46)',
    responseText: 'rgba(20,20,28,0.9)',
    inputBg: 'rgba(255,255,255,0.86)',
    inputBorder: 'rgba(24,24,32,0.1)',
    inputText: '#191a22',
    inputPlaceholder: 'rgba(24,24,32,0.46)',
    canvasFilter: 'saturate(0.9) contrast(0.88) brightness(1.08)'
  };
  const trayTheme = isDark ? {
    panel: 'linear-gradient(150deg, rgba(28,28,34,0.68), rgba(8,8,13,0.46))',
    panelBorder: 'rgba(255,255,255,0.11)',
    card: 'rgba(255,255,255,0.045)',
    cardBorder: 'rgba(255,255,255,0.095)',
    cardHover: 'rgba(255,255,255,0.075)',
    title: 'rgba(255,255,255,0.52)',
    text: 'rgba(255,255,255,0.72)',
    muted: 'rgba(255,255,255,0.4)',
    strong: '#fff',
    pill: 'rgba(255,255,255,0.07)',
    shadow: '0 34px 90px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.12)',
    hairline: 'rgba(255,255,255,0.08)'
  } : {
    panel: 'linear-gradient(150deg, rgba(255,255,255,0.94), rgba(246,247,250,0.82))',
    panelBorder: 'rgba(24,24,32,0.12)',
    card: 'rgba(255,255,255,0.78)',
    cardBorder: 'rgba(24,24,32,0.1)',
    cardHover: 'rgba(255,255,255,0.96)',
    title: 'rgba(24,24,32,0.58)',
    text: 'rgba(24,24,32,0.76)',
    muted: 'rgba(24,24,32,0.48)',
    strong: '#111318',
    pill: 'rgba(20,20,28,0.06)',
    shadow: '0 30px 80px rgba(20,20,28,0.16), inset 0 1px 0 rgba(255,255,255,0.86)',
    hairline: 'rgba(24,24,32,0.08)'
  };
  const authTheme = isDark ? {
    shell: 'linear-gradient(150deg, rgba(22,22,28,0.86), rgba(8,8,13,0.72))',
    border: 'rgba(255,255,255,0.11)',
    text: '#fff',
    muted: 'rgba(255,255,255,0.48)',
    field: 'rgba(255,255,255,0.055)',
    fieldBorder: 'rgba(255,255,255,0.1)',
    segment: 'rgba(255,255,255,0.055)',
    segmentActive: 'rgba(255,255,255,0.14)'
  } : {
    shell: 'linear-gradient(150deg, rgba(255,255,255,0.98), rgba(246,247,250,0.94))',
    border: 'rgba(24,24,32,0.13)',
    text: '#16171f',
    muted: 'rgba(24,24,32,0.62)',
    field: 'rgba(255,255,255,0.9)',
    fieldBorder: 'rgba(24,24,32,0.12)',
    segment: 'rgba(24,24,32,0.06)',
    segmentActive: 'rgba(255,255,255,0.9)'
  };

  const adjustVisualScale = (delta) => {
    setVisualScale(prev => Math.min(130, Math.max(80, prev + delta)));
  };

  const handleDemoPageClick = (event) => {
    setUiVisible(true);
    const target = event.target;
    if (target.closest('button,input,textarea,select,a,form,[data-no-voice-enable="true"]')) return;
    if (!isProcessing && !isSpeaking) toggleListening();
  };

  const addKeyword = (value = keywordDraft) => {
    const next = value.trim().toLowerCase().replace(/[^a-z0-9 -]/g, '');
    if (!next) return;
    setKeywords(prev => ({
      ...prev,
      [activeColor]: [...new Set([...(prev[activeColor] || []), next])].slice(-12)
    }));
    setKeywordDraft('');
  };

  const titleizeSignal = (value = '') => value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const signalDefaults = {
    green: ['job study', 'yoga', 'career'],
    yellow: ['movie night', 'coffee chat', 'friends'],
    red: ['adult apps', 'age-gated social', 'restricted trade']
  };

  const signalIntentByColor = {
    green: 'Suggested: Collaborate',
    yellow: 'Suggested: Socialize',
    red: 'Age-gated review'
  };

  const signalActionByColor = {
    green: 'Find practice partners, builders, coaches, rooms',
    yellow: 'Find hangouts, groups, events, easy company',
    red: 'Confirm age, consent, legality, and safety before matching'
  };

  const activeSignalWords = (keywords[activeColor]?.length ? keywords[activeColor] : signalDefaults[activeColor]).slice(0, 4);
  const activeSignalCards = activeSignalWords.map((word, index) => ({
    id: `${activeColor}-${word}-${index}`,
    title: titleizeSignal(word),
    status: index === 0 ? 'Caught request' : 'Signal shelf',
    intent: signalIntentByColor[activeColor],
    action: signalActionByColor[activeColor],
    matches: activeColor === 'red' ? index + 1 : (index + 2) * 2
  }));

  const signalRooms = [
    { label: 'Socialize', detail: `People around ${titleizeSignal(activeSignalWords[0] || activeColor)}` },
    { label: 'Collaborate', detail: `Build or improve ${titleizeSignal(activeSignalWords[0] || activeColor)}` },
    { label: 'Trade', detail: `Offers and services for ${titleizeSignal(activeSignalWords[0] || activeColor)}` }
  ];

  const panelBase = {
    position: 'absolute', top: '100px', bottom: '40px', width: '320px',
    display: 'flex', flexDirection: 'column', borderRadius: '32px',
    background: 'rgba(8,8,12,0.5)',
    backdropFilter: 'blur(50px) saturate(200%)',
    WebkitBackdropFilter: 'blur(50px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
    zIndex: 10,
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif'
  };

  return (
    <>
      <div 
        data-testid="demo-page" 
        onClick={handleDemoPageClick}
        style={{ width: '100%', height: '100vh', background: pageTheme.background, color: pageTheme.text, position: 'relative', overflow: 'hidden', cursor: uiVisible ? 'default' : 'pointer', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif', transition: 'background 0.45s ease, color 0.45s ease' }}
      >

        {/* Toggle buttons */}
        {[
          { side: 'left', open: leftPanelOpen, toggle: () => setLeftPanelOpen(v => !v), Icon: Menu, offset: 28 },
          { side: 'right', open: rightPanelOpen, toggle: () => setRightPanelOpen(v => !v), Icon: Activity, offset: 42 }
        ].map(({ side, open, toggle, Icon, offset }) => (
          <button key={side} onClick={toggle} style={{
            position: 'absolute', top: 28, [side]: offset, zIndex: 100,
            background: open ? pageTheme.toggleBgActive : pageTheme.toggleBg,
            border: `1px solid ${pageTheme.toggleBorder}`,
            backdropFilter: 'blur(24px) saturate(1.35)', WebkitBackdropFilter: 'blur(24px) saturate(1.35)', color: pageTheme.toggleColor, borderRadius: '16px',
            width: 48, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: open ? `0 0 0 1px ${pageTheme.toggleBorder}, 0 18px 42px rgba(0,0,0,0.16)` : 'none',
            opacity: uiVisible || open ? 1 : 0,
            pointerEvents: uiVisible || open ? 'auto' : 'none'
          }}>
            {open ? <X size={20} /> : (Icon === Activity ? <SignalIcon size={24} /> : <Icon size={20} />)}
          </button>
        ))}

        {/* PERSISTENT BRAND LOCKUP (Top Left) */}
        <div style={{ 
          position: 'absolute', top: 18, left: 94, zIndex: 100,
          pointerEvents: 'none', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: uiVisible ? 1 : 0,
          transform: uiVisible ? 'translateX(0)' : 'translateX(-20px)'
        }}>
          <img
            src="/assets/cubiqo-brand-lockup-transparent.png"
            alt="CubiQo - Home to General Intelligence"
            style={{
              display: 'block',
              width: 'clamp(230px, 23vw, 390px)',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Hero — centered with 25% margins each side */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '25%', right: '25%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 0
        }}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transition: 'transform 0.6s ease', transform: `scale(${activeHeroScale})` }}>
            
            {/* SINGLE HERO VISUAL: Clean morphing system using provided prototype */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, filter: pageTheme.canvasFilter, transition: 'filter 0.45s ease' }}>
              <ParticleWaveHD isVoiceMode={speakerEnabled || isProcessing || isSpeaking} audioLevel={speakingAudioLevel} />
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '8%', width: 'min(92vw, 560px)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto', textAlign: 'center', gap: 14, transition: 'opacity 0.8s ease', opacity: uiVisible ? 1 : 0 }}>
            {showVoiceEnablePrompt && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: pageTheme.promptText, letterSpacing: 1.6,
                textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 500,
                textShadow: '0 0 22px rgba(255,255,255,0.12)'
              }}>
                <div aria-hidden="true" style={{
                  width: 52, height: 52, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: pageTheme.promptBubble,
                  border: `1px solid ${pageTheme.toggleBorder}`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 42px rgba(0,0,0,0.18)',
                  backdropFilter: 'blur(24px) saturate(1.25)', WebkitBackdropFilter: 'blur(24px) saturate(1.25)'
                }}>
                  <Volume2 size={22} strokeWidth={1.45} color={pageTheme.promptIcon} />
                </div>
                <span>Tap to enable</span>
              </div>
            )}

            {(lastUserMessage || aiResponse) && (
              <div style={{
                width: '100%', maxHeight: '28vh', overflowY: 'auto',
                background: pageTheme.responseBg, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                border: `1px solid ${pageTheme.responseBorder}`, borderRadius: 18,
                padding: '14px 16px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                textAlign: 'left'
              }}>
                {lastUserMessage && (
                  <div style={{ color: pageTheme.responseMuted, fontSize: '0.76rem', lineHeight: 1.5, marginBottom: aiResponse ? 8 : 0 }}>
                    {lastUserMessage}
                  </div>
                )}
                {aiResponse && (
                  <div style={{ color: pageTheme.responseText, fontSize: '0.95rem', lineHeight: 1.55, fontWeight: 300 }}>
                    {aiResponse}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleTextSubmit} onClick={e => e.stopPropagation()} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: pageTheme.inputBg, backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${pageTheme.inputBorder}`, borderRadius: 20,
              padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Type to CubiQo"
                style={{
                  flex: 1, minWidth: 0, height: 42, border: 'none', outline: 'none',
                  background: 'transparent', color: pageTheme.inputText, padding: '0 10px',
                  fontSize: '0.92rem'
                }}
              />
              <button type="submit" title="Send message" aria-label="Send message" disabled={isProcessing || !chatInput.trim()} style={{
                width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                background: chatInput.trim() && !isProcessing ? 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.05)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: chatInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                opacity: chatInput.trim() && !isProcessing ? 1 : 0.45
              }}>
                <Send size={17} />
              </button>
            </form>

            {conversationError && (
              <div style={{ color: 'rgba(251,191,36,0.82)', fontSize: '0.74rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                {conversationError}
              </div>
            )}

          </div>
        </div>

        {/* LEFT PANEL */}
        <div style={{
          ...panelBase,
          left: '28px',
          transform: leftPanelOpen ? 'translateX(0)' : (uiVisible ? 'translateX(-130%)' : 'translateX(-130%)'),
          opacity: leftPanelOpen ? 1 : 0,
          pointerEvents: leftPanelOpen ? 'auto' : 'none',
          padding: '28px 22px',
          gap: 18,
          background: trayTheme.panel,
          border: `1px solid ${trayTheme.panelBorder}`,
          boxShadow: trayTheme.shadow
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <div style={{ color: trayTheme.strong, fontSize: '1.05rem', fontWeight: 500, letterSpacing: 0 }}>Settings</div>
            </div>
            <button
              type="button"
              onClick={() => setIsDark(v => !v)}
              aria-label={isDark ? 'Switch CubiQo to light theme' : 'Switch CubiQo to dark theme'}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: `1px solid ${trayTheme.cardBorder}`,
                background: trayTheme.card,
                color: trayTheme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isDark ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Workspace</div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                background: trayTheme.card,
                border: `1px solid ${trayTheme.cardBorder}`,
                borderRadius: 14,
                padding: '12px 14px',
                color: trayTheme.text,
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.background = trayTheme.cardHover}
              onMouseOut={e => e.currentTarget.style.background = trayTheme.card}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><LayoutDashboard size={15} /> Dashboard</span>
              <span style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>QA</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/journal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                background: trayTheme.card,
                border: `1px solid ${trayTheme.cardBorder}`,
                borderRadius: 14,
                padding: '12px 14px',
                color: trayTheme.text,
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.background = trayTheme.cardHover}
              onMouseOut={e => e.currentTarget.style.background = trayTheme.card}
            >
              <span style={{ fontSize: '0.84rem' }}>Daily Journal</span>
              <span aria-hidden="true" style={{
                width: 22,
                height: 22,
                borderRadius: 8,
                background: 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.92), rgba(249,115,22,0.35) 58%, rgba(255,255,255,0.04) 100%)',
                border: '1px solid rgba(251,191,36,0.26)',
                boxShadow: '0 0 18px rgba(251,191,36,0.22)'
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Display</div>
            <button
              type="button"
              onClick={() => setIsDark(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                width: '100%',
                background: trayTheme.card,
                border: `1px solid ${trayTheme.cardBorder}`,
                borderRadius: 14,
                padding: '12px 14px',
                color: trayTheme.text,
                cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.background = trayTheme.cardHover}
              onMouseOut={e => e.currentTarget.style.background = trayTheme.card}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
                {isDark ? <Moon size={15} /> : <Sun size={15} />}
                Page Theme
              </span>
              <span style={{ color: trayTheme.muted, fontSize: '0.78rem' }}>{isDark ? 'Dark' : 'Light'}</span>
            </button>

            <div style={{ background: trayTheme.card, border: `1px solid ${trayTheme.cardBorder}`, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: trayTheme.text, fontSize: '0.84rem' }}>CubiQo Size</span>
                <span style={{ color: trayTheme.muted, fontSize: '0.78rem' }}>{visualScale}%</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr 42px', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => adjustVisualScale(-5)}
                  aria-label="Decrease CubiQo size"
                  disabled={visualScale <= 80}
                  style={{
                    width: 42,
                    height: 36,
                    borderRadius: 12,
                    border: `1px solid ${trayTheme.cardBorder}`,
                    background: trayTheme.pill,
                    color: trayTheme.text,
                    opacity: visualScale <= 80 ? 0.35 : 1,
                    cursor: visualScale <= 80 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Minus size={15} />
                </button>
                <div style={{ height: 4, borderRadius: 999, background: trayTheme.pill, overflow: 'hidden' }}>
                  <div style={{ width: `${((visualScale - 80) / 50) * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(0,212,255,0.76), rgba(139,92,246,0.76))' }} />
                </div>
                <button
                  type="button"
                  onClick={() => adjustVisualScale(5)}
                  aria-label="Increase CubiQo size"
                  disabled={visualScale >= 130}
                  style={{
                    width: 42,
                    height: 36,
                    borderRadius: 12,
                    border: `1px solid ${trayTheme.cardBorder}`,
                    background: trayTheme.pill,
                    color: trayTheme.text,
                    opacity: visualScale >= 130 ? 0.35 : 1,
                    cursor: visualScale >= 130 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Account</div>
            {user ? (
              <div style={{ background: trayTheme.card, border: `1px solid ${trayTheme.cardBorder}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={15} color="#fff" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: trayTheme.strong, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  <div style={{ color: trayTheme.muted, fontSize: '0.68rem', marginTop: 2 }}>Signed in</div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out"
                  aria-label="Sign out"
                  style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${trayTheme.cardBorder}`, background: trayTheme.pill, color: trayTheme.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModal('auth')}
                style={{
                  width: '100%',
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.22)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  color: '#67e8f9',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
                  <User size={15} />
                  Sign in
                </span>
                <span style={{ color: 'rgba(103,232,249,0.55)', fontSize: '0.76rem' }}>Account</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div data-testid="signal-match-panel" style={{ ...panelBase, right: '28px', width: '372px', maxWidth: 'calc(100vw - 56px)', transform: rightPanelOpen ? 'translateX(0)' : 'translateX(130%)', opacity: rightPanelOpen ? 1 : 0, pointerEvents: rightPanelOpen ? 'auto' : 'none', padding: '28px 22px' }}>

          {/* Signal Aura Indicator (Replaces Tabs) */}
          <div style={{ position: 'relative', height: '52px', marginBottom: 14, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: `radial-gradient(circle, ${active.aura} 0%, transparent 70%)`,
              filter: 'blur(10px)', transition: 'all 0.5s ease'
            }} />
            <div style={{ display: 'flex', gap: 9, zIndex: 1, alignItems: 'center' }}>
              {rgySelectorOrder.map((id) => {
                const entry = colorMap[id];
                const selected = activeColor === id;
                return (
                <button key={id} type="button" title={entry.label} aria-label={entry.label} onClick={() => setSelectedKeywordColor(id)} style={{
                  width: selected ? 58 : 44,
                  height: selected ? 24 : 20,
                  border: `1px solid ${entry.hex}${selected ? '80' : '22'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  padding: 0,
                  background: `linear-gradient(135deg, ${entry.hex} 0%, ${entry.hex}d6 100%)`,
                  opacity: selected ? 1 : 0.26,
                  boxShadow: selected ? `0 0 20px ${entry.hex}75, inset 0 1px 0 rgba(255,255,255,0.22)` : 'none',
                  transform: selected ? 'skewX(-10deg) translateY(-1px)' : 'skewX(-10deg)',
                  transition: 'all 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none'
                }} />
              )})}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.64rem', letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: 700 }}>SIGNAL</div>
                <div style={{ color: '#fff', fontSize: '1.04rem', lineHeight: 1.15, fontWeight: 700, marginTop: 4 }}>Intelligent Chat & Match</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: active.hex, fontSize: '0.68rem', letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800 }}>{activeColor}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', marginTop: 4 }}>{activeSignalCards.length} signals</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '12px 13px', borderRadius: 16, background: `rgba(${active.rgb},0.07)`, border: `1px solid ${active.hex}24`, color: 'rgba(255,255,255,0.62)', fontSize: '0.76rem', lineHeight: 1.45 }}>
              Requests move from <span style={{ color: '#fff' }}>caught</span> to <span style={{ color: '#fff' }}>discoverable</span> only after the user confirms visibility.
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {activeSignalCards.map((card, index) => (
                <div key={card.id} style={{
                  borderRadius: 18,
                  padding: '13px 14px',
                  background: index === 0 ? `linear-gradient(145deg, rgba(${active.rgb},0.16), rgba(255,255,255,0.035))` : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${index === 0 ? active.hex + '58' : 'rgba(255,255,255,0.075)'}`,
                  boxShadow: index === 0 ? `0 14px 34px rgba(${active.rgb},0.08)` : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: index === 0 ? active.hex : 'rgba(255,255,255,0.46)', fontSize: '0.62rem', letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800 }}>{card.status}</span>
                    <span style={{ color: 'rgba(255,255,255,0.36)', fontSize: '0.68rem' }}>{card.matches} matches</span>
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.96rem', lineHeight: 1.2, fontWeight: 700, marginTop: 7 }}>{card.title}</div>
                  <div style={{ color: active.hex, fontSize: '0.73rem', marginTop: 8 }}>{card.intent}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', lineHeight: 1.4, marginTop: 6 }}>{card.action}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 11 }}>
                    {['Private', 'Confirm', 'Match'].map((step, stepIndex) => (
                      <span key={step} style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '6px 0',
                        borderRadius: 10,
                        border: `1px solid ${stepIndex <= 1 ? active.hex + '24' : 'rgba(255,255,255,0.07)'}`,
                        color: stepIndex <= 1 ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.32)',
                        background: stepIndex === 1 ? `rgba(${active.rgb},0.08)` : 'rgba(255,255,255,0.025)',
                        fontSize: '0.63rem',
                        letterSpacing: 0.6,
                        textTransform: 'uppercase'
                      }}>{step}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

            <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: '0.64rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 }}>Match Spaces</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {signalRooms.map((room) => (
                <button key={room.label} type="button" style={{
                  textAlign: 'left',
                  border: `1px solid ${active.hex}22`,
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 15,
                  padding: '11px 12px',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>{room.label}</span>
                    <span style={{ color: active.hex, fontSize: '0.68rem' }}>room</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.71rem', lineHeight: 1.35, marginTop: 5 }}>{room.detail}</div>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: 14,
              borderRadius: 18,
              padding: '13px 14px',
              background: 'linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025))',
              border: '1px solid rgba(255,255,255,0.09)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 750 }}>CQ-to-CQ</div>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.7rem', marginTop: 5, lineHeight: 1.35 }}>Known friends and permanent connections. Not public discovery.</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.34)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '6px 9px', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 1 }}>Private</div>
              </div>
            </div>
          </div>

          <form onSubmit={e => { e.preventDefault(); addKeyword(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <input
              value={keywordDraft}
              onChange={e => setKeywordDraft(e.target.value)}
              placeholder="add signal keyword"
              style={{
                flex: 1, minWidth: 0, height: 38, borderRadius: 12,
                border: `1px solid ${active.hex}24`, background: 'rgba(255,255,255,0.04)',
                color: '#fff', outline: 'none', padding: '0 11px', fontSize: '0.78rem'
              }}
            />
            <button type="submit" title="Add keyword" aria-label="Add keyword" style={{
              width: 38, height: 38, borderRadius: 12, border: `1px solid ${active.hex}30`,
              background: `rgba(${active.rgb},0.14)`, color: active.hex, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Plus size={16} />
            </button>
          </form>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['yoga', 'movie night', 'job study'].map(k => (
              <button key={k} onClick={() => addKeyword(k)} style={{
                border: `1px solid ${active.hex}22`, background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.48)', borderRadius: 999, padding: '6px 9px',
                fontSize: '0.68rem', cursor: 'pointer'
              }}>{k}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

          {/* Philosophy note removed as per request */}
        </div>

        {/* MODALS */}
        {activeModal && (
          <div onClick={() => setActiveModal(null)} style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(0,0,0,0.62)' : 'rgba(246,246,249,0.42)', backdropFilter: 'blur(18px) saturate(1.25)', WebkitBackdropFilter: 'blur(18px) saturate(1.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: activeModal === 'auth' ? authTheme.shell : 'rgba(14,14,22,0.95)', width: activeModal === 'auth' ? 430 : 480, maxWidth: '90%', borderRadius: activeModal === 'auth' ? 30 : 24, border: activeModal === 'auth' ? `1px solid ${authTheme.border}` : '1px solid rgba(255,255,255,0.08)', padding: activeModal === 'auth' ? '34px' : '36px', position: 'relative', boxShadow: activeModal === 'auth' ? '0 36px 100px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.16)' : '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)', backdropFilter: activeModal === 'auth' ? 'blur(34px) saturate(1.45)' : undefined, WebkitBackdropFilter: activeModal === 'auth' ? 'blur(34px) saturate(1.45)' : undefined }}>
              <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: 18, right: 18, background: activeModal === 'auth' ? authTheme.segment : 'rgba(255,255,255,0.06)', border: activeModal === 'auth' ? `1px solid ${authTheme.fieldBorder}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 12, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeModal === 'auth' ? authTheme.muted : 'rgba(255,255,255,0.5)' }}>
                <X size={16} />
              </button>
              <h2 style={{ color: activeModal === 'auth' ? authTheme.text : '#fff', fontSize: activeModal === 'auth' ? '1.45rem' : '1.5rem', fontWeight: 500, marginBottom: 8, letterSpacing: 0 }}>{activeModal === 'auth' ? (authView === 'login' ? 'Sign in' : 'Create account') : activeModal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
              {activeModal === 'auth' && <p style={{ color: authTheme.muted, fontSize: '0.86rem', marginBottom: 24, lineHeight: 1.55 }}>Use your CubiQo account to sync settings and journal access.</p>}
              {activeModal !== 'auth' && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 28, lineHeight: 1.7 }}>Configure your CubiQo experience. All changes sync across sessions.</p>}

              {activeModal === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[{ label: 'Voice', value: rgyCapsule.voice || 'friendly', color: signal.hex }, { label: 'Primary', value: 'OpenAI first', color: '#60a5fa' }, { label: 'Fallback', value: 'Anthropic / OpenRouter / local', color: '#f59e0b' }, { label: 'Storage', value: 'Session keywords only', color: '#34d399' }].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{label}</span>
                      <span style={{ color, fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: 10 }}>Color lock</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {[['auto', null], ['green', 'green'], ['yellow', 'yellow'], ['red', 'red']].map(([label, value]) => {
                        const locked = colorLock === value;
                        const swatch = value ? colorMap[value] : { hex: '#94a3b8', rgb: '148,163,184' };
                        return (
                          <button key={label} type="button" onClick={() => { setColorLock(value); if (value) setSelectedKeywordColor(value); }} style={{
                            height: 34, borderRadius: 10, border: `1px solid ${locked ? swatch.hex : 'rgba(255,255,255,0.08)'}`,
                            background: locked ? `rgba(${swatch.rgb},0.16)` : 'rgba(255,255,255,0.04)',
                            color: locked ? swatch.hex : 'rgba(255,255,255,0.5)', cursor: 'pointer',
                            fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1
                          }}>{label}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'integrations' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { name: 'Headless Browser', status: 'QA OFFLINE', color: '#f59e0b' },
                    { name: 'Google Calendar', status: 'CONNECT', color: '#00d4ff' },
                    { name: 'Spotify', status: 'CONNECT', color: '#00d4ff' },
                    { name: 'Apple Health', status: 'CONNECT', color: '#00d4ff' },
                    { name: 'Slack', status: 'CONNECT', color: '#00d4ff' },
                    { name: 'Linear', status: 'CONNECT', color: '#00d4ff' }
                  ].map(app => (
                    <div key={app.name} style={{ background: 'rgba(255,255,255,0.04)', padding: '18px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                      <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.88rem' }}>{app.name}</div>
                      <div style={{ color: app.color, fontSize: '0.72rem', marginTop: 6, letterSpacing: 1 }}>{app.status}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeModal === 'auth' && (
                <form onSubmit={authView === 'login' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8, padding: 4, borderRadius: 16, background: authTheme.segment, border: `1px solid ${authTheme.fieldBorder}` }}>
                    {['login', 'signup'].map(v => (
                      <button key={v} type="button" onClick={() => { setAuthView(v); setAuthError(''); }} style={{ padding: '10px 8px', borderRadius: 12, cursor: 'pointer', border: 'none', background: authView === v ? authTheme.segmentActive : 'transparent', color: authView === v ? authTheme.text : authTheme.muted, fontSize: '0.86rem', fontWeight: 500, boxShadow: authView === v ? '0 8px 24px rgba(0,0,0,0.12)' : 'none' }}>
                        {v === 'login' ? 'Sign in' : 'Sign up'}
                      </button>
                    ))}
                  </div>
                  {[{ label: 'Email', val: authEmail, set: setAuthEmail, type: 'email', Icon: Mail }, { label: 'Password', val: authPassword, set: setAuthPassword, type: 'password', Icon: Lock }].map(({ label, val, set, type, Icon }) => (
                    <div key={label} style={{ position: 'relative' }}>
                      <Icon size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: authTheme.muted }} />
                      <input type={type} placeholder={label} value={val} onChange={e => set(e.target.value)} required autoComplete={type === 'email' ? 'email' : authView === 'login' ? 'current-password' : 'new-password'} style={{ width: '100%', padding: '14px 14px 14px 42px', background: authTheme.field, border: `1px solid ${authTheme.fieldBorder}`, borderRadius: 15, color: authTheme.text, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }} />
                    </div>
                  ))}
                  {authError && <div style={{ color: authError.includes('created') || authError.includes('synced') ? '#34d399' : '#f87171', fontSize: '0.8rem', padding: '8px 12px', background: authError.includes('created') || authError.includes('synced') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{authError}</div>}
                  {profileSyncError && <div style={{ color: '#f59e0b', fontSize: '0.8rem', padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>{profileSyncError}</div>}
                  <button type="submit" disabled={authLoading} style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(34,211,238,0.92) 0%, rgba(124,58,237,0.92) 100%)', border: 'none', borderRadius: 15, color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1, marginTop: 6, boxShadow: '0 18px 36px rgba(34,211,238,0.16)' }}>
                    {authLoading ? 'Working...' : authView === 'login' ? 'Continue' : 'Create account'}
                  </button>
                  <button
                    type="button"
                    onClick={handleMagicLink}
                    disabled={magicLinkLoading || !authEmail}
                    style={{ padding: '13px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${authTheme.fieldBorder}`, borderRadius: 15, color: !authEmail ? authTheme.muted : authTheme.text, fontSize: '0.86rem', fontWeight: 560, cursor: magicLinkLoading || !authEmail ? 'not-allowed' : 'pointer', opacity: magicLinkLoading || !authEmail ? 0.56 : 1 }}
                  >
                    {magicLinkLoading ? 'Sending magic link...' : 'Email me a magic link'}
                  </button>
                </form>
              )}
              {activeModal !== 'settings' && activeModal !== 'integrations' && activeModal !== 'auth' && (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.85rem' }}>System connected. Ready.</span>
                </div>
              )}
              {activeModal !== 'auth' && (
                <button onClick={() => setActiveModal(null)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', border: 'none', borderRadius: 14, color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginTop: 28, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 8px 24px rgba(0,212,255,0.25)' }}>
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
      `}</style>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<DemoPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/journal" element={<JournalPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
