import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import CubiQoVisual from "./components/CubiQoVisual";
import ParticleWaveHD from "./components/ParticleWaveHD";
import { Menu, Activity, X, Mail, Lock, Send, Plus, Volume2, Moon, Sun, Minus, User, LogOut, LayoutDashboard, BookOpen, Briefcase, Rocket, ShoppingBag, Code2, ShieldCheck, Globe2, Camera, Fingerprint, Bot, Search, BrainCircuit, ChevronDown, CheckCircle2, ClipboardList, FileText, Clock3, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "./lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const READY_FEATURES = [
  {
    id: 'auth',
    label: 'Auth + Account',
    status: 'Live',
    detail: 'Returning-user sign-in, protected dashboard access, logout, and profile sync are wired in QA.',
    Icon: User,
    color: '#34d399'
  },
  {
    id: 'daily-journal',
    label: 'Daily Journal',
    status: 'Device live',
    detail: 'Guided journal create, edit, delete, history, loading, and error states work on this device. Cloud sync stays hidden until Supabase journal_entries is applied.',
    Icon: BookOpen,
    color: '#fbbf24',
    path: '/journal'
  },
  {
    id: 'dashboard',
    label: 'My Dashboard',
    status: 'Live',
    detail: 'Protected account state, conversation count, keyword count, local journal count fallback, and quick links work without exposing incomplete modules.',
    Icon: LayoutDashboard,
    color: '#60a5fa',
    path: '/dashboard'
  },
  {
    id: 'conversation',
    label: 'Conversation + Voice',
    status: 'Live',
    detail: 'Text chat, RGY classification, and voice playback are wired. Repo self-inspection now uses the V1 read-only agent path.',
    Icon: Activity,
    color: '#2dd4bf'
  },
  {
    id: 'agentic-v1',
    label: 'Agentic V1',
    status: 'Live',
    detail: 'CubiQo can inspect readable repo files, list routes, summarize stack, and report blocked checks without write access.',
    Icon: BrainCircuit,
    color: '#a78bfa'
  },
  {
    id: 'rgy-keywords',
    label: 'RGY Signals',
    status: 'Live',
    detail: 'The MVP capsule is color, keyword, and optional intent. Matching stays off until the user confirms Socialize, Collaborate, Trade, or any combination.',
    Icon: SignalIcon,
    color: '#a3e635'
  },
  {
    id: 'v2-actions',
    label: 'V2 Action Gate',
    status: 'QA live',
    detail: 'Approval cards, task writes, in-app report schedules, in-app self reports, and audit logs are wired with RLS in QA.',
    Icon: ShieldCheck,
    color: '#38bdf8',
    path: '/actions'
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
  const [isLoadingJournalHistory, setIsLoadingJournalHistory] = useState(true);
  const [journalError, setJournalError] = useState("");
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [journalStartedAt, setJournalStartedAt] = useState(null);
  const [journalRemainingSeconds, setJournalRemainingSeconds] = useState(15 * 60);
  const [journalListening, setJournalListening] = useState(false);
  const [journalVoiceAvailable, setJournalVoiceAvailable] = useState(false);
  const [journalVoiceStatus, setJournalVoiceStatus] = useState("");
  const journalRecognitionRef = useRef(null);
  const journalPromptIndexRef = useRef(0);
  const journalPrompts = [
    {
      label: "Quick Intake",
      prompt: "Before Core starts, what is the honest state of you today?",
      placeholder: "Mood, energy, focus, pressure..."
    },
    {
      label: "Core 1",
      prompt: "What is most present for you right now?",
      placeholder: "The moment, person, task, thought, or tension..."
    },
    {
      label: "Core 2",
      prompt: "Where do you feel energy, pressure, or resistance today?",
      placeholder: "A pattern, lesson, resistance, or decision..."
    },
    {
      label: "Core 3",
      prompt: "What would make the next 24 hours feel cleaner or more complete?",
      placeholder: "One clear action, choice, or release..."
    }
  ];

  const normalizeJournalEntry = (entry) => {
    if (!entry) return null;
    const createdAt = entry.createdAt || entry.created_at || new Date().toISOString();
    const responsesValue = Array.isArray(entry.responses) ? entry.responses : ["", "", "", ""];
    const content = entry.content || journalPrompts
      .map((item, index) => `${item.label}: ${responsesValue[index]?.trim() || ""}`)
      .join("\n\n");
    const wordCount = entry.wordCount ?? entry.word_count ?? content.split(/\s+/).filter(Boolean).length;

    return {
      id: entry.id || `journal-${Date.now()}`,
      title: entry.title || responsesValue[0]?.slice(0, 80) || 'Daily Journal',
      content,
      responses: [...responsesValue, "", "", "", ""].slice(0, journalPrompts.length),
      rgyColor: entry.rgyColor || entry.rgy_color || 'yellow',
      mood: entry.mood || responsesValue[0]?.slice(0, 80) || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      wordCount,
      createdAt,
      updatedAt: entry.updatedAt || entry.updated_at || createdAt
    };
  };

  const readLocalJournalHistory = () => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(localStorage.getItem('cubiqo_daily_journal_latest') || 'null');
      const history = JSON.parse(localStorage.getItem('cubiqo_daily_journal_history') || '[]');
      const entries = Array.isArray(history) ? history : [];
      const normalized = entries
        .map(normalizeJournalEntry)
        .filter(Boolean);
      const latest = normalizeJournalEntry(stored);
      if (latest && !normalized.some(entry => entry.id === latest.id)) {
        normalized.unshift(latest);
      }
      return normalized.slice(0, 30);
    } catch {
      return [];
    }
  };

  const writeLocalJournalHistory = (entry) => {
    if (typeof window === 'undefined') return [];
    const normalized = normalizeJournalEntry(entry);
    if (!normalized) return [];
    const history = readLocalJournalHistory() || [];
    const next = [normalized, ...history.filter(item => item.id !== normalized.id)].slice(0, 30);
    localStorage.setItem('cubiqo_daily_journal_latest', JSON.stringify(normalized));
    localStorage.setItem('cubiqo_daily_journal_history', JSON.stringify(next));
    return next;
  };

  useEffect(() => {
    let cancelled = false;

    const loadJournalHistory = async () => {
      setIsLoadingJournalHistory(true);
      setJournalError("");
      const localEntries = readLocalJournalHistory() || [];
      if (!cancelled) {
        setJournalHistory(localEntries.slice(0, 5));
        if (localEntries[0]) setSavedEntry(localEntries[0]);
      }

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        if (!cancelled) setIsLoadingJournalHistory(false);
        return;
      }

      const response = await fetch('/api/journal?limit=5', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Journal history unavailable');
      if (cancelled) return;

      const entries = Array.isArray(payload.entries) ? payload.entries.map(normalizeJournalEntry).filter(Boolean) : [];
      setJournalHistory(entries);
      if (payload.latest) {
        setSavedEntry(normalizeJournalEntry(payload.latest));
      } else if (!localEntries[0]) {
        setSavedEntry(null);
      }
      setIsLoadingJournalHistory(false);
    };

    loadJournalHistory().catch(error => {
      console.warn('Journal history load failed:', error.message);
      if (!cancelled) {
        setJournalError('Cloud journal history is unavailable. Local entries still work.');
        setIsLoadingJournalHistory(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    journalPromptIndexRef.current = promptIndex;
  }, [promptIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setJournalVoiceAvailable(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          finalTranscript += event.results[index][0].transcript;
        }
      }
      const spoken = finalTranscript.trim();
      if (!spoken) return;
      setResponses(prev => {
        const next = [...prev];
        const activeIndex = journalPromptIndexRef.current;
        next[activeIndex] = `${next[activeIndex] ? `${next[activeIndex].trim()} ` : ''}${spoken}`.trim();
        return next;
      });
      setJournalVoiceStatus('Captured speech into this answer.');
    };
    recognition.onerror = (event) => {
      setJournalListening(false);
      setJournalVoiceStatus(event?.error === 'not-allowed' ? 'Microphone permission was not allowed.' : 'Voice capture paused. You can keep typing.');
    };
    recognition.onend = () => {
      setJournalListening(false);
    };

    journalRecognitionRef.current = recognition;
    setJournalVoiceAvailable(true);
    return () => {
      try {
        recognition.stop();
      } catch {
        // Browser speech recognition may already be stopped.
      }
      journalRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!journalStartedAt || savedEntry || promptIndex === 0) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - journalStartedAt) / 1000);
      const remaining = Math.max(0, (15 * 60) - elapsed);
      setJournalRemainingSeconds(remaining);
      if (remaining === 0) {
        setJournalStatus('Fifteen-minute Core window is complete. Summarize when ready.');
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [journalStartedAt, promptIndex, savedEntry]);

  const currentJournalPrompt = journalPrompts[promptIndex];
  const journalProgress = Math.round(((promptIndex + 1) / journalPrompts.length) * 100);
  const canAdvanceJournal = responses[promptIndex]?.trim().length > 0;
  const journalTimerLabel = `${String(Math.floor(journalRemainingSeconds / 60)).padStart(2, '0')}:${String(journalRemainingSeconds % 60).padStart(2, '0')}`;
  const journalCoreActive = promptIndex > 0 && !savedEntry;

  const detectJournalTone = (text) => {
    const lower = text.toLowerCase();
    if (/(stuck|hard|stress|angry|tired|afraid|pressure|anxious|sad|overwhelmed)/.test(lower)) return 'yellow';
    if (/(career|build|ship|learn|health|focus|work|plan|train|wellness|grow)/.test(lower)) return 'green';
    return 'yellow';
  };

  const saveJournal = async (nextResponses) => {
    setIsSavingJournal(true);
    setJournalStatus("Core is summarizing this journal...");
    setJournalError("");
    let guideSummary = null;
    try {
      const guideResponse = await fetch('/api/journal/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summary',
          intake: nextResponses[0],
          answers: journalPrompts.slice(1).map((item, index) => ({
            question: item.prompt,
            answer: nextResponses[index + 1] || ''
          }))
        })
      });
      const guidePayload = await guideResponse.json().catch(() => ({}));
      if (guideResponse.ok) guideSummary = guidePayload.summary || null;
    } catch (error) {
      console.warn('Journal guide summary failed:', error.message);
    }

    const content = guideSummary?.content || journalPrompts
      .map((item, index) => `${item.label}: ${nextResponses[index]?.trim() || ""}`)
      .join("\n\n");
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const color = guideSummary?.rgyColor || detectJournalTone(content);
    const title = guideSummary?.title || nextResponses[0]?.trim().slice(0, 82) || 'Daily Journal';
    const tags = Array.isArray(guideSummary?.tags) && guideSummary.tags.length
      ? guideSummary.tags.slice(0, 8)
      : ['daily-journal', color, nextResponses[3]?.trim() ? 'next-move' : 'reflection'];
    const entry = {
      id: editingEntryId || `journal-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      content,
      responses: nextResponses,
      rgyColor: color,
      mood: guideSummary?.mood || nextResponses[0]?.trim().slice(0, 80) || '',
      tags,
      wordCount
    };

    try {
      const localHistory = writeLocalJournalHistory(entry);
      setJournalHistory(localHistory.slice(0, 5));

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        const isCloudEdit = editingEntryId && !String(editingEntryId).startsWith('journal-');
        const response = await fetch(isCloudEdit ? `/api/journal/${editingEntryId}` : '/api/journal', {
          method: isCloudEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            content,
            responses: nextResponses,
            rgyColor: color,
            mood: entry.mood,
            tags,
            wordCount
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Journal sync failed');

        if (payload.migrationPending) {
          setSavedEntry(entry);
          setJournalStatus("Journal saved on this device. Cloud journal sync is waiting on the database migration.");
          setEditingEntryId(null);
          return;
        }

        const cloudEntry = payload.entry;
        if (cloudEntry) {
          const normalizedCloudEntry = normalizeJournalEntry(cloudEntry);
          const syncedHistory = [normalizedCloudEntry, ...localHistory.filter(item => item.id !== entry.id && item.id !== normalizedCloudEntry.id)].slice(0, 30);
          if (typeof window !== 'undefined') {
            localStorage.setItem('cubiqo_daily_journal_latest', JSON.stringify(normalizedCloudEntry));
            localStorage.setItem('cubiqo_daily_journal_history', JSON.stringify(syncedHistory));
          }
          setJournalHistory(syncedHistory.slice(0, 5));
          setSavedEntry(normalizedCloudEntry);
        } else {
          setSavedEntry(entry);
        }
        setJournalStatus(isCloudEdit ? "Journal updated in your CubiQo memory." : "Journal saved to your CubiQo memory.");
      } else {
        setJournalStatus("Journal saved on this device. Sign in to sync it.");
        setSavedEntry(entry);
      }

      setEditingEntryId(null);
    } catch (error) {
      console.warn('Journal save failed:', error.message);
      setJournalStatus("Saved on this device. Cloud sync is unavailable right now.");
      setSavedEntry(entry);
      setEditingEntryId(null);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleJournalNext = () => {
    if (!canAdvanceJournal || isSavingJournal) return;
    if (promptIndex < journalPrompts.length - 1) {
      if (promptIndex === 0 && !journalStartedAt) {
        setJournalStartedAt(Date.now());
        setJournalRemainingSeconds(15 * 60);
        setJournalStatus("Core started. You have a fifteen-minute guided lane.");
      }
      setPromptIndex(index => index + 1);
      return;
    }
    if (journalListening) {
      try {
        journalRecognitionRef.current?.stop?.();
      } catch {
        // Ignore already-stopped browser recognizer.
      }
      setJournalListening(false);
    }
    saveJournal(responses);
  };

  const toggleJournalListening = () => {
    if (!journalVoiceAvailable || !journalRecognitionRef.current) {
      setJournalVoiceStatus('Voice capture is unavailable in this browser. Type your answer instead.');
      return;
    }
    if (journalListening) {
      try {
        journalRecognitionRef.current.stop();
      } catch {
        // Ignore already-stopped browser recognizer.
      }
      setJournalListening(false);
      setJournalVoiceStatus('Voice capture stopped.');
      return;
    }
    try {
      journalRecognitionRef.current.start();
      setJournalListening(true);
      setJournalVoiceStatus('Listening. Speak naturally; your words will be added below.');
    } catch (error) {
      setJournalVoiceStatus('Voice capture could not start. Type your answer instead.');
      setJournalListening(false);
    }
  };

  const startNewJournalEntry = () => {
    setSavedEntry(null);
    setEditingEntryId(null);
    setPromptIndex(0);
    setResponses(["", "", "", ""]);
    setJournalStartedAt(null);
    setJournalRemainingSeconds(15 * 60);
    setJournalListening(false);
    setJournalVoiceStatus("");
    setJournalStatus("");
    setJournalError("");
  };

  const editJournalEntry = (entry) => {
    const normalized = normalizeJournalEntry(entry);
    if (!normalized) return;
    setSavedEntry(null);
    setEditingEntryId(normalized.id);
    setResponses([...normalized.responses, "", "", "", ""].slice(0, journalPrompts.length));
    setPromptIndex(0);
    setJournalStartedAt(null);
    setJournalRemainingSeconds(15 * 60);
    setJournalListening(false);
    setJournalVoiceStatus("");
    setJournalStatus("Editing journal entry.");
    setJournalError("");
  };

  const deleteJournalEntry = async (entry) => {
    const normalized = normalizeJournalEntry(entry);
    if (!normalized) return;
    const confirmed = typeof window === 'undefined' || window.confirm('Delete this journal entry?');
    if (!confirmed) return;

    setIsSavingJournal(true);
    setJournalError("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      const isCloudEntry = token && !String(normalized.id).startsWith('journal-');
      if (isCloudEntry) {
        const response = await fetch(`/api/journal/${normalized.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Journal delete failed');
      }

      const history = (readLocalJournalHistory() || []).filter(item => item.id !== normalized.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cubiqo_daily_journal_history', JSON.stringify(history));
        if (history[0]) {
          localStorage.setItem('cubiqo_daily_journal_latest', JSON.stringify(history[0]));
        } else {
          localStorage.removeItem('cubiqo_daily_journal_latest');
        }
      }
      setJournalHistory(history.slice(0, 5));
      setSavedEntry(history[0] || null);
      setJournalStatus("Journal entry deleted.");
    } catch (error) {
      console.warn('Journal delete failed:', error.message);
      setJournalError("Delete failed. Please try again after the connection settles.");
    } finally {
      setIsSavingJournal(false);
    }
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
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.92)', fontSize: 'clamp(1.45rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: 0 }}>{promptIndex === 0 ? 'Quick intake before Core starts.' : 'Core guided journal. Fifteen-minute lane.'}</div>
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

          {journalCoreActive && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 12, border: '1px solid rgba(251,191,36,0.14)', borderRadius: 18, background: 'rgba(251,191,36,0.06)', padding: '12px 14px' }}>
              <div>
                <div style={{ color: 'rgba(251,191,36,0.82)', fontSize: '0.68rem', letterSpacing: 1.8, textTransform: 'uppercase' }}>Core session</div>
                <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', marginTop: 4 }}>Answer by voice or typing. Core will summarize and store the notes when you finish.</div>
              </div>
              <div style={{ color: journalRemainingSeconds === 0 ? '#fb7185' : 'rgba(255,255,255,0.9)', fontVariantNumeric: 'tabular-nums', fontSize: '1.1rem', fontWeight: 750 }}>{journalTimerLabel}</div>
            </div>
          )}

          {savedEntry ? (
            <div style={{ display: 'grid', gap: 18, flex: 1, alignContent: 'center' }}>
              <div style={{ color: 'rgba(251,191,36,0.84)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase' }}>Saved</div>
              <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: '1.12rem', lineHeight: 1.25 }}>{savedEntry.title || 'Daily Journal'}</div>
              <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem', lineHeight: 1.65, maxHeight: 220, overflow: 'auto' }}>{savedEntry.content}</div>
              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.78rem' }}>{savedEntry.wordCount} words · {new Date(savedEntry.createdAt).toLocaleString()}</div>
              {savedEntry.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {savedEntry.tags.map(tag => (
                    <span key={tag} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 999, padding: '6px 9px', color: 'rgba(255,255,255,0.48)', fontSize: '0.68rem' }}>{tag}</span>
                  ))}
                </div>
              )}
              {journalHistory.length > 1 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.68rem', letterSpacing: 1.8, textTransform: 'uppercase' }}>Recent</div>
                  {journalHistory.slice(1, 4).map(entry => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSavedEntry(normalizeJournalEntry(entry))}
                      style={{ textAlign: 'left', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px', color: 'rgba(255,255,255,0.52)', fontSize: '0.74rem', lineHeight: 1.35, background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
                    >
                      <span style={{ display: 'block', color: 'rgba(255,255,255,0.72)', marginBottom: 3 }}>{entry.title || 'Daily Journal'}</span>
                      {new Date(entry.createdAt || entry.created_at).toLocaleDateString()} · {entry.wordCount || entry.word_count || 0} words
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  onClick={startNewJournalEntry}
                  style={{ border: '1px solid rgba(251,191,36,0.26)', background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.92)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer' }}
                >
                  Start another entry
                </button>
                <button
                  type="button"
                  onClick={() => editJournalEntry(savedEntry)}
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.78)', borderRadius: 14, padding: '12px 16px', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteJournalEntry(savedEntry)}
                  disabled={isSavingJournal}
                  style={{ border: '1px solid rgba(248,113,113,0.22)', background: 'rgba(248,113,113,0.08)', color: 'rgba(254,202,202,0.82)', borderRadius: 14, padding: '12px 16px', cursor: isSavingJournal ? 'not-allowed' : 'pointer', opacity: isSavingJournal ? 0.55 : 1 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, flex: 1 }}>
              <div style={{ color: 'rgba(251,191,36,0.84)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase' }}>{editingEntryId ? 'Edit' : currentJournalPrompt.label} · {promptIndex === 0 ? 'intake' : `core ${promptIndex}/3`}</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.32rem', lineHeight: 1.35 }}>{currentJournalPrompt.prompt}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={toggleJournalListening}
                  disabled={!journalVoiceAvailable || isSavingJournal}
                  style={{
                    border: `1px solid ${journalListening ? 'rgba(34,211,238,0.42)' : 'rgba(255,255,255,0.12)'}`,
                    background: journalListening ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.055)',
                    color: journalVoiceAvailable ? (journalListening ? '#67e8f9' : 'rgba(255,255,255,0.72)') : 'rgba(255,255,255,0.32)',
                    borderRadius: 999,
                    padding: '9px 12px',
                    cursor: journalVoiceAvailable && !isSavingJournal ? 'pointer' : 'not-allowed',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    gap: 8,
                    alignItems: 'center'
                  }}
                >
                  <Volume2 size={14} />
                  {journalListening ? 'Stop listening' : 'Speak answer'}
                </button>
                <span style={{ color: journalListening ? '#67e8f9' : 'rgba(255,255,255,0.42)', fontSize: '0.72rem' }}>
                  {journalVoiceAvailable ? (journalVoiceStatus || 'Voice capture ready.') : 'Voice capture unavailable in this browser.'}
                </span>
              </div>
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
                  {isSavingJournal ? 'Saving...' : promptIndex === journalPrompts.length - 1 ? (editingEntryId ? 'Update entry' : 'Summarize and save') : (promptIndex === 0 ? 'Start Core' : 'Next')}
                </button>
              </div>
              {!isLoadingJournalHistory && journalHistory.length === 0 && promptIndex === 0 && !responses.some(value => value.trim()) && (
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'rgba(255,255,255,0.42)', fontSize: '0.78rem', lineHeight: 1.45 }}>
                  No journal entries yet. This first one will become your history.
                </div>
              )}
            </div>
          )}

          {isLoadingJournalHistory && (
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.76rem', lineHeight: 1.45 }}>Loading journal history...</div>
          )}
          {journalError && (
            <div style={{ color: 'rgba(251,191,36,0.72)', fontSize: '0.78rem', lineHeight: 1.45 }}>{journalError}</div>
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
    signals: 0,
    journals: null,
    localJournals: 0,
    migrationPending: false,
    signalMigrationPending: false
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
          signals: payload.stats?.signals || 0,
          journals: payload.stats?.journals ?? null,
          localJournals: readLocalJournalCount(),
          migrationPending: Boolean(payload.stats?.journalMigrationPending),
          signalMigrationPending: Boolean(payload.stats?.signalMigrationPending)
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
    { label: 'Signals', value: stats.signals || stats.keywords, color: '#22c55e' },
    { label: 'Journals', value: stats.journals ?? stats.localJournals, color: stats.migrationPending ? '#f97316' : '#fbbf24' }
  ];

  const statusTone = (status) => {
    if (/live/i.test(status)) return '#34d399';
    if (/device/i.test(status)) return '#fbbf24';
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
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', letterSpacing: 2.4, textTransform: 'uppercase' }}>QA Ready Console</div>
            <div style={{ marginTop: 10, fontSize: 'clamp(1.55rem, 3vw, 2.25rem)', fontWeight: 400, letterSpacing: 0 }}>Only tested, usable surfaces are shown here.</div>
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
            {stats.signalMigrationPending && (
              <div style={{ marginTop: 8, color: 'rgba(251,146,60,0.9)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                RGY signal cloud count is waiting on the Supabase `signals` migration.
              </div>
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))', gap: 14 }}>
            {READY_FEATURES.map(feature => {
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

const ActionConsolePage = () => {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const actionCards = [
    {
      actionType: 'task_write',
      toolName: 'task_write',
      title: 'Create a task',
      summary: 'CubiQo will create one user-owned task in QA. No external account is touched.',
      Icon: ClipboardList,
      runLabel: 'Create task',
      riskLevel: 'low'
    },
    {
      actionType: 'cron_schedule_create',
      toolName: 'cron_schedule_create',
      title: 'Schedule in-app report',
      summary: 'CubiQo will create a daily in-app report schedule. No email or external delivery is sent.',
      Icon: Clock3,
      runLabel: 'Create schedule',
      riskLevel: 'low'
    },
    {
      actionType: 'self_report_create',
      toolName: 'self_report_create',
      title: 'Create self-report',
      summary: 'CubiQo will store a truthful in-app status report for this account.',
      Icon: FileText,
      runLabel: 'Create report',
      riskLevel: 'low'
    },
    {
      actionType: 'daily_report_send',
      toolName: 'daily_report_send',
      title: 'Store daily report',
      summary: 'CubiQo will store a daily report in-app. It will not send email or messages.',
      Icon: FileText,
      runLabel: 'Store report',
      riskLevel: 'low'
    }
  ];

  const futureBoundaries = [
    'Browser control and extension workflows',
    'LinkedIn, Indeed, Dice, and website-level job applications',
    'POD, Shopify, Printify, Printful, GFXTools execution',
    'Social posting, affiliate scheduling, and 10/10/10 automation',
    'Camera awareness, biometrics, payments, coder/studio write mode'
  ];

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || '';
  };

  const apiJson = async (path, options = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Sign in is required for V2 actions.');
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Action request failed');
    return payload;
  };

  const loadActionState = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await supabase.auth.getSession();
      setSessionUser(data?.session?.user || null);
      if (!data?.session?.access_token) {
        setLoading(false);
        return;
      }
      const [approvalData, taskData, scheduleData, reportData, auditData] = await Promise.all([
        apiJson('/api/actions/approvals?limit=20'),
        apiJson('/api/tasks?limit=20'),
        apiJson('/api/reports/schedules?limit=10'),
        apiJson('/api/reports/daily?limit=10'),
        apiJson('/api/actions/audit?limit=25')
      ]);
      setApprovals(approvalData.approvals || []);
      setTasks(taskData.tasks || []);
      setSchedules(scheduleData.schedules || []);
      setReports(reportData.reports || []);
      setAuditLogs(auditData.auditLogs || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await loadActionState();
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
      loadActionState();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestApproval = (actionType) => approvals.find(item => item.actionType === actionType && ['requested', 'approved'].includes(item.status));

  const requestApproval = async (card) => {
    setBusyAction(card.actionType);
    setMessage('');
    try {
      await apiJson('/api/actions/approvals', {
        method: 'POST',
        body: JSON.stringify({
          actionType: card.actionType,
          toolName: card.toolName,
          title: card.title,
          summary: card.summary,
          riskLevel: card.riskLevel,
          payload: {
            preview: card.summary,
            externalExecution: false
          }
        })
      });
      setMessage('Approval requested.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const decideApproval = async (approval, status) => {
    setBusyAction(approval.id);
    setMessage('');
    try {
      await apiJson('/api/actions/approvals', {
        method: 'PATCH',
        body: JSON.stringify({ id: approval.id, status })
      });
      setMessage(status === 'approved' ? 'Approved. Run the action when ready.' : 'Action cancelled.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const runApprovedAction = async (card, approval) => {
    setBusyAction(`${card.actionType}-run`);
    setMessage('');
    try {
      if (card.actionType === 'task_write') {
        await apiJson('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            title: 'CubiQo V2 approved task',
            notes: 'Created through the V2 Action Console after explicit approval.',
            metadata: { source_screen: 'actions' }
          })
        });
      } else if (card.actionType === 'cron_schedule_create') {
        await apiJson('/api/reports/schedules', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            name: 'Daily CubiQo in-app report',
            cadence: 'daily',
            deliveryMethod: 'in_app',
            summaryScope: ['journal', 'signals', 'tasks'],
            metadata: { source_screen: 'actions' }
          })
        });
      } else {
        await apiJson('/api/reports/daily', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            actionType: card.actionType,
            title: card.actionType === 'daily_report_send' ? 'Daily CubiQo Report' : 'CubiQo Self-Report',
            content: 'V2 action foundation is active. This report is stored in-app only; no external delivery connector is enabled.',
            deliveryMethod: 'in_app',
            metadata: { source_screen: 'actions' }
          })
        });
      }
      setMessage('Approved action completed.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const shellBg = '#020208';
  const cardStyle = {
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    background: 'rgba(9,9,15,0.72)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 48px rgba(0,0,0,0.18)'
  };

  return (
    <div data-testid="actions-page" style={{ width: '100%', minHeight: '100vh', background: shellBg, position: 'relative', overflow: 'hidden', color: '#fff' }}>
      <CubiQoVisual isEnabled={false} aiState="thinking" />
      <div style={{ position: 'absolute', inset: 0, zIndex: 90, overflow: 'auto', padding: '28px clamp(18px, 4vw, 56px) 48px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 22 }}>
          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
            <div>
              <button type="button" onClick={() => navigate('/app')} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.68)', padding: '8px 12px', cursor: 'pointer', marginBottom: 18 }}>
                Back to CubiQo
              </button>
              <div style={{ color: 'rgba(56,189,248,0.88)', fontSize: '0.72rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>V2 Action Console</div>
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', lineHeight: 0.95, fontWeight: 300, letterSpacing: 0, margin: 0 }}>Approval before action.</h1>
            </div>
            <Button type="button" variant="outline" className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white" onClick={loadActionState} disabled={loading}>
              <RefreshCw size={15} />
              Refresh
            </Button>
          </header>

          {!sessionUser ? (
            <section style={{ ...cardStyle, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fbbf24' }}>
                <AlertTriangle size={20} />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>Sign in required</h2>
              </div>
              <p style={{ margin: '10px 0 18px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.6 }}>V2 actions are user-owned and audited. Sign in first so approvals, tasks, and reports stay attached to your account.</p>
              <Button type="button" onClick={() => navigate('/app')}>Open CubiQo sign in</Button>
            </section>
          ) : (
            <>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {actionCards.map(card => {
                  const approval = latestApproval(card.actionType);
                  const Icon = card.Icon;
                  const isBusy = busyAction === card.actionType || busyAction === card.id || busyAction === approval?.id || busyAction === `${card.actionType}-run`;
                  return (
                    <article key={card.actionType} style={{ ...cardStyle, padding: 18, minHeight: 238, display: 'grid', gap: 14, alignContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.28)', color: '#7dd3fc' }}>
                          <Icon size={19} />
                        </div>
                        <Badge variant="outline" className="border-white/10 text-white/50">
                          {approval?.status || 'ready'}
                        </Badge>
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>{card.title}</h2>
                        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.58)', fontSize: '0.86rem', lineHeight: 1.55 }}>{card.summary}</p>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {!approval && (
                          <Button type="button" onClick={() => requestApproval(card)} disabled={isBusy} className="bg-cyan-400/90 text-slate-950 hover:bg-cyan-300">
                            Request approval
                          </Button>
                        )}
                        {approval?.status === 'requested' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <Button type="button" onClick={() => decideApproval(approval, 'approved')} disabled={isBusy} className="bg-emerald-400/90 text-slate-950 hover:bg-emerald-300">
                              Approve
                            </Button>
                            <Button type="button" variant="outline" onClick={() => decideApproval(approval, 'cancelled')} disabled={isBusy} className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]">
                              Cancel
                            </Button>
                          </div>
                        )}
                        {approval?.status === 'approved' && (
                          <Button type="button" onClick={() => runApprovedAction(card, approval)} disabled={isBusy} className="bg-white text-slate-950 hover:bg-white/85">
                            {card.runLabel}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>

              {message && (
                <div style={{ ...cardStyle, padding: '12px 14px', color: message.includes('failed') || message.includes('required') ? '#fca5a5' : '#a7f3d0', fontSize: '0.86rem' }}>
                  {message}
                </div>
              )}

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Tasks', value: tasks.length, items: tasks.map(item => item.title) },
                  { label: 'Schedules', value: schedules.length, items: schedules.map(item => `${item.name} · ${item.status}`) },
                  { label: 'Reports', value: reports.length, items: reports.map(item => `${item.title} · ${item.status}`) }
                ].map(section => (
                  <article key={section.label} style={{ ...cardStyle, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>{section.label}</h2>
                      <Badge variant="outline" className="border-white/10 text-white/50">{section.value}</Badge>
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {section.items.length ? section.items.slice(0, 4).map((item, index) => (
                        <div key={`${section.label}-${index}`} style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.78rem', lineHeight: 1.45, borderTop: index ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingTop: index ? 8 : 0 }}>
                          {item}
                        </div>
                      )) : (
                        <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>Nothing created yet.</div>
                      )}
                    </div>
                  </article>
                ))}
              </section>

              <section style={{ ...cardStyle, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Audit Trail</h2>
                  <Badge variant="outline" className="border-white/10 text-white/50">{auditLogs.length}</Badge>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {auditLogs.length ? auditLogs.slice(0, 8).map(log => (
                    <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) auto', gap: 10, alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '9px 10px', color: 'rgba(255,255,255,0.66)', fontSize: '0.76rem' }}>
                      <span>{log.status}</span>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                      <span style={{ color: 'rgba(255,255,255,0.36)' }}>{log.actionType}</span>
                    </div>
                  )) : (
                    <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>No audit entries yet.</div>
                  )}
                </div>
              </section>

              <section style={{ ...cardStyle, padding: 18 }}>
                <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Not Exposed Yet</h2>
                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                  {futureBoundaries.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.46)', fontSize: '0.78rem' }}>
                      <Lock size={13} />
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
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
  const [signals, setSignals] = useState([]);
  const [signalSyncStatus, setSignalSyncStatus] = useState('');
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
  const [agentMode, setAgentMode] = useState('idle');
  const [agentTrace, setAgentTrace] = useState([]);
  const [agentTraceOpen, setAgentTraceOpen] = useState(false);
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
  const listeningSilenceTimerRef = useRef(null);
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

  const loadSignals = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setSignals([]);
      return;
    }

    const response = await fetch('/api/signals', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSignalSyncStatus(payload.migrationPending ? 'RGY signal table is waiting on the Supabase migration.' : 'RGY signal sync unavailable.');
      return;
    }
    setSignals((payload.signals || []).map(normalizeSignal).filter(Boolean));
    setSignalSyncStatus('');
  };

  const rememberSignal = async (signalInput, options = {}) => {
    const signal = normalizeSignal(signalInput);
    if (!signal) return null;

    setSignals(prev => {
      const existingIndex = prev.findIndex(item => item.id === signal.id || (
        item.color === signal.color
        && item.keyword.toLowerCase() === signal.keyword.toLowerCase()
      ));
      const next = [...prev];
      if (existingIndex >= 0) next.splice(existingIndex, 1);
      return [signal, ...next].filter(item => item.display_state !== 'deleted').slice(0, 30);
    });

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setSignalSyncStatus('Sign in to save RGY signals.');
      return signal;
    }

    const method = options.patch && !String(signal.id).startsWith('local-') ? 'PATCH' : 'POST';
    const response = await fetch('/api/signals', {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signal)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSignalSyncStatus(payload.migrationPending ? 'RGY signal table is waiting on the Supabase migration.' : 'RGY signal save unavailable.');
      return signal;
    }

    const savedSignal = normalizeSignal(payload.signal);
    if (savedSignal) {
      setSignals(prev => [savedSignal, ...prev.filter(item => item.id !== signal.id && item.id !== savedSignal.id)].slice(0, 30));
    }
    setSignalSyncStatus('');
    return savedSignal || signal;
  };

  const deleteSignal = async (signalInput) => {
    const signal = normalizeSignal(signalInput);
    if (!signal) return;
    setSignals(prev => prev.filter(item => item.id !== signal.id));

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token || String(signal.id).startsWith('local-')) return;

    const response = await fetch('/api/signals', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: signal.id })
    });
    if (!response.ok) setSignalSyncStatus('RGY signal delete did not sync.');
  };

  // Supabase auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await ensureUserProfile(data.session);
      await loadUserMemory(data.session?.user);
      await loadSignals();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      await ensureUserProfile(session);
      await loadUserMemory(session?.user);
      await loadSignals();
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
    const clearListeningSilenceTimer = () => {
      if (listeningSilenceTimerRef.current) {
        clearTimeout(listeningSilenceTimerRef.current);
        listeningSilenceTimerRef.current = null;
      }
    };

    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      transcriptRef.current = t;
      clearListeningSilenceTimer();
      if (t.trim()) {
        listeningSilenceTimerRef.current = setTimeout(() => {
          if (!listeningActiveRef.current) return;
          manualStopRef.current = false;
          listeningActiveRef.current = false;
          recognitionRef.current?.stop?.();
        }, 1400);
      }
    };
    rec.onerror = (e) => {
      console.warn('Speech error:', e.error);
      clearListeningSilenceTimer();
      listeningActiveRef.current = false;
      stopMicAnalysis();
      setSpeakerEnabled(false);
      setIsProcessing(false);
      setConversationError(e.error === 'not-allowed' ? 'Microphone permission denied. Use the text field instead.' : 'Voice input stopped. Use the text field or try again.');
    };
    rec.onend = () => {
      clearListeningSilenceTimer();
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
  const intentChoices = ['socialize', 'collaborate', 'trade'];
  const intentLabels = {
    socialize: 'Socialize',
    collaborate: 'Collaborate',
    trade: 'Trade'
  };
  const normalizeIntentList = (value = []) => [...new Set((Array.isArray(value) ? value : [value])
    .map(item => String(item || '').toLowerCase().trim())
    .filter(item => intentChoices.includes(item)))];
  const normalizeSignal = (raw = {}) => {
    const color = normalizeKeywordColor(raw.color || raw.color_zone || 'yellow');
    const keyword = String(raw.keyword || raw.keyword_label || '').trim().slice(0, 80);
    if (!keyword) return null;
    const confirmedIntents = normalizeIntentList(raw.confirmed_intents || raw.confirmedIntents || []);
    const suggestedIntents = normalizeIntentList(raw.suggested_intents || raw.suggestedIntents || []);
    return {
      id: raw.id || `local-${color}-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-') || Date.now()}`,
      color,
      keyword,
      intent_status: confirmedIntents.length ? 'confirmed' : (suggestedIntents.length ? 'suggested' : (raw.intent_status || raw.intentStatus || 'pending')),
      suggested_intents: suggestedIntents,
      confirmed_intents: confirmedIntents,
      source: raw.source || 'conversation',
      display_state: raw.display_state || raw.displayState || 'visible',
      created_at: raw.created_at || new Date().toISOString()
    };
  };
  const signalFromRgy = (rgy = {}, keywordPayload = {}, fallbackText = '') => {
    const color = normalizeKeywordColor(rgy.color || 'yellow');
    const normalizedKeywords = normalizeKeywords(keywordPayload);
    const keyword = rgy.keyword
      || normalizedKeywords[color]?.[0]
      || fallbackText.toLowerCase().split(/\s+/).find(word => word.replace(/[^a-z0-9-]/g, '').length > 2)
      || color;
    return normalizeSignal({
      color,
      keyword,
      intent_status: rgy.intent_status || 'pending',
      suggested_intents: rgy.suggested_intents || [],
      confirmed_intents: rgy.confirmed_intents || [],
      source: 'conversation'
    });
  };

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
      console.warn('ElevenLabs listening cue unavailable:', error.message);
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
      if (listeningSilenceTimerRef.current) {
        clearTimeout(listeningSilenceTimerRef.current);
        listeningSilenceTimerRef.current = null;
      }
      stopAudioAnalysis();
      stopMicAnalysis();
      audioAnalysisContextRef.current?.close?.();
      micAnalysisContextRef.current?.close?.();
    };
  }, []);

  const callBackend = async (text, options = {}) => {
    const cleanInput = text.trim();
    if (!cleanInput) return;
    setLastUserMessage(cleanInput);
    setAiResponse('');
    setConversationError('');
    setAgentTrace([]);
    setAgentMode('idle');

    const shouldUseAgenticFlow = Boolean(options.agentFirst) || /(repo|code|stack|route|routes|built|framework|implementation|self|yourself|what model|test|tests|regression|diagnostic|runtime|provider|supabase|vercel|nextjs|next\.js|react|agentic|what did you check|what can you inspect|job|jobs|career|resume|linkedin|indeed|dice|application|apply|interview|recruiter|startup|business|market|revenue|investor|investors|funding|brainstorm|validate|validation|customer|competitor|growth|ecomm|ecommerce|shopify|printify|printful|pod|fashion|brand|clothing|sales|marketing|gfx|gfxtools|routine|memory|daily|context|research|browser|extension|social|affiliate|campaign|shopping|food|taxi|calendar|email|smart-home|smart home|cq|messenger|wallet|crypto|payment|self-heal|self heal|reporting|coder|studio|camera|biometric|voice|microphone)/i.test(cleanInput);

    try {
      if (shouldUseAgenticFlow) {
        setAgentMode('working');
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const agentRes = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            message: cleanInput,
            history: memoryEventsToHistory(user?.id ? [...visitMemory, ...userMemory] : visitMemory)
          })
        });
        const agentData = await agentRes.json().catch(() => ({}));
        if (!agentRes.ok) throw new Error(agentData.error || `Agent failed with ${agentRes.status}`);
        const responseText = agentData.response || 'I checked what I could, but I do not have enough evidence to answer that yet.';
        const isConversationDelegated = agentData.mode === 'conversation-via-agent-v1';
        const nextAgentTrace = Array.isArray(agentData.trace) && !isConversationDelegated ? agentData.trace : [];
        setAiResponse(responseText);
        setAgentTrace(nextAgentTrace);
        setAgentTraceOpen(Boolean(nextAgentTrace.length));
        setAgentMode(isConversationDelegated ? 'idle' : agentData.write_actions_enabled ? 'write-enabled' : 'read-only');
        if (agentData.model_used) setModelUsed(agentData.model_used);
        if (agentData.rgy) {
          const normalizedColor = normalizeKeywordColor(agentData.rgy.color);
          setRgyCapsule({ ...agentData.rgy, color: normalizedColor });
          if (!colorLock && agentData.rgy.color) setSelectedKeywordColor(normalizedColor);
          const capturedSignal = signalFromRgy({ ...agentData.rgy, color: normalizedColor }, {}, cleanInput);
          if (capturedSignal) await rememberSignal(capturedSignal);
        }
        try {
          if (agentData.audio_url) {
            if (!audioRef.current) audioRef.current = new Audio();
            audioRef.current.src = agentData.audio_url;
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
          }
        } catch (playbackError) {
          console.warn('Optional response voice playback failed:', playbackError.message);
          setIsSpeaking(false);
          setSpeakingAudioLevel(0);
        }
        await rememberConversation(cleanInput, responseText, {
          model_used: agentData.model_used || 'agentic-read-only-v1',
          rgy: agentData.rgy || { color: 'yellow', intent: 'agentic_read_only' },
          keywords: keywords
        });
        return;
      }

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
        const capturedSignal = signalFromRgy({ ...data.rgy, color: normalizedColor }, data.keywords || {}, cleanInput);
        if (capturedSignal) await rememberSignal(capturedSignal);
      }
      try {
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
        } else if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined') {
          // Response TTS fallback is optional; it must not overwrite a successful model response.
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
      } catch (playbackError) {
        console.warn('Optional response voice playback failed:', playbackError.message);
        setIsSpeaking(false);
        setSpeakingAudioLevel(0);
      }
      try {
        await rememberConversation(cleanInput, responseText, data);
      } catch (memoryError) {
        console.warn('Optional conversation memory failed:', memoryError.message);
      }
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
        intent: null,
        intent_status: 'pending',
        suggested_intents: [],
        confirmed_intents: [],
        voice: 'friendly',
        routing_mode: 'local',
        color_is_ui_only: true
      });
      if (!colorLock) setSelectedKeywordColor('yellow');
      const fallbackSignal = signalFromRgy({ color: 'yellow' }, nk, cleanInput);
      if (fallbackSignal) await rememberSignal(fallbackSignal);
      const fallbackResponse = "I am here, but the live model connection is degraded. I still caught your intent; try again in a moment or keep typing and I will keep tracking the signal.";
      setAiResponse(fallbackResponse);
      setAgentMode('idle');
      setConversationError(shouldUseAgenticFlow ? 'Agent path degraded' : 'Model connection degraded');
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
    callBackend(text, { agentFirst: true });
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
    void rememberSignal({
      color: activeColor,
      keyword: next,
      intent_status: 'pending',
      suggested_intents: [],
      confirmed_intents: [],
      source: 'manual'
    });
    setKeywordDraft('');
  };

  const titleizeSignal = (value = '') => value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const activeSignals = signals
    .filter(item => normalizeKeywordColor(item.color) === activeColor && item.display_state !== 'deleted')
    .slice(0, 6);
  const visibleSignal = activeSignals[0] || signalFromRgy({ ...rgyCapsule, color: activeColor }, keywords, activeColor);
  const activeSignalWords = (activeSignals.length ? activeSignals.map(item => item.keyword) : (keywords[activeColor] || [])).slice(0, 4);
  const updateSignalIntent = (signalInput, intent) => {
    const signal = normalizeSignal(signalInput);
    if (!signal) return;
    const current = normalizeIntentList(signal.confirmed_intents);
    const nextConfirmed = current.includes(intent)
      ? current.filter(item => item !== intent)
      : [...current, intent];
    void rememberSignal({
      ...signal,
      confirmed_intents: nextConfirmed,
      intent_status: nextConfirmed.length ? 'confirmed' : (signal.suggested_intents?.length ? 'suggested' : 'pending')
    }, { patch: true });
  };

  const agentTraceTone = {
    completed: { label: 'Checked', color: '#34d399' },
    blocked: { label: 'Blocked', color: '#fbbf24' },
    failed: { label: 'Failed', color: '#fb7185' }
  };

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
                {(agentMode !== 'idle' || agentTrace.length > 0) && (
                  <Collapsible open={agentTraceOpen} onOpenChange={setAgentTraceOpen} style={{ marginTop: 12 }}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-between border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                      >
                        <span className="inline-flex items-center gap-2">
                          <BrainCircuit size={14} />
                          What I checked
                          <Badge variant="outline" className="border-white/10 text-white/45">
                            {agentMode === 'working' ? 'Working' : 'Read-only V1'}
                          </Badge>
                        </span>
                        <ChevronDown size={14} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {agentTrace.length ? agentTrace.map((item, index) => {
                          const tone = agentTraceTone[item.status] || agentTraceTone.completed;
                          return (
                            <div key={`${item.tool}-${index}`} style={{
                              display: 'grid',
                              gridTemplateColumns: '18px minmax(0, 1fr) auto',
                              alignItems: 'center',
                              gap: 8,
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.035)',
                              borderRadius: 12,
                              padding: '8px 10px',
                              color: pageTheme.responseText
                            }}>
                              <CheckCircle2 size={14} color={tone.color} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: pageTheme.responseText, fontSize: '0.72rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tool}</div>
                                <div style={{ color: pageTheme.responseMuted, fontSize: '0.68rem', marginTop: 2 }}>{item.summary}</div>
                              </div>
                              <Badge variant="outline" className="border-white/10 text-white/45">
                                {tone.label}
                              </Badge>
                            </div>
                          );
                        }) : (
                          <div style={{ color: pageTheme.responseMuted, fontSize: '0.72rem', lineHeight: 1.45 }}>
                            CubiQo used the agentic read-only path. No repo tool was required for this answer.
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
            <button
              type="button"
              onClick={() => navigate('/actions')}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><ShieldCheck size={15} /> V2 Actions</span>
              <span style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>QA</span>
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
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.64rem', letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: 700 }}>RGY Capsule</div>
                <div style={{ color: '#fff', fontSize: '1.04rem', lineHeight: 1.15, fontWeight: 700, marginTop: 4 }}>{titleizeSignal(visibleSignal?.keyword || activeColor)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: active.hex, fontSize: '0.68rem', letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800 }}>{activeColor}</div>
                <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', marginTop: 4 }}>color + keyword + intent</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '12px 13px', borderRadius: 16, background: `rgba(${active.rgb},0.07)`, border: `1px solid ${active.hex}24`, color: 'rgba(255,255,255,0.62)', fontSize: '0.76rem', lineHeight: 1.45 }}>
              Intent is optional until you confirm one or more: Socialize, Collaborate, Trade.
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {(activeSignals.length ? activeSignals : [visibleSignal]).filter(Boolean).map((item, index) => {
                const confirmed = normalizeIntentList(item.confirmed_intents);
                const suggested = normalizeIntentList(item.suggested_intents);
                return (
                  <div key={item.id || `${item.color}-${item.keyword}-${index}`} style={{
                    borderRadius: 18,
                    padding: '13px 14px',
                    background: index === 0 ? `linear-gradient(145deg, rgba(${active.rgb},0.16), rgba(255,255,255,0.035))` : 'rgba(255,255,255,0.035)',
                    border: `1px solid ${index === 0 ? active.hex + '58' : 'rgba(255,255,255,0.075)'}`,
                    boxShadow: index === 0 ? `0 14px 34px rgba(${active.rgb},0.08)` : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: index === 0 ? active.hex : 'rgba(255,255,255,0.46)', fontSize: '0.62rem', letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 800 }}>{item.intent_status === 'confirmed' ? 'Confirmed' : suggested.length ? 'Suggested' : 'Needs confirm'}</span>
                      <button type="button" onClick={() => deleteSignal(item)} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.42)', borderRadius: 9, width: 26, height: 26, cursor: 'pointer', display: 'grid', placeItems: 'center' }} aria-label="Remove signal">
                        <X size={12} />
                      </button>
                    </div>
                    <input
                      value={item.keyword}
                      onChange={event => {
                        const nextKeyword = event.target.value;
                        setSignals(prev => prev.map(signalItem => signalItem.id === item.id ? { ...signalItem, keyword: nextKeyword } : signalItem));
                      }}
                      onBlur={event => rememberSignal({ ...item, keyword: event.target.value }, { patch: true })}
                      style={{
                        marginTop: 8,
                        width: '100%',
                        border: `1px solid ${active.hex}22`,
                        background: 'rgba(0,0,0,0.18)',
                        color: '#fff',
                        borderRadius: 12,
                        padding: '9px 10px',
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 700
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
                      {intentChoices.map(intent => {
                        const isConfirmed = confirmed.includes(intent);
                        const isSuggested = suggested.includes(intent);
                        return (
                          <button
                            key={intent}
                            type="button"
                            onClick={() => updateSignalIntent(item, intent)}
                            style={{
                              border: `1px solid ${isConfirmed ? active.hex + '70' : isSuggested ? active.hex + '32' : 'rgba(255,255,255,0.08)'}`,
                              color: isConfirmed ? '#fff' : isSuggested ? active.hex : 'rgba(255,255,255,0.42)',
                              background: isConfirmed ? `rgba(${active.rgb},0.18)` : 'rgba(255,255,255,0.025)',
                              boxShadow: isConfirmed ? `0 0 16px rgba(${active.rgb},0.18)` : 'none',
                              borderRadius: 999,
                              padding: '7px 10px',
                              fontSize: '0.68rem',
                              cursor: 'pointer'
                            }}
                          >
                            {intentLabels[intent]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {!activeSignals.length && !activeSignalWords.length && (
              <div style={{ marginTop: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', color: 'rgba(255,255,255,0.42)', fontSize: '0.74rem', lineHeight: 1.45 }}>
                No saved signal yet. Add a keyword below or speak to CubiQo.
              </div>
            )}

            {signalSyncStatus && (
              <div style={{ marginTop: 12, color: 'rgba(251,191,36,0.72)', fontSize: '0.72rem', lineHeight: 1.4 }}>{signalSyncStatus}</div>
            )}
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
                  {[{ label: 'Voice', value: rgyCapsule.voice || 'friendly', color: signal.hex }, { label: 'Provider', value: modelUsed || 'server-routed', color: '#60a5fa' }, { label: 'Fallback', value: 'local if providers fail', color: '#f59e0b' }, { label: 'Storage', value: user ? 'signed-in telemetry' : 'session only', color: '#34d399' }].map(({ label, value, color }) => (
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
          <Route path="/actions" element={<ActionConsolePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
