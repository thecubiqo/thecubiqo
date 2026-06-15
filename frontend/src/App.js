import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import CubiQoVisual from "./components/CubiQoVisual";
import ParticleWaveHD from "./components/ParticleWaveHD";
import JobPipeline from "./components/JobPipeline";
import DuoModeDashboard from "./components/DuoModeDashboard";
import { Menu, Activity, X, Mail, Lock, Send, Plus, Volume2, Moon, Sun, Minus, User, LogOut, LayoutDashboard, BookOpen, Briefcase, Rocket, ShoppingBag, Package, Code2, ShieldCheck, Globe2, Camera, Fingerprint, Bot, Search, BrainCircuit, ChevronDown, CheckCircle2, ClipboardList, FileText, Clock3, RefreshCw, AlertTriangle, Monitor, MousePointerClick, Keyboard, Eye, Archive, Layers, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { supabase } from "./lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CubiQoOverlays } from "@/next/components/overlays/CubiQoOverlays";

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

const ACTION_CAPABILITY_GROUPS = {
  jobWorkflow: ['job_search_save', 'job_application_prepare', 'job_application_submit_approved'],
  jobProfile: ['job_profile_write', 'resume_version_write'],
  podWorkflow: ['pod_design_brief_create', 'gfxtools_job_create', 'gfxtools_asset_resize', 'shopify_product_prepare', 'printify_design_prepare'],
  commerceWorkflow: ['shopify_product_create', 'shopify_product_publish', 'shopify_product_update', 'shopify_product_archive', 'design_create', 'product_sync', 'shopify_collection_create', 'shopify_collection_assign', 'shopify_inventory_update', 'shopify_bundle_create'],
  socialWorkflow: ['social_post_prepare', 'social_post_schedule_approved'],
  podApiConnector: ['shopify_read', 'shopify_write', 'printify_read', 'printify_write', 'pod_product_create', 'pod_product_publish']
};

const JOB_PROVIDER_UI_REGISTRY = [
  { id: 'linkedin', label: 'LinkedIn', domains: ['linkedin.'], supportsScan: true, supportsApply: true, defaultScan: true, demoUrl: 'https://www.linkedin.com/jobs/view/example-product-ops' },
  { id: 'indeed', label: 'Indeed', domains: ['indeed.'], supportsScan: true, supportsApply: true, defaultScan: true, demoUrl: 'https://www.indeed.com/viewjob?jk=example-ai-program-manager' },
  { id: 'dice', label: 'Dice', domains: ['dice.'], supportsScan: true, supportsApply: true, defaultScan: true, demoUrl: 'https://www.dice.com/job-detail/example-technical-product-lead' },
  { id: 'greenhouse', label: 'Greenhouse', domains: ['greenhouse.io'], supportsScan: true, supportsApply: true, defaultScan: true },
  { id: 'lever', label: 'Lever', domains: ['lever.co'], supportsScan: true, supportsApply: true, defaultScan: true },
  { id: 'workday', label: 'Workday', domains: ['myworkdayjobs.com', 'workdayjobs.com'], supportsScan: true, supportsApply: false, defaultScan: true },
  { id: 'monster', label: 'Monster', domains: ['monster.'], supportsScan: true, supportsApply: false, defaultScan: false },
  { id: 'ziprecruiter', label: 'ZipRecruiter', domains: ['ziprecruiter.'], supportsScan: true, supportsApply: false, defaultScan: false },
  { id: 'wellfound', label: 'Wellfound', domains: ['wellfound.com'], supportsScan: true, supportsApply: false, defaultScan: false },
  { id: 'company_site', label: 'Company Site', domains: [], supportsScan: false, supportsApply: true, defaultScan: false }
];

const SOCIAL_QUEUE_UI_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', supportsQueue: true },
  { id: 'x', label: 'X', supportsQueue: true },
  { id: 'instagram', label: 'Instagram', supportsQueue: true, requiresMedia: true },
  { id: 'threads', label: 'Threads', supportsQueue: true },
  { id: 'tiktok', label: 'TikTok', supportsQueue: false },
  { id: 'facebook', label: 'Facebook', supportsQueue: false },
  { id: 'pinterest', label: 'Pinterest', supportsQueue: false }
];

const JOB_TRACKER_STATUSES = ['saved', 'drafted', 'ready', 'applied', 'response', 'interview', 'offer', 'rejected', 'withdrawn'];
const DEFAULT_JOB_APPLY_URL = JOB_PROVIDER_UI_REGISTRY.find(provider => provider.id === 'linkedin')?.demoUrl || '';
const DEFAULT_JOB_SCAN_PROVIDER_IDS = JOB_PROVIDER_UI_REGISTRY.filter(provider => provider.defaultScan).map(provider => provider.id);
const DEFAULT_JOB_SCAN_PROVIDER_LABELS = JOB_PROVIDER_UI_REGISTRY.filter(provider => provider.defaultScan).map(provider => provider.label);
const DEFAULT_SOCIAL_CONTENT_PLATFORMS = SOCIAL_QUEUE_UI_PLATFORMS
  .filter(platform => ['linkedin', 'x', 'instagram', 'tiktok', 'facebook'].includes(platform.id))
  .map(platform => platform.id);

const jobProviderById = (id) => JOB_PROVIDER_UI_REGISTRY.find(provider => provider.id === id) || null;

const isCapabilityActive = (capabilities, actionType) =>
  capabilities.some(item => item.actionType === actionType && item.status === 'active');

const areCapabilitiesActive = (capabilities, group) =>
  group.every(actionType => isCapabilityActive(capabilities, actionType));

const resolveJobApplyPlatform = (url) => {
  const value = String(url || '').toLowerCase();
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'unknown';
  } catch {
    return 'unknown';
  }
  return JOB_PROVIDER_UI_REGISTRY.find(provider =>
    provider.domains.some(domain => value.includes(domain))
  )?.id || 'company_site';
};

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
    recognition.lang = localStorage.getItem('cubiqo_language_preference') || navigator.language || 'en-US';
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
  const [capabilities, setCapabilities] = useState([]);
  const [browserSessions, setBrowserSessions] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [jobReviews, setJobReviews] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [jobProfile, setJobProfile] = useState(null);
  const [resumeVersions, setResumeVersions] = useState([]);
  const [podConnectors, setPodConnectors] = useState([]);
  const [podDesignBriefs, setPodDesignBriefs] = useState([]);
  const [gfxToolsJobs, setGfxToolsJobs] = useState([]);
  const [gfxAssets, setGfxAssets] = useState([]);
  const [assetReadyEvents, setAssetReadyEvents] = useState([]);
  const [shopifyPreparations, setShopifyPreparations] = useState([]);
  const [printifyPreparations, setPrintifyPreparations] = useState([]);
  const [commerceState, setCommerceState] = useState(null);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [providerDesigns, setProviderDesigns] = useState([]);
  const [commerceEvents, setCommerceEvents] = useState([]);
  const [fulfillmentProviders, setFulfillmentProviders] = useState([]);
  const [socialConnectors, setSocialConnectors] = useState([]);
  const [socialDrafts, setSocialDrafts] = useState([]);
  const [socialDistributionRules, setSocialDistributionRules] = useState([]);
  const [socialScheduledPosts, setSocialScheduledPosts] = useState([]);
  const [socialFireLogs, setSocialFireLogs] = useState([]);
  const [socialQueuedPosts, setSocialQueuedPosts] = useState([]);
  const [apiConnections, setApiConnections] = useState([]);
  const [apiPodProducts, setApiPodProducts] = useState([]);
  const [browserUrl, setBrowserUrl] = useState('https://example.com/');
  const [jobApplyUrl, setJobApplyUrl] = useState(DEFAULT_JOB_APPLY_URL);
  const [jobHandoffChecklist, setJobHandoffChecklist] = useState(null);
  const [socialQueuePlatform, setSocialQueuePlatform] = useState(SOCIAL_QUEUE_UI_PLATFORMS.find(platform => platform.supportsQueue)?.id || 'linkedin');
  const [socialQueueContent, setSocialQueueContent] = useState('Draft a product or founder update. Review this draft before it ever publishes.');
  const [socialQueueMediaUrls, setSocialQueueMediaUrls] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [printifyApiKey, setPrintifyApiKey] = useState('');
  const [podProductTitle, setPodProductTitle] = useState('New POD Product');
  const [podProductDescription, setPodProductDescription] = useState('POD product draft. Review pricing, fulfillment, and assets before publishing.');
  const [podPrintProviderId, setPodPrintProviderId] = useState('');
  const [podBlueprintId, setPodBlueprintId] = useState('');
  const [podMediaAssets, setPodMediaAssets] = useState('');

  const baseActionCards = [
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
      const [approvalData, taskData, scheduleData, reportData, auditData, capabilityData, browserData, jobData, podData, socialData, commerceData, connectorData] = await Promise.all([
        apiJson('/api/actions/approvals?limit=20'),
        apiJson('/api/tasks?limit=20'),
        apiJson('/api/reports/schedules?limit=10'),
        apiJson('/api/reports/daily?limit=10'),
        apiJson('/api/actions/audit?limit=25'),
        apiJson('/api/actions/capabilities'),
        apiJson('/api/actions/execute?browser_sessions=active'),
        apiJson('/api/actions/execute?job_state=1'),
        apiJson('/api/actions/execute?pod_state=1'),
        apiJson('/api/actions/execute?social_state=1'),
        apiJson('/api/actions/execute?commerce_state=1'),
        apiJson('/api/connectors/status')
      ]);
      setApprovals(approvalData.approvals || []);
      setTasks(taskData.tasks || []);
      setSchedules(scheduleData.schedules || []);
      setReports(reportData.reports || []);
      setAuditLogs(auditData.auditLogs || []);
      setCapabilities(capabilityData.capabilities || []);
      setBrowserSessions(browserData.browserSessions || []);
      setJobListings(jobData.listings || []);
      setJobReviews(jobData.reviews || []);
      setJobApplications(jobData.applications || []);
      setJobProfile(jobData.profile || null);
      setResumeVersions(jobData.resumeVersions || []);
      setPodConnectors(podData.connectors || []);
      setPodDesignBriefs(podData.podDesignBriefs || []);
      setGfxToolsJobs(podData.gfxToolsJobs || []);
      setGfxAssets(podData.gfxAssets || []);
      setAssetReadyEvents(podData.assetReadyEvents || []);
      setShopifyPreparations(podData.shopifyPreparations || []);
      setPrintifyPreparations(podData.printifyPreparations || []);
      setCommerceState(commerceData || null);
      setShopifyProducts(commerceData.shopifyProducts || []);
      setProviderDesigns(commerceData.providerDesigns || []);
      setCommerceEvents(commerceData.commerceEvents || []);
      setFulfillmentProviders(commerceData.fulfillmentProviders || []);
      setSocialConnectors(socialData.connectors || []);
      setSocialDrafts(socialData.drafts || []);
      setSocialDistributionRules(socialData.distributionRules || []);
      setSocialScheduledPosts(socialData.scheduledPosts || []);
      setSocialFireLogs(socialData.fireLogs || []);
      setSocialQueuedPosts(socialData.queuedPosts || []);
      setApiConnections(connectorData.connections || []);
      setApiPodProducts(connectorData.podProducts || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let sseAbort = null;

    const load = async () => {
      if (!cancelled) await loadActionState();
    };
    load();

    // SSE real-time approval updates
    const startSSE = async () => {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd?.session?.access_token;
      if (!token || cancelled) return;
      sseAbort = new AbortController();
      const since = new Date(Date.now() - 60000).toISOString();
      try {
        const res = await fetch(`/api/actions/events?since=${encodeURIComponent(since)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: sseAbort.signal
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const ev = JSON.parse(line.slice(5).trim());
                if (ev.id) {
                  setApprovals(prev => {
                    const idx = prev.findIndex(a => a.id === ev.id);
                    if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...ev }; return next; }
                    return [ev, ...prev].slice(0, 30);
                  });
                }
                if (ev.status && ev.id && ['completed', 'failed', 'published'].includes(ev.status)) {
                  // silently reload full state after a terminal event
                  setTimeout(() => { if (!cancelled) loadActionState(); }, 800);
                }
              } catch {}
            }
          }
        }
      } catch {}
    };
    startSSE();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
      loadActionState();
    });
    return () => {
      cancelled = true;
      sseAbort?.abort();
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const browserControlUnlocked = isCapabilityActive(capabilities, 'browser_control');
  const jobWorkflowUnlocked = browserControlUnlocked && areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.jobWorkflow);
  const jobApplyUnlocked = browserControlUnlocked && isCapabilityActive(capabilities, 'job_apply');
  const jobProfileUnlocked = areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.jobProfile);
  const podWorkflowUnlocked = areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.podWorkflow);
  const commerceWorkflowUnlocked = areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.commerceWorkflow);
  const socialWorkflowUnlocked = areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.socialWorkflow);
  const socialQueueUnlocked = browserControlUnlocked && isCapabilityActive(capabilities, 'social_post_queue');
  const podApiConnectorUnlocked = areCapabilitiesActive(capabilities, ACTION_CAPABILITY_GROUPS.podApiConnector);
  const activeBrowserSession = browserSessions.find(item => item.status === 'active') || null;
  const latestJobListing = jobListings.find(item => ['saved', 'reviewing', 'prepared'].includes(item.status)) || jobListings[0] || null;
  const latestPreparedReview = jobReviews.find(item => item.status === 'prepared') || null;
  const latestReadyJobApplication = jobApplications.find(item => item.status === 'ready_to_submit') || null;
  const latestPodBrief = podDesignBriefs[0] || null;
  const latestReadyAsset = gfxAssets.find(item => item.status === 'ready') || null;
  const latestUnresizedReadyAsset = gfxAssets.find(item => item.status === 'ready' && !(item.platformVariants || []).length) || null;
  const latestAssetReadyEvent = latestReadyAsset ? assetReadyEvents.find(item => item.assetId === latestReadyAsset.id) || null : null;
  const latestSocialDraft = socialDrafts[0] || null;
  const latestReadySocialPost = socialQueuedPosts.find(item => item.status === 'ready') || null;
  const shopifyApiConnection = apiConnections.find(item => item.platform === 'shopify') || null;
  const printifyApiConnection = apiConnections.find(item => item.platform === 'printify') || null;
  const latestReadyPodProduct = apiPodProducts.find(item => ['ready', 'draft'].includes(item.status)) || null;
  const latestShopifyProduct = shopifyProducts[0] || null;
  const latestProviderDesign = providerDesigns[0] || null;
  const latestBrowserReceipt = auditLogs.find(log => log.screenshotUrl || log.result?.screenshotUrl) || null;
  const trackerStatuses = JOB_TRACKER_STATUSES;
  const trackerStatusFor = (item) => item?.metadata?.tracker_status || item?.trackerStatus || (
    item?.status === 'ready_to_submit' ? 'ready' :
    item?.status === 'submitted' ? 'applied' :
    item?.status === 'in_progress' ? 'drafted' :
    item?.status === 'cancelled' ? 'withdrawn' :
    item?.status || 'saved'
  );
  const trackerCounts = trackerStatuses.reduce((acc, status) => {
    acc[status] = jobApplications.filter(item => trackerStatusFor(item) === status).length;
    return acc;
  }, {});

  const detectJobApplyPlatform = resolveJobApplyPlatform;

  const loadJobHandoffChecklist = async () => {
    setBusyAction('job-handoff-checklist');
    setMessage('');
    try {
      const data = await apiJson('/api/actions/job-apply/checklist', {
        method: 'POST',
        body: JSON.stringify({
          job_url: jobApplyUrl,
          platform: detectJobApplyPlatform(jobApplyUrl),
          job_title: latestJobListing?.title || null,
          company: latestJobListing?.company || null,
          profileData: {
            name: sessionUser?.user_metadata?.full_name || '',
            email: sessionUser?.email || '',
            targetRoles: jobProfile?.targetRoles || [],
            skills: jobProfile?.skills || [],
            experienceSummary: jobProfile?.experienceSummary || '',
            resumeVersion: resumeVersions[0]?.name || null
          }
        })
      });
      setJobHandoffChecklist(data.checklist || null);
      setMessage('Application handoff checklist ready.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const browserActionCards = browserControlUnlocked ? (
    activeBrowserSession ? [
      {
        actionType: 'browser_act',
        toolName: 'browser_act',
        title: 'Run browser action',
        summary: `CubiQo will run one approved Stagehand action inside session ${activeBrowserSession.id.slice(0, 8)} and record what happened.`,
        Icon: MousePointerClick,
        runLabel: 'Run action',
        riskLevel: 'medium',
        browserSessionId: activeBrowserSession.id,
        payload: () => ({
          browser_session_id: activeBrowserSession.id,
          action: 'Observe the visible page and report the main content without submitting forms.'
        })
      },
      {
        actionType: 'browser_click',
        toolName: 'browser_click',
        title: 'Record browser click',
        summary: `CubiQo will run an approved Stagehand click intent inside session ${activeBrowserSession.id.slice(0, 8)}.`,
        Icon: MousePointerClick,
        runLabel: 'Record click',
        riskLevel: 'medium',
        browserSessionId: activeBrowserSession.id,
        payload: () => ({
          browser_session_id: activeBrowserSession.id,
          selector: 'approved-target',
          description: 'Foundation click action recorded for the active browser session.'
        })
      },
      {
        actionType: 'browser_type',
        toolName: 'browser_type',
        title: 'Record browser type',
        summary: 'CubiQo will run approved text entry only after showing the exact payload. Credential typing stays approval-bound.',
        Icon: Keyboard,
        runLabel: 'Record type',
        riskLevel: 'medium',
        browserSessionId: activeBrowserSession.id,
        payload: () => ({
          browser_session_id: activeBrowserSession.id,
          selector: 'approved-field',
          input_preview: 'Visible user-approved text only',
          description: 'Foundation type action recorded for the active browser session.'
        })
      },
      {
        actionType: 'browser_extract',
        toolName: 'browser_extract',
        title: 'Record browser extract',
        summary: 'CubiQo will extract visible page facts through the approved Stagehand session.',
        Icon: Eye,
        runLabel: 'Record extract',
        riskLevel: 'medium',
        browserSessionId: activeBrowserSession.id,
        payload: () => ({
          browser_session_id: activeBrowserSession.id,
          description: 'Extract visible page facts from the active session after runtime attachment.'
        })
      },
      {
        actionType: 'browser_screenshot',
        toolName: 'browser_screenshot',
        title: 'Record screenshot intent',
        summary: 'CubiQo will capture a signed visual receipt from the approved Stagehand session.',
        Icon: ImageIcon,
        runLabel: 'Record screenshot',
        riskLevel: 'medium',
        browserSessionId: activeBrowserSession.id,
        payload: () => ({
          browser_session_id: activeBrowserSession.id,
          description: 'Screenshot intent for the active browser session.'
        })
      }
    ] : [
      {
        actionType: 'browser_open',
        toolName: 'browser_open',
        title: 'Open browser session',
        summary: 'CubiQo will open an isolated Stagehand Browserbase session for the URL below.',
        Icon: Monitor,
        runLabel: 'Open session',
        riskLevel: 'medium',
        payload: () => ({
          url: browserUrl,
          visible_session: true,
          externalExecution: false
        })
      },
      {
        actionType: 'browser_demo',
        toolName: 'browser_demo',
        title: 'Run safe browser demo',
        summary: 'CubiQo will open example.com, extract visible content, capture a signed screenshot receipt, then close the session.',
        Icon: Eye,
        runLabel: 'Run demo',
        riskLevel: 'low',
        payload: () => ({
          url: 'https://example.com',
          session_mode: 'disposable',
          externalExecution: true
        })
      }
    ]
  ) : [];

  const jobApplyCards = jobApplyUnlocked ? [
    {
      actionType: 'job_apply',
      toolName: 'job_apply',
      title: 'Prepare job application',
      summary: 'CubiQo will open the job URL in an approved persistent browser session, fill only approved profile data, stop at the review screen, and show a visual receipt. Final submit is a separate user button.',
      Icon: Briefcase,
      runLabel: 'Prepare application',
      riskLevel: 'high',
      jobApplyUrl,
      payload: () => ({
        job_url: jobApplyUrl,
        platform: detectJobApplyPlatform(jobApplyUrl),
        job_title: latestJobListing?.title || null,
        company: latestJobListing?.company || null,
        profileData: {
          name: sessionUser?.user_metadata?.full_name || '',
          email: sessionUser?.email || '',
          targetRoles: jobProfile?.targetRoles || [],
          skills: jobProfile?.skills || [],
          experienceSummary: jobProfile?.experienceSummary || '',
          resumeVersion: resumeVersions[0]?.name || null
        },
        handoffChecklist: jobHandoffChecklist,
        finalSubmitAutonomous: false,
        stopBeforeSubmit: true
      })
    }
  ] : [];

  const socialQueueCards = socialQueueUnlocked ? [
    {
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      title: 'Queue social post',
      summary: 'CubiQo will open the selected social platform, compose the post, stop at the preview state, and show a visual receipt. The final Publish button is a separate user action.',
      Icon: Send,
      runLabel: 'Compose preview',
      riskLevel: 'high',
      payload: () => {
        const mediaUrls = socialQueueMediaUrls
          .split(/[\n,]+/)
          .map(item => item.trim())
          .filter(Boolean);
        return {
          platform: socialQueuePlatform,
          content: socialQueueContent,
          media_urls: mediaUrls,
          finalPublishAutonomous: false,
          stopBeforePublish: true,
          previewCard: {
            title: 'Social queue preview',
            platform: socialQueuePlatform,
            content: socialQueueContent,
            mediaUrls,
            willWriteTo: 'Supabase social_posts',
            willNotDo: ['No autonomous publish', 'No client-side platform call', 'No credential exposure']
          }
        };
      }
    }
  ] : [];

  const podApiProductCards = podApiConnectorUnlocked ? [
    {
      actionType: 'pod_product_create',
      toolName: 'pod_product_create',
      title: 'Create POD product',
      summary: 'CubiQo will create a draft Printify product and a draft Shopify product through server-side API connectors only. Publish remains a separate approval.',
      Icon: Package,
      runLabel: 'Create draft',
      riskLevel: 'high',
      payload: () => {
        const mediaAssets = podMediaAssets
          .split(/[\n,]+/)
          .map(item => item.trim())
          .filter(Boolean);
        return {
          title: podProductTitle,
          description: podProductDescription,
          print_provider_id: podPrintProviderId,
          blueprint_id: podBlueprintId,
          media_assets: mediaAssets,
          shop_domain: shopifyDomain,
          previewCard: {
            title: 'POD product creation preview',
            productTitle: podProductTitle,
            shopDomain: shopifyDomain,
            printProviderId: podPrintProviderId,
            blueprintId: podBlueprintId,
            mediaAssetCount: mediaAssets.length,
            willWriteTo: ['Printify draft product', 'Shopify draft product', 'Supabase pod_products'],
            willNotDo: ['No billing or payment API', 'No publish without a separate approval', 'No token exposure']
          }
        };
      }
    },
    ...(latestReadyPodProduct ? [{
      actionType: 'pod_product_publish',
      toolName: 'pod_product_publish',
      title: 'Publish POD product',
      summary: `CubiQo will publish ${latestReadyPodProduct.title || 'the selected POD product'} only after this separate approval.`,
      Icon: Rocket,
      runLabel: 'Publish product',
      riskLevel: 'high',
      podProductId: latestReadyPodProduct.id,
      payload: () => ({
        product_id: latestReadyPodProduct.id,
        previewCard: {
          title: 'POD product publish preview',
          productId: latestReadyPodProduct.id,
          shopifyProductId: latestReadyPodProduct.shopifyProductId,
          printifyProductId: latestReadyPodProduct.printifyProductId,
          willWriteTo: ['Printify publish endpoint', 'Shopify product active status', 'Supabase pod_products'],
          willNotDo: ['No billing or payment API', 'No publish without this user approval']
        }
      })
    }] : [])
  ] : [];

  const jobActionCards = jobWorkflowUnlocked ? [
    {
      actionType: 'job_search_save',
      toolName: 'job_search_save',
      title: 'Save extracted job listings',
      summary: `CubiQo will save extracted ${DEFAULT_JOB_SCAN_PROVIDER_LABELS.slice(0, 3).join(', ')} job listings to your account. It will not apply or submit anything.`,
      Icon: Briefcase,
      runLabel: 'Save listings',
      riskLevel: 'medium',
      payload: () => ({
        browser_session_id: activeBrowserSession?.id || null,
        sourcePlatform: 'linkedin',
        listings: [
          {
            sourcePlatform: 'linkedin',
            title: 'Product Operations Manager',
            company: 'Example Growth Labs',
            location: 'Remote',
            description: `Sample extracted listing for QA. Replace with extracted ${DEFAULT_JOB_SCAN_PROVIDER_LABELS.slice(0, 3).join('/')} listings when the browser runtime attaches.`,
            employmentType: 'Full-time',
            compensation: '$120k-$150k',
            sourceUrl: jobProviderById('linkedin')?.demoUrl,
            applyUrl: jobProviderById('linkedin')?.demoUrl
          },
          {
            sourcePlatform: 'indeed',
            title: 'AI Program Manager',
            company: 'Example Systems',
            location: 'New York, NY',
            description: 'Sample extracted listing for QA.',
            employmentType: 'Full-time',
            sourceUrl: jobProviderById('indeed')?.demoUrl,
            applyUrl: jobProviderById('indeed')?.demoUrl
          },
          {
            sourcePlatform: 'dice',
            title: 'Technical Product Lead',
            company: 'Example Cloud',
            location: 'Hybrid',
            description: 'Sample extracted listing for QA.',
            employmentType: 'Contract',
            sourceUrl: jobProviderById('dice')?.demoUrl,
            applyUrl: jobProviderById('dice')?.demoUrl
          }
        ]
      })
    },
    ...(latestJobListing ? [{
      actionType: 'job_application_prepare',
      toolName: 'job_application_prepare',
      title: 'Prepare application review',
      summary: `CubiQo will prepare a review card for ${latestJobListing.title} at ${latestJobListing.company}. You see the exact payload before any submission approval.`,
      Icon: FileText,
      runLabel: 'Prepare review',
      riskLevel: 'medium',
      jobListingId: latestJobListing.id,
      payload: () => ({
        browser_session_id: activeBrowserSession?.id || latestJobListing.browserSessionId || null,
        job_listing_id: latestJobListing.id,
        candidate: {
          name: sessionUser?.user_metadata?.full_name || 'Review before submit',
          email: sessionUser?.email || ''
        },
        resumeSummary: 'Review-card sample: tailor resume summary to the saved job before approval.',
        coverLetter: `Review-card sample for ${latestJobListing.company}: confirm this text before any approved submission package is created.`,
        recruiterMessage: `Hi ${latestJobListing.company} team,\nI am interested in the ${latestJobListing.title} role and would appreciate consideration for the next step.`,
        answers: [
          { question: 'Why this role?', answer: 'Relevant experience and interest to be reviewed by the user.' }
        ],
        missingAnswerPrompts: [
          { field: 'salary_expectation', question: 'Confirm salary answer before using it externally.', requiredUserInput: true }
        ]
      })
    }] : []),
    ...(latestPreparedReview ? [{
      actionType: 'job_application_submit_approved',
      toolName: 'job_application_submit_approved',
      title: 'Approve application package',
      summary: `CubiQo will mark review ${latestPreparedReview.id.slice(0, 8)} approved for visible submission. It will not auto-submit to a job board.`,
      Icon: CheckCircle2,
      runLabel: 'Approve package',
      riskLevel: 'high',
      reviewId: latestPreparedReview.id,
      payload: () => ({
        review_id: latestPreparedReview.id,
        externalSubmission: false,
        visibleUserSubmissionRequired: true
      })
    }] : [])
  ] : [];

  const profileActionCards = jobProfileUnlocked ? [
    {
      actionType: 'job_profile_write',
      toolName: 'job_profile_write',
      title: 'Save job profile',
      summary: 'CubiQo will save your target roles, skills, and experience profile to Supabase after this preview is approved.',
      Icon: User,
      runLabel: 'Save profile',
      riskLevel: 'medium',
      payload: () => ({
        targetRoles: ['Product Manager', 'AI Program Manager', 'Startup Operator'],
        skills: ['AI workflows', 'product strategy', 'operations', 'growth marketing'],
        experienceSummary: 'Profile preview for QA: user can replace this with their real career history before approval.',
        yearsExperience: 10,
        preferredLocations: ['Remote', 'New York, NY'],
        workModes: ['remote', 'hybrid'],
        salaryExpectation: 'Review before sharing externally',
        scanEnabled: true,
        scoreThreshold: 80,
        scanPlatforms: DEFAULT_JOB_SCAN_PROVIDER_IDS,
        scanRecency: '24h',
        scanCadenceHours: 12,
        previewCard: {
          title: 'Job profile write preview',
          before: jobProfile ? {
            targetRoles: jobProfile.targetRoles,
            skills: jobProfile.skills,
            experienceSummary: jobProfile.experienceSummary
          } : null,
          after: {
            targetRoles: ['Product Manager', 'AI Program Manager', 'Startup Operator'],
            skills: ['AI workflows', 'product strategy', 'operations', 'growth marketing'],
            experienceSummary: 'Profile preview for QA: user can replace this with their real career history before approval.',
            scan: {
              enabled: true,
              cadence: 'Every 12 hours',
              recency: 'Last 24 hours',
              threshold: '80+ match score',
              platforms: DEFAULT_JOB_SCAN_PROVIDER_LABELS
            }
          },
          changes: jobProfile ? ['Update target roles', 'Update skills', 'Update experience summary', 'Update scan settings'] : ['Create first job profile', 'Enable 12-hour scan settings'],
          willWriteTo: 'Supabase job_profiles',
          willNotDo: ['No file writes', 'No external submission', 'No job-board action']
        }
      })
    },
    {
      actionType: 'resume_version_write',
      toolName: 'resume_version_write',
      title: 'Save resume version',
      summary: 'CubiQo will append a new named resume version. It never overwrites an existing version.',
      Icon: FileText,
      runLabel: 'Save version',
      riskLevel: 'medium',
      payload: () => ({
        job_profile_id: jobProfile?.id || null,
        name: `QA Resume Version ${resumeVersions.length + 1}`,
        targetRole: jobProfile?.targetRoles?.[0] || 'Product Manager',
        resumeFormat: 'plain_text',
        resumeContent: [
          'QA resume version preview.',
          `Target role: ${jobProfile?.targetRoles?.[0] || 'Product Manager'}.`,
          'Highlights: AI workflows, product strategy, operations, growth marketing.'
        ].join('\n'),
        changeSummary: 'Created a new append-only resume version for review.',
        previewCard: {
          title: 'Resume version diff preview',
          before: resumeVersions[0] ? {
            name: resumeVersions[0].name,
            targetRole: resumeVersions[0].targetRole,
            contentPreview: `${resumeVersions[0].resumeContent || ''}`.slice(0, 220)
          } : null,
          after: {
            name: `QA Resume Version ${resumeVersions.length + 1}`,
            targetRole: jobProfile?.targetRoles?.[0] || 'Product Manager',
            contentPreview: 'QA resume version preview. Highlights: AI workflows, product strategy, operations, growth marketing.'
          },
          changes: ['Append a new resume version record', 'Keep older versions unchanged'],
          willWriteTo: 'Supabase resume_versions',
          willNotDo: ['No file writes', 'No overwrite', 'No external submission']
        }
      })
    }
  ] : [];

  const podActionCards = podWorkflowUnlocked ? [
    {
      actionType: 'pod_design_brief_create',
      toolName: 'pod_design_brief_create',
      title: 'Create POD design brief',
      summary: 'CubiQo will save a structured POD creative brief to Supabase. No GFXTools, Shopify, or Printify action runs.',
      Icon: ShoppingBag,
      runLabel: 'Save brief',
      riskLevel: 'medium',
      payload: () => ({
        title: podProductTitle || 'New POD Product',
        description: 'Create a premium POD apparel graphic with a subtle RGY signal wave, clean CubiQo intelligence aesthetic, no clutter, suitable for a black t-shirt.',
        format: 'image',
        platforms: DEFAULT_SOCIAL_CONTENT_PLATFORMS,
        brandGuidelines: 'Premium, dark, minimal, intelligence-forward; no busy collage; clean signal-wave energy.',
        dimensionsRequested: '1080x1080',
        brandName: 'Your Brand',
        productType: 'premium cotton t-shirt',
        targetAudience: 'AI builders, founders, and operators who like subtle futuristic apparel.',
        styleKeywords: ['minimal', 'premium', 'signal wave', 'monochrome', 'electric accent'],
        colorPalette: ['black', 'soft white', 'teal accent'],
        placement: 'center chest print with small sleeve mark',
        prompt: 'Create a premium POD apparel graphic with a subtle RGY signal wave, clean CubiQo intelligence aesthetic, no clutter, suitable for a black t-shirt.',
        negativePrompt: 'No cheap clipart, no crowded typography, no fake logos, no low-resolution artifacts.',
        fulfillmentTargets: ['Printify', 'Shopify'],
        marketingAngles: ['AI-native founder wear', 'quiet premium intelligence', 'build mode uniform'],
        deliverables: ['front print prompt', 'ad caption angle', 'product positioning note'],
        previewCard: {
          title: 'POD creative brief preview',
          after: {
            title: podProductTitle || 'New POD Product',
            brandName: 'Your Brand',
            productType: 'premium cotton t-shirt',
            format: 'image',
            platforms: DEFAULT_SOCIAL_CONTENT_PLATFORMS,
            prompt: 'Create a premium POD apparel graphic with a subtle RGY signal wave.'
          },
          changes: ['Create structured creative brief', 'Store in Supabase only'],
          willWriteTo: 'Supabase pod_design_briefs',
          willNotDo: ['No GFXTools API call', 'No Shopify product creation', 'No Printify product creation']
        }
      })
    },
    {
      actionType: 'gfxtools_job_create',
      toolName: 'gfxtools_job_create',
      title: 'Submit GFXTools job',
      summary: 'CubiQo will submit the approved creative brief to the server-side GFXTools connector when configured, then save the resulting asset record. Missing credentials create a failed asset state instead of faking success.',
      Icon: Rocket,
      runLabel: 'Submit job',
      riskLevel: 'high',
      podDesignBriefId: latestPodBrief?.id || null,
      payload: () => ({
        brief_id: latestPodBrief?.id || null,
        title: latestPodBrief?.title || podProductTitle || 'New POD Product',
        description: latestPodBrief?.description || latestPodBrief?.prompt || 'Create a premium POD apparel graphic with a subtle RGY signal wave.',
        format: latestPodBrief?.format || 'image',
        dimensions: latestPodBrief?.dimensionsRequested || '1080x1080',
        platforms: latestPodBrief?.platforms || DEFAULT_SOCIAL_CONTENT_PLATFORMS,
        brandGuidelines: latestPodBrief?.brandGuidelines || 'Premium, dark, minimal, intelligence-forward.',
        brandName: latestPodBrief?.brandName || 'Your Brand',
        productType: latestPodBrief?.productType || 'premium cotton t-shirt',
        prompt: latestPodBrief?.prompt || 'Create a premium POD apparel graphic with a subtle RGY signal wave.',
        negativePrompt: latestPodBrief?.negativePrompt || 'No cheap clipart, no crowded typography.',
        styleKeywords: latestPodBrief?.styleKeywords || ['minimal', 'premium', 'signal wave'],
        colorPalette: latestPodBrief?.colorPalette || ['black', 'soft white', 'teal accent'],
        output: {
          format: 'png',
          aspectRatio: '1:1',
          transparentBackground: true
        },
        previewCard: {
          title: 'GFXTools job submission preview',
          after: {
            provider: 'GFXTools',
            briefId: latestPodBrief?.id || null,
            format: latestPodBrief?.format || 'image',
            dimensions: latestPodBrief?.dimensionsRequested || '1080x1080',
            prompt: latestPodBrief?.prompt || 'Create a premium POD apparel graphic with a subtle RGY signal wave.'
          },
          changes: ['Submit to server-side GFXTools connector if configured', 'Save gfxtools_jobs row', 'Save gfx_assets row'],
          willWriteTo: ['Supabase gfxtools_jobs', 'Supabase gfx_assets'],
          willNotDo: ['No client-side connector call', 'No Shopify product creation', 'No Printify product creation', 'No credential exposure']
        }
      })
    },
    ...(latestUnresizedReadyAsset ? [{
      actionType: 'gfxtools_asset_resize',
      toolName: 'gfxtools_asset_resize',
      title: 'Generate platform asset variants',
      summary: `CubiQo will generate platform-sized variants for asset ${latestUnresizedReadyAsset.id.slice(0, 8)} and emit the asset_ready event for social preparation.`,
      Icon: ImageIcon,
      runLabel: 'Resize asset',
      riskLevel: 'medium',
      assetId: latestUnresizedReadyAsset.id,
      payload: () => ({
        asset_id: latestUnresizedReadyAsset.id,
        previewCard: {
          title: 'GFXTools asset resize preview',
          assetId: latestUnresizedReadyAsset.id,
          assetUrl: latestUnresizedReadyAsset.assetUrl,
          variants: ['Instagram 1080x1080', 'Instagram 1080x1920', 'LinkedIn 1200x627', 'X 1600x900', 'TikTok 1080x1920', 'Facebook 1200x630'],
          willWriteTo: ['Supabase gfx_assets.platform_variants', 'Supabase asset_ready_events'],
          willNotDo: ['No social post generation until this event exists', 'No client-side resize API call']
        }
      })
    }] : []),
    ...(latestReadyAsset ? [{
      actionType: 'shopify_product_prepare',
      toolName: 'shopify_product_prepare',
      title: 'Prepare Shopify product',
      summary: `CubiQo will prepare a Shopify product payload from ready asset ${latestReadyAsset.id.slice(0, 8)}. Missing credentials block creation truthfully.`,
      Icon: ShoppingBag,
      runLabel: 'Prepare Shopify',
      riskLevel: 'high',
      assetId: latestReadyAsset.id,
      payload: () => ({
        asset_id: latestReadyAsset.id,
        title: latestPodBrief?.title || podProductTitle || 'New POD Product',
        description: latestPodBrief?.description || 'Premium POD product prepared from a ready GFXTools asset.',
        priceRange: '$29-$49',
        previewCard: {
          title: 'Shopify product approval preview',
          service: 'shopify',
          assetId: latestReadyAsset.id,
          assetUrl: latestReadyAsset.assetUrl,
          estimatedAction: 'create_product',
          product: {
            title: latestPodBrief?.title || podProductTitle || 'New POD Product',
            priceRange: '$29-$49'
          },
          willWriteTo: 'Supabase shopify_product_preparations',
          willNotDo: ['No Shopify API call from browser', 'No fake connected status', 'No publish without approval']
        }
      })
    }, {
      actionType: 'printify_design_prepare',
      toolName: 'printify_design_prepare',
      title: 'Prepare Printify design',
      summary: `CubiQo will map ready asset ${latestReadyAsset.id.slice(0, 8)} to a Printify product template. Missing credentials block submission truthfully.`,
      Icon: Package,
      runLabel: 'Prepare Printify',
      riskLevel: 'high',
      assetId: latestReadyAsset.id,
      payload: () => ({
        asset_id: latestReadyAsset.id,
        productTemplate: 'premium t-shirt',
        placement: 'front',
        previewCard: {
          title: 'Printify design approval preview',
          service: 'printify',
          assetId: latestReadyAsset.id,
          assetUrl: latestReadyAsset.assetUrl,
          estimatedAction: 'submit_design',
          productTemplate: 'premium t-shirt',
          placement: 'front',
          willWriteTo: 'Supabase printify_design_preparations',
          willNotDo: ['No Printify API call from browser', 'No fake connected status', 'No submit without approval']
        }
      })
    }] : [])
  ] : [];

  const commerceActionCards = commerceWorkflowUnlocked ? [
    ...(latestReadyAsset ? [{
      actionType: 'shopify_product_create',
      toolName: 'shopify_product_create',
      title: 'Create Shopify draft product',
      summary: `CubiQo will create or prepare a Shopify draft product for ${shopifyDomain || 'your connected store'} from ready asset ${latestReadyAsset.id.slice(0, 8)}. It uses server-side credentials only and records a blocked state if Shopify is not connected.`,
      Icon: ShoppingBag,
      runLabel: 'Create product',
      riskLevel: 'high',
      assetId: latestReadyAsset.id,
      payload: () => ({
        store_url: shopifyDomain || undefined,
        asset_id: latestReadyAsset.id,
        title: latestPodBrief?.title || podProductTitle || 'New POD Product',
        description: latestPodBrief?.description || podProductDescription || 'POD apparel generated from a ready creative asset.',
        fulfillment_provider: 'printify',
        variants: [
          { title: 'S / Black', price: 29, sku: 'CQ-SIGNAL-S-BLK', inventory_quantity: 25, provider_product_id: '' },
          { title: 'M / Black', price: 29, sku: 'CQ-SIGNAL-M-BLK', inventory_quantity: 25, provider_product_id: '' },
          { title: 'L / Black', price: 29, sku: 'CQ-SIGNAL-L-BLK', inventory_quantity: 25, provider_product_id: '' }
        ],
        tags: ['CubiQo', 'AI', 'POD', 'Signal Wave'],
        collections: [],
        previewCard: {
          title: 'Shopify product creation preview',
          store: shopifyDomain || 'your connected store',
          provider: 'printify',
          assetId: latestReadyAsset.id,
          changes: ['Create Shopify draft product if connector is verified', 'Otherwise store truthful blocked local product record'],
          submittedData: {
            title: latestPodBrief?.title || podProductTitle || 'New POD Product',
            status: 'draft',
            variants: ['S / Black', 'M / Black', 'L / Black'],
            tags: ['CubiQo', 'AI', 'POD', 'Signal Wave']
          },
          willWriteTo: ['Supabase shopify_products', 'Shopify Admin API only if server connector is verified'],
          willNotDo: ['No client-side Shopify call', 'No publish without another approval', 'No fake connected state']
        }
      })
    }, {
      actionType: 'design_create',
      toolName: 'design_create',
      title: 'Create direct POD provider design',
      summary: `CubiQo will submit ready asset ${latestReadyAsset.id.slice(0, 8)} to a direct POD provider only if Printify/Printful/Gelato credentials are configured server-side.`,
      Icon: Package,
      runLabel: 'Create design',
      riskLevel: 'high',
      assetId: latestReadyAsset.id,
      payload: () => ({
        provider: 'printify',
        asset_id: latestReadyAsset.id,
        product_type: latestPodBrief?.productType || 'premium cotton t-shirt',
        template_id: 'review-before-submit',
        previewCard: {
          title: 'Direct POD design submission preview',
          provider: 'printify',
          assetId: latestReadyAsset.id,
          changes: ['Submit design payload to direct provider only if connected', 'Store provider_designs state'],
          willWriteTo: ['Supabase provider_designs', 'Provider API only if server connector is verified'],
          willNotDo: ['No Shopify-app provider direct calls', 'No fake provider_product_id']
        }
      })
    }] : []),
    ...(latestShopifyProduct ? [{
      actionType: 'shopify_product_publish',
      toolName: 'shopify_product_publish',
      title: 'Publish Shopify product',
      summary: `CubiQo will move ${latestShopifyProduct.title} from draft to active after approval and emit product_published for social handoff.`,
      Icon: Rocket,
      runLabel: 'Publish',
      riskLevel: 'high',
      productId: latestShopifyProduct.productId,
      payload: () => ({
        product_id: latestShopifyProduct.productId,
        status: 'active',
        previewCard: {
          title: 'Publish product approval preview',
          store: shopifyDomain || 'your connected store',
          productId: latestShopifyProduct.productId,
          before: { status: latestShopifyProduct.status },
          after: { status: 'active' },
          changes: ['Set product active', 'Emit product_published event'],
          willWriteTo: ['Supabase shopify_products', 'Supabase commerce_events'],
          irreversible: false
        }
      })
    }, {
      actionType: 'shopify_product_archive',
      toolName: 'shopify_product_archive',
      title: 'Archive Shopify product',
      summary: `CubiQo will archive ${latestShopifyProduct.title}. The approval card flags this as irreversible before it runs.`,
      Icon: Archive,
      runLabel: 'Archive',
      riskLevel: 'high',
      productId: latestShopifyProduct.productId,
      payload: () => ({
        product_id: latestShopifyProduct.productId,
        status: 'archived',
        previewCard: {
          title: 'Archive product approval preview',
          store: shopifyDomain || 'your connected store',
          productId: latestShopifyProduct.productId,
          before: { status: latestShopifyProduct.status },
          after: { status: 'archived' },
          changes: ['Archive product'],
          irreversible: true,
          willWriteTo: 'Supabase shopify_products'
        }
      })
    }, {
      actionType: 'shopify_collection_create',
      toolName: 'shopify_collection_create',
      title: 'Create Shopify collection',
      summary: 'CubiQo will prepare a Shopify collection for the product catalog after approval.',
      Icon: Layers,
      runLabel: 'Create collection',
      riskLevel: 'medium',
      payload: () => ({
        title: 'New Collection',
        collection_type: 'manual',
        previewCard: {
          title: 'Collection creation preview',
          store: shopifyDomain || 'your connected store',
          collectionType: 'manual',
          title: 'New Collection',
          willWriteTo: 'Supabase shopify_collections',
          willNotDo: ['No collection publish without connector verification']
        }
      })
    }, {
      actionType: 'shopify_inventory_update',
      toolName: 'shopify_inventory_update',
      title: 'Record inventory adjustment',
      summary: 'CubiQo will record a before/after inventory adjustment after approval.',
      Icon: SlidersHorizontal,
      runLabel: 'Adjust stock',
      riskLevel: 'high',
      productId: latestShopifyProduct.productId,
      payload: () => ({
        product_id: latestShopifyProduct.productId,
        variant_id: latestShopifyProduct.variants?.[0]?.variant_id || latestShopifyProduct.variants?.[0]?.sku || 'review-variant',
        before_quantity: latestShopifyProduct.variants?.[0]?.inventory_quantity || 0,
        after_quantity: Number(latestShopifyProduct.variants?.[0]?.inventory_quantity || 0) + 10,
        previewCard: {
          title: 'Inventory update preview',
          productId: latestShopifyProduct.productId,
          before: latestShopifyProduct.variants?.[0]?.inventory_quantity || 0,
          after: Number(latestShopifyProduct.variants?.[0]?.inventory_quantity || 0) + 10,
          willWriteTo: 'Supabase shopify_inventory_adjustments'
        }
      })
    }, {
      actionType: 'shopify_bundle_create',
      toolName: 'shopify_bundle_create',
      title: 'Create product bundle',
      summary: 'CubiQo will create a bundle configuration from existing products after showing contents and pricing.',
      Icon: Package,
      runLabel: 'Create bundle',
      riskLevel: 'high',
      payload: () => ({
        title: 'CubiQo Founder Drop Bundle',
        product_ids: [latestShopifyProduct.productId],
        pricing: { strategy: 'bundle_discount', discountPercent: 12 },
        previewCard: {
          title: 'Bundle creation preview',
          products: [latestShopifyProduct.title],
          pricing: { strategy: 'bundle_discount', discountPercent: 12 },
          willWriteTo: 'Supabase shopify_bundles',
          willNotDo: ['No Shopify bundle app mutation without connector verification']
        }
      })
    }] : []),
    ...(latestProviderDesign && latestShopifyProduct ? [{
      actionType: 'product_sync',
      toolName: 'product_sync',
      title: 'Sync provider product',
      summary: 'CubiQo will prepare provider-to-Shopify sync state after approval. Missing provider IDs block truthfully.',
      Icon: RefreshCw,
      runLabel: 'Sync product',
      riskLevel: 'high',
      payload: () => ({
        provider_design_id: latestProviderDesign.id,
        product_id: latestShopifyProduct.productId,
        previewCard: {
          title: 'Provider product sync preview',
          providerDesignId: latestProviderDesign.id,
          productId: latestShopifyProduct.productId,
          willWriteTo: 'Supabase provider_product_syncs',
          willNotDo: ['No fake provider sync', 'No silent retry']
        }
      })
    }] : [])
  ] : [];

  const socialActionCards = socialWorkflowUnlocked && latestAssetReadyEvent && latestReadyAsset ? [
    {
      actionType: 'social_post_prepare',
      toolName: 'social_post_prepare',
      title: 'Prepare social post variants',
      summary: `CubiQo will create platform-aware drafts from ready asset ${latestReadyAsset.id.slice(0, 8)}. Pending or failed assets cannot start this workflow.`,
      Icon: Send,
      runLabel: 'Prepare drafts',
      riskLevel: 'medium',
      payload: () => {
        const platforms = DEFAULT_SOCIAL_CONTENT_PLATFORMS.slice(0, 4);
        return {
          asset_id: latestReadyAsset.id,
          assetReadyEventId: latestAssetReadyEvent.id,
          platforms,
          variantCount: 3,
          topic: 'AI-native founder apparel launch',
          productName: latestPodBrief?.title || podProductTitle || 'New POD Product',
          targetAudience: 'AI builders, founders, startup operators, and people launching online businesses',
          cta: 'Vote on the first drop and follow the launch build.',
          previewCard: {
            title: 'Social draft preparation preview',
            assetId: latestReadyAsset.id,
            assetReadyEventId: latestAssetReadyEvent.id,
            assetUrl: latestReadyAsset.assetUrl,
            assetSource: 'asset_ready event',
            platforms,
            contentPlan: 'Generate platform-aware caption, hashtags, and CTA variants for each selected platform.',
            willWriteTo: 'Supabase social_content_drafts',
            willNotDo: ['No platform API call', 'No scheduling', 'No posting', 'No credential exposure']
          }
        };
      }
    },
    ...(latestSocialDraft ? [{
      actionType: 'social_post_schedule_approved',
      toolName: 'social_post_schedule_approved',
      title: 'Schedule approved social cadence',
      summary: `CubiQo will create an editable cadence rule for ${latestSocialDraft.platforms?.join(', ') || 'selected platforms'}. Missing platform credentials block firing instead of faking success.`,
      Icon: Clock3,
      runLabel: 'Create schedule',
      riskLevel: 'high',
      socialContentDraftId: latestSocialDraft.id,
      payload: () => {
        const platforms = latestSocialDraft.platforms?.length ? latestSocialDraft.platforms : DEFAULT_SOCIAL_CONTENT_PLATFORMS.slice(0, 3);
        const intervalMinutes = 10;
        const variantRotationCount = Math.min(3, Math.max(1, platforms.length));
        const startAt = new Date(Date.now() + 10 * 60000).toISOString();
        return {
          social_content_draft_id: latestSocialDraft.id,
          name: 'CubiQo launch cadence',
          intervalMinutes,
          platforms,
          variantRotationCount,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          startAt,
          previewCard: {
            title: 'Social distribution approval preview',
            draftId: latestSocialDraft.id,
            assetUrl: latestSocialDraft.assetUrl,
            gfxToolsJobId: latestSocialDraft.gfxToolsJobId,
            fullContentByPlatform: latestSocialDraft.variants || {},
            platforms,
            cadence: {
              intervalMinutes,
              variantRotationCount,
              startAt,
              scheduleRule: `Every ${intervalMinutes} minutes, rotate ${variantRotationCount} variant${variantRotationCount === 1 ? '' : 's'} across ${platforms.length} platform${platforms.length === 1 ? '' : 's'}.`
            },
            willWriteTo: ['Supabase social_distribution_rules', 'Supabase social_scheduled_posts', 'Supabase social_post_fire_logs when blocked'],
            willNotDo: ['No client-side platform calls', 'No posting without connector credentials and later fire approval', 'No fake connected statuses']
          }
        };
      }
    }] : [])
  ] : [];

  const actionCards = [...baseActionCards, ...browserActionCards, ...jobApplyCards, ...socialQueueCards, ...podApiProductCards, ...jobActionCards, ...profileActionCards, ...podActionCards, ...commerceActionCards, ...socialActionCards];

  const latestApproval = (card) => approvals.find(item => {
    const matchesAction = item.actionType === card.actionType && ['requested', 'approved'].includes(item.status);
    if (!matchesAction) return false;
    if (card.jobListingId && item.payload?.job_listing_id !== card.jobListingId && item.payload?.jobListingId !== card.jobListingId) return false;
    if (card.reviewId && item.payload?.review_id !== card.reviewId && item.payload?.reviewId !== card.reviewId) return false;
    if (card.socialContentDraftId && item.payload?.social_content_draft_id !== card.socialContentDraftId && item.payload?.socialContentDraftId !== card.socialContentDraftId) return false;
    if (card.podProductId && item.payload?.product_id !== card.podProductId && item.payload?.productId !== card.podProductId) return false;
    if (card.assetId && item.payload?.asset_id !== card.assetId && item.payload?.assetId !== card.assetId) return false;
    if (!card.browserSessionId) return true;
    return item.payload?.browser_session_id === card.browserSessionId || item.payload?.browserSessionId === card.browserSessionId;
  });

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
            ...(typeof card.payload === 'function' ? card.payload() : {}),
            preview: card.summary,
            externalExecution: card.actionType.startsWith('browser_') || card.actionType === 'job_apply' || card.actionType === 'social_post_queue' || card.actionType === 'pod_product_create' || card.actionType === 'pod_product_publish' || card.actionType === 'job_application_submit_approved' || card.actionType.startsWith('gfxtools_') || card.actionType.startsWith('shopify_') || card.actionType.startsWith('printify_') || ['design_create', 'product_sync', 'aftership_connect'].includes(card.actionType) || card.actionType === 'social_post_schedule_approved'
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
      const result = await apiJson('/api/actions/approvals', {
        method: 'PATCH',
        body: JSON.stringify({ id: approval.id, status })
      });
      setMessage(result.secondaryConfirmationComplete ? result.message : status === 'approved' ? 'Approved. Run the action when ready.' : 'Action cancelled.');
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
      } else if (card.actionType === 'browser_demo') {
        await apiJson('/api/actions/browser-demo', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id
          })
        });
      } else if (card.actionType === 'job_apply') {
        const payload = typeof card.payload === 'function' ? card.payload() : {};
        await apiJson('/api/actions/job-apply', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            browser_session_id: approval.browserSessionId || approval.payload?.browser_session_id,
            job_url: payload.job_url,
            platform: payload.platform,
            payload
          })
        });
      } else if (card.actionType === 'social_post_queue') {
        const payload = typeof card.payload === 'function' ? card.payload() : {};
        await apiJson('/api/actions/social-post-queue', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            browser_session_id: approval.browserSessionId || approval.payload?.browser_session_id,
            platform: payload.platform,
            content: payload.content,
            media_urls: payload.media_urls,
            payload
          })
        });
      } else if (card.actionType === 'pod_product_create') {
        const payload = typeof card.payload === 'function' ? card.payload() : {};
        await apiJson('/api/actions/pod-product', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            payload
          })
        });
      } else if (card.actionType === 'pod_product_publish') {
        const payload = typeof card.payload === 'function' ? card.payload() : {};
        await apiJson('/api/actions/pod-product/publish', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            payload
          })
        });
      } else if (card.actionType.startsWith('browser_')) {
        await apiJson('/api/actions/execute', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            actionType: card.actionType,
            toolName: card.toolName,
            browserSessionId: card.browserSessionId,
            payload: typeof card.payload === 'function' ? card.payload() : {}
          })
        });
      } else if (card.actionType.startsWith('job_') || card.actionType === 'resume_version_write' || card.actionType.startsWith('pod_') || card.actionType.startsWith('gfxtools_') || card.actionType.startsWith('shopify_') || card.actionType.startsWith('printify_') || ['design_create', 'product_sync', 'aftership_connect'].includes(card.actionType) || card.actionType.startsWith('social_')) {
        await apiJson('/api/actions/execute', {
          method: 'POST',
          body: JSON.stringify({
            approvalId: approval.id,
            actionType: card.actionType,
            toolName: card.toolName,
            payload: typeof card.payload === 'function' ? card.payload() : {}
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

  const stopBrowserSession = async () => {
    if (!activeBrowserSession) return;
    setBusyAction('browser_close');
    setMessage('');
    try {
      await apiJson('/api/actions/execute', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'browser_close',
          toolName: 'browser_close',
          browserSessionId: activeBrowserSession.id
        })
      });
      setMessage('Browser session stopped.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const confirmJobApplication = async (application, decision) => {
    setBusyAction(`${decision}-${application.id}`);
    setMessage('');
    try {
      await apiJson('/api/actions/job-apply/confirm', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: application.id,
          decision
        })
      });
      setMessage(decision === 'submit' ? 'Application submitted by user confirmation.' : 'Application cancelled.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const updateJobTrackerStatus = async (application, status) => {
    setBusyAction(`tracker-${application.id}-${status}`);
    setMessage('');
    try {
      await apiJson('/api/jobs/pipeline', {
        method: 'PATCH',
        body: JSON.stringify({
          target: 'application',
          id: application.id,
          status,
          note: `Marked ${status} from CubiQo actions tracker`
        })
      });
      setMessage(`Application marked ${status}.`);
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const confirmSocialPost = async (post, decision) => {
    setBusyAction(`${decision}-${post.id}`);
    setMessage('');
    try {
      await apiJson('/api/actions/social-post-queue/publish', {
        method: 'POST',
        body: JSON.stringify({
          postId: post.id,
          decision,
          ...(decision === 'publish' ? { confirm: 'user_confirmed_publish' } : {})
        })
      });
      setMessage(decision === 'publish' ? 'Social post published after user confirmation.' : 'Queued social post cancelled.');
      await loadActionState();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const connectShopifyStore = async () => {
    setBusyAction('connect-shopify');
    setMessage('');
    try {
      const result = await apiJson(`/api/connectors/shopify/auth?shop=${encodeURIComponent(shopifyDomain)}`, { method: 'GET' });
      window.location.href = result.authUrl;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const connectPrintify = async () => {
    setBusyAction('connect-printify');
    setMessage('');
    try {
      await apiJson('/api/connectors/printify/connect', {
        method: 'POST',
        body: JSON.stringify({ apiKey: printifyApiKey })
      });
      setPrintifyApiKey('');
      setMessage('Printify connected. API key stored encrypted server-side.');
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
              {browserControlUnlocked && activeBrowserSession && (
                <section style={{ ...cardStyle, padding: 18, borderColor: 'rgba(34,211,238,0.24)', background: 'linear-gradient(135deg, rgba(14,116,144,0.18), rgba(9,9,15,0.72))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.28)', color: '#67e8f9' }}>
                        <Monitor size={19} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Browser session active</h2>
                        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 680 }}>
                          {activeBrowserSession.currentUrl}
                        </div>
                        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.34)', fontSize: '0.7rem' }}>
                          session {activeBrowserSession.id.slice(0, 8)} · approval {activeBrowserSession.approvalId?.slice?.(0, 8) || 'recorded'}
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={stopBrowserSession} disabled={busyAction === 'browser_close'} className="border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/18">
                      <X size={15} />
                      Stop session
                    </Button>
                  </div>
                </section>
              )}

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Shopify API Connector</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{shopifyApiConnection?.status || 'not connected'}</Badge>
                  </div>
                  <input
                    value={shopifyDomain}
                    onChange={event => setShopifyDomain(event.target.value)}
                    placeholder="yourstore.myshopify.com"
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }}
                  />
                  <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.48)', fontSize: '0.74rem', lineHeight: 1.45 }}>
                    {shopifyApiConnection ? `${shopifyApiConnection.shopDomain} · scopes: ${shopifyApiConnection.scope || 'recorded'} · token hidden` : 'OAuth stores the Admin API token encrypted server-side. Billing scopes are never requested.'}
                  </div>
                  <Button type="button" onClick={connectShopifyStore} disabled={busyAction === 'connect-shopify'} className="mt-3 bg-white text-slate-950 hover:bg-white/85">
                    Connect Shopify store
                  </Button>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Printify API Connector</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{printifyApiConnection?.status || 'not connected'}</Badge>
                  </div>
                  <input
                    type="password"
                    value={printifyApiKey}
                    onChange={event => setPrintifyApiKey(event.target.value)}
                    placeholder={printifyApiConnection ? 'API key stored encrypted' : 'Paste Printify API key'}
                    style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }}
                  />
                  <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.48)', fontSize: '0.74rem', lineHeight: 1.45 }}>
                    {printifyApiConnection ? `Printify shop ${printifyApiConnection.shopDomain || 'recorded'} · key hidden` : 'The key is validated before storage and never echoed back to the browser.'}
                  </div>
                  <Button type="button" onClick={connectPrintify} disabled={busyAction === 'connect-printify' || !printifyApiKey.trim()} className="mt-3 bg-white text-slate-950 hover:bg-white/85">
                    Connect Printify
                  </Button>
                </article>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {actionCards.map(card => {
                  const approval = latestApproval(card);
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
                        {approval?.warningMessage && (
                          <div style={{ marginTop: 10, border: '1px solid rgba(251,191,36,0.22)', borderRadius: 12, padding: '9px 10px', background: 'rgba(251,191,36,0.08)', color: '#fde68a', fontSize: '0.74rem', lineHeight: 1.45 }}>
                            {approval.warningMessage}
                            {approval.userConfirmationState === 'confirmed' ? ' Confirmation captured; approve again to run.' : ' First approval confirms this warning.'}
                          </div>
                        )}
                        {card.actionType === 'browser_open' && (
                          <input
                            value={browserUrl}
                            onChange={event => setBrowserUrl(event.target.value)}
                            placeholder="https://example.com/"
                            style={{ marginTop: 12, width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }}
                          />
                        )}
                        {card.actionType === 'job_apply' && (
                          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                            <input
                              value={jobApplyUrl}
                              onChange={event => {
                                setJobApplyUrl(event.target.value);
                                setJobHandoffChecklist(null);
                              }}
                              placeholder="Paste LinkedIn, Indeed, Dice, ATS, or company careers URL"
                              style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.72rem' }}>
                                Detected: {detectJobApplyPlatform(jobApplyUrl)} · stop-before-submit enforced
                              </div>
                              <Button type="button" size="sm" variant="outline" onClick={loadJobHandoffChecklist} disabled={busyAction === 'job-handoff-checklist' || !jobApplyUrl.trim()} className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]">
                                Open checklist
                              </Button>
                            </div>
                            {jobHandoffChecklist && (
                              <div style={{ border: '1px solid rgba(125,211,252,0.18)', background: 'rgba(14,165,233,0.07)', borderRadius: 14, padding: 12, display: 'grid', gap: 9 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                  <strong style={{ color: 'rgba(255,255,255,0.86)', fontSize: '0.82rem' }}>{jobHandoffChecklist.providerLabel} handoff</strong>
                                  <Badge variant="outline" className="border-cyan-300/20 text-cyan-100/70">Final CTA: user</Badge>
                                </div>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.74rem', lineHeight: 1.45 }}>{jobHandoffChecklist.summary}</p>
                                <div style={{ display: 'grid', gap: 6 }}>
                                  {(jobHandoffChecklist.steps || []).map((step, index) => (
                                    <div key={step.id || index} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, alignItems: 'start', color: 'rgba(255,255,255,0.68)', fontSize: '0.72rem', lineHeight: 1.35 }}>
                                      <span style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.12)', color: '#a7f3d0', fontSize: '0.62rem' }}>{index + 1}</span>
                                      <span><strong style={{ color: 'rgba(255,255,255,0.82)' }}>{step.label}</strong> · {step.detail}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {card.actionType === 'social_post_queue' && (
                          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                            <select
                              value={socialQueuePlatform}
                              onChange={event => setSocialQueuePlatform(event.target.value)}
                              style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }}
                            >
                              {SOCIAL_QUEUE_UI_PLATFORMS.filter(platform => platform.supportsQueue).map(platform => (
                                <option key={platform.id} value={platform.id}>{platform.label}</option>
                              ))}
                            </select>
                            <textarea
                              value={socialQueueContent}
                              onChange={event => setSocialQueueContent(event.target.value)}
                              placeholder="Draft post content"
                              rows={4}
                              style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                            <textarea
                              value={socialQueueMediaUrls}
                              onChange={event => setSocialQueueMediaUrls(event.target.value)}
                              placeholder="Optional media URLs, one per line. Required for Instagram."
                              rows={2}
                              style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                            <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.72rem' }}>
                              Compose only. Publish is blocked until the separate user button.
                            </div>
                          </div>
                        )}
                        {card.actionType === 'pod_product_create' && (
                          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                            <input value={podProductTitle} onChange={event => setPodProductTitle(event.target.value)} placeholder="Product title" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }} />
                            <textarea value={podProductDescription} onChange={event => setPodProductDescription(event.target.value)} placeholder="Product description" rows={3} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem', resize: 'vertical' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <input value={podPrintProviderId} onChange={event => setPodPrintProviderId(event.target.value)} placeholder="Print provider id" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }} />
                              <input value={podBlueprintId} onChange={event => setPodBlueprintId(event.target.value)} placeholder="Blueprint id" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem' }} />
                            </div>
                            <textarea value={podMediaAssets} onChange={event => setPodMediaAssets(event.target.value)} placeholder="Media asset URLs, one per line" rows={2} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.88)', padding: '10px 11px', outline: 'none', fontSize: '0.82rem', resize: 'vertical' }} />
                          </div>
                        )}
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

              {latestBrowserReceipt && (
                <section style={{ ...cardStyle, padding: 18, borderColor: 'rgba(125,211,252,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Latest Browser Visual Receipt</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{latestBrowserReceipt.actionType}</Badge>
                  </div>
                  <a href={latestBrowserReceipt.screenshotUrl || latestBrowserReceipt.result?.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', fontSize: '0.78rem' }}>
                    Open signed screenshot
                  </a>
                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.46)', fontSize: '0.74rem', lineHeight: 1.5 }}>
                    {latestBrowserReceipt.message}
                  </div>
                </section>
              )}

              {latestReadyJobApplication && (
                <section style={{ ...cardStyle, padding: 18, borderColor: 'rgba(16,185,129,0.26)', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(9,9,15,0.72))' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Application ready for your final submit</h2>
                      <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.58)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {latestReadyJobApplication.jobTitle || 'Job application'} · {latestReadyJobApplication.company || latestReadyJobApplication.platform}
                      </div>
                      <a href={latestReadyJobApplication.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 9, color: '#7dd3fc', fontSize: '0.78rem' }}>
                        Open review-screen visual receipt
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button type="button" onClick={() => confirmJobApplication(latestReadyJobApplication, 'submit')} disabled={busyAction === `submit-${latestReadyJobApplication.id}`} className="bg-emerald-400/90 text-slate-950 hover:bg-emerald-300">
                        <CheckCircle2 size={15} />
                        Submit application
                      </Button>
                      <Button type="button" variant="outline" onClick={() => confirmJobApplication(latestReadyJobApplication, 'cancel')} disabled={busyAction === `cancel-${latestReadyJobApplication.id}`} className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]">
                        <X size={15} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              {latestReadySocialPost && (
                <section style={{ ...cardStyle, padding: 18, borderColor: 'rgba(56,189,248,0.26)', background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(9,9,15,0.72))' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>Social post ready for your publish button</h2>
                      <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.58)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {latestReadySocialPost.platform} · {(latestReadySocialPost.content || '').slice(0, 140)}
                      </div>
                      {latestReadySocialPost.previewScreenshotUrl && (
                        <a href={latestReadySocialPost.previewScreenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 9, color: '#7dd3fc', fontSize: '0.78rem' }}>
                          Open composed-post visual receipt
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button type="button" onClick={() => confirmSocialPost(latestReadySocialPost, 'publish')} disabled={busyAction === `publish-${latestReadySocialPost.id}`} className="bg-emerald-400/90 text-slate-950 hover:bg-emerald-300">
                        <CheckCircle2 size={15} />
                        Publish
                      </Button>
                      <Button type="button" variant="outline" onClick={() => confirmSocialPost(latestReadySocialPost, 'cancel')} disabled={busyAction === `cancel-${latestReadySocialPost.id}`} className="border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]">
                        <X size={15} />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Saved Jobs</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{jobListings.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {jobListings.length ? jobListings.slice(0, 5).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.title}</div>
                        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem' }}>{item.company} · {item.location || item.sourcePlatform}</div>
                        <div style={{ marginTop: 7, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.sourcePlatform}</Badge>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No saved listings yet. Use the approved save action with LinkedIn, Indeed, or Dice extracted listings.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Application Review Cards</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{jobReviews.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {jobReviews.length ? jobReviews.slice(0, 4).map(item => {
                      const payload = item.submissionPayload || {};
                      const packet = payload.applicationPacket || {};
                      const missingPrompts = packet.missingAnswerPrompts || payload.missingAnswerPrompts || [];
                      const answerCount = (packet.applicationAnswers || payload.answers || []).length;
                      return (
                        <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{payload.job?.title || 'Prepared application'}</div>
                            <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                          </div>
                          <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem' }}>
                            {payload.job?.company || item.sourcePlatform} · external submit: {item.externalSubmissionPerformed ? 'yes' : 'no'}
                          </div>
                          <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                            Candidate: {payload.candidate?.name || 'not set'} · Target: {payload.targetUrl || 'not set'}
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <Badge variant="outline" className="border-white/10 text-white/45">
                              {packet.fit?.score ? `${packet.fit.score}% fit` : 'fit pending'}
                            </Badge>
                            <Badge variant="outline" className="border-white/10 text-white/45">
                              {answerCount} answer{answerCount === 1 ? '' : 's'}
                            </Badge>
                            <Badge variant="outline" className="border-white/10 text-white/45">
                              {missingPrompts.length} prompt{missingPrompts.length === 1 ? '' : 's'}
                            </Badge>
                          </div>
                          {packet.recruiterMessage && (
                            <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(167,139,250,0.16)', color: 'rgba(237,233,254,0.82)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                              <strong style={{ color: '#ddd6fe' }}>Recruiter note:</strong> {String(packet.recruiterMessage).split('\n').slice(0, 2).join(' ')}
                            </div>
                          )}
                          {missingPrompts.length > 0 && (
                            <div style={{ marginTop: 9, color: '#fde68a', fontSize: '0.72rem', lineHeight: 1.45 }}>
                              Needs user answer: {missingPrompts[0].question || missingPrompts[0].field}
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No review cards yet. Prepare one from a saved listing to see the exact submission payload.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Job Apply Tracker</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{jobApplications.length}</Badge>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {trackerStatuses.slice(0, 7).map(status => (
                      <Badge key={status} variant="outline" className="border-white/10 text-white/45">
                        {status}: {trackerCounts[status] || 0}
                      </Badge>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {jobApplications.length ? jobApplications.slice(0, 5).map(item => {
                      const trackerStatus = trackerStatusFor(item);
                      const handoff = item.metadata?.handoff_checklist || item.metadata?.handoffChecklist || null;
                      const stepReceipts = item.metadata?.step_receipts || item.metadata?.stepReceipts || [];
                      const userInputPrompts = item.metadata?.user_input_prompts || item.metadata?.userInputPrompts || [];
                      return (
                        <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.jobTitle || 'Application workflow'}</div>
                            <Badge variant="outline" className="border-white/10 text-white/45">{trackerStatus}</Badge>
                          </div>
                          <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem' }}>
                            {item.company || item.platform} · raw {item.status} · session {item.browserSessionId?.slice?.(0, 8) || 'recorded'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                            {['applied', 'response', 'interview', 'offer', 'rejected', 'withdrawn'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => updateJobTrackerStatus(item, status)}
                                disabled={busyAction === `tracker-${item.id}-${status}` || trackerStatus === status}
                                style={{
                                  border: '1px solid rgba(255,255,255,0.09)',
                                  borderRadius: 999,
                                  background: trackerStatus === status ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.035)',
                                  color: trackerStatus === status ? '#bbf7d0' : 'rgba(255,255,255,0.58)',
                                  padding: '5px 8px',
                                  fontSize: '0.68rem',
                                  cursor: trackerStatus === status ? 'default' : 'pointer'
                                }}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                          {item.metadata?.tracker_note && (
                            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.46)', fontSize: '0.7rem' }}>{item.metadata.tracker_note}</div>
                          )}
                          {handoff?.steps?.length > 0 && (
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <button type="button" style={{ marginTop: 9, border: '1px solid rgba(125,211,252,0.18)', borderRadius: 10, background: 'rgba(14,165,233,0.07)', color: '#bae6fd', padding: '7px 9px', fontSize: '0.72rem', cursor: 'pointer' }}>
                                  Handoff checklist · {handoff.providerLabel || item.platform}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                                  {handoff.steps.map((step, index) => (
                                    <div key={step.id || index} style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', lineHeight: 1.4 }}>
                                      <span style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.12)', color: '#a7f3d0', fontSize: '0.6rem' }}>{index + 1}</span>
                                      <span><strong style={{ color: 'rgba(255,255,255,0.78)' }}>{step.label}</strong> · {step.detail}</span>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          {userInputPrompts.length > 0 && (
                            <div style={{ marginTop: 9, border: '1px solid rgba(251,191,36,0.18)', borderRadius: 10, background: 'rgba(251,191,36,0.07)', padding: 10, color: '#fde68a', fontSize: '0.7rem', lineHeight: 1.45 }}>
                              <strong>Needs user confirmation:</strong> {userInputPrompts.slice(0, 3).map(prompt => prompt.field).join(', ')}
                            </div>
                          )}
                          {stepReceipts.length > 0 && (
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <button type="button" style={{ marginTop: 9, border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, background: 'rgba(34,197,94,0.07)', color: '#bbf7d0', padding: '7px 9px', fontSize: '0.72rem', cursor: 'pointer' }}>
                                  Step receipts · {stepReceipts.length}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                                  {stepReceipts.map((receipt, index) => (
                                    <a key={receipt.stepId || index} href={receipt.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 10, padding: 8, background: 'rgba(0,0,0,0.22)', color: '#7dd3fc', fontSize: '0.7rem', textDecoration: 'none' }}>
                                      {index + 1}. {receipt.label || receipt.stepId || 'Browser step'} · open receipt
                                    </a>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          {item.screenshotUrl && (
                            <a href={item.screenshotUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#7dd3fc', fontSize: '0.74rem' }}>
                              Open visual receipt
                            </a>
                          )}
                          {item.status === 'failed' && (
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <button type="button" style={{ marginTop: 9, border: '1px solid rgba(248,113,113,0.22)', borderRadius: 10, background: 'rgba(248,113,113,0.08)', color: '#fecaca', padding: '7px 9px', fontSize: '0.72rem', cursor: 'pointer' }}>
                                  What the browser saw
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <pre style={{ marginTop: 8, maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.58)', fontSize: '0.68rem' }}>
                                  {JSON.stringify(item.accessibilityTreeSnapshot || item.error || {}, null, 2)}
                                </pre>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No job apply workflows yet. Paste a job URL, request approval, then run the approved prepare step.
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Job Profile</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{jobProfile ? 'saved' : 'empty'}</Badge>
                  </div>
                  {jobProfile ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <div style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>
                          {(jobProfile.targetRoles || []).slice(0, 3).join(' · ') || 'Target roles saved'}
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {(jobProfile.skills || []).slice(0, 6).join(', ') || 'No skills listed yet'}
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          {jobProfile.experienceSummary || 'No experience summary yet'}
                        </div>
                        <div style={{ marginTop: 9, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <Badge variant="outline" className="border-white/10 text-white/50">
                            Scan {jobProfile.scanEnabled ? 'on' : 'off'}
                          </Badge>
                          <Badge variant="outline" className="border-white/10 text-white/50">
                            {jobProfile.scanRecency || '24h'}
                          </Badge>
                          <Badge variant="outline" className="border-white/10 text-white/50">
                            {jobProfile.scoreThreshold || 60}+ score
                          </Badge>
                          <Badge variant="outline" className="border-white/10 text-white/50">
                            {(jobProfile.scanPlatforms || []).length || 'default'} sources
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      No profile saved yet. Use the approved profile write action to create target roles, skills, and experience context.
                    </div>
                  )}
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Resume Versions</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{resumeVersions.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {resumeVersions.length ? resumeVersions.slice(0, 5).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.name}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">append-only</Badge>
                        </div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem' }}>
                          {item.targetRole || 'General'} · {item.resumeFormat}
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          {(item.resumeContent || '').slice(0, 180)}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No resume versions yet. Each approved save creates a new version and leaves old versions untouched.
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>POD Connectors</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{podConnectors.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {podConnectors.length ? podConnectors.map(item => {
                      const tone = item.state === 'connected' ? '#34d399' : item.state === 'configured_unverified' ? '#fbbf24' : '#94a3b8';
                      return (
                        <div key={item.provider} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.label}</div>
                            <Badge variant="outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: tone }}>{item.state}</Badge>
                          </div>
                          <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.52)', fontSize: '0.73rem', lineHeight: 1.45 }}>
                            {item.note || 'Connector status unavailable.'}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        Connector status is unavailable. Refresh after signing in.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>POD Design Briefs</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{podDesignBriefs.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {podDesignBriefs.length ? podDesignBriefs.slice(0, 4).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.brandName || 'POD brief'} · {item.productType}</div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {(item.styleKeywords || []).slice(0, 6).join(', ') || 'No style keywords'}
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          {(item.prompt || '').slice(0, 190)}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No POD briefs yet. Save a brief before preparing provider payloads.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>GFXTools Jobs</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{gfxToolsJobs.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {gfxToolsJobs.length ? gfxToolsJobs.slice(0, 4).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.jobPayload?.productType || 'GFXTools payload'}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem' }}>
                          connector: {item.connectorState} · external call: {item.externalCallPerformed ? 'yes' : 'no'}
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          {(item.jobPayload?.prompt || '').slice(0, 190)}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No GFXTools payloads yet. Prepared payloads stay in Supabase until a verified connector execution exists.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>GFX Assets</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{gfxAssets.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {gfxAssets.length ? gfxAssets.slice(0, 4).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.assetType} · {item.dimensions?.width || '?'}x{item.dimensions?.height || '?'}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          variants: {(item.platformVariants || []).length} · ready event: {assetReadyEvents.some(event => event.assetId === item.id) ? 'yes' : 'no'}
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45, wordBreak: 'break-word' }}>
                          {item.assetUrl || item.errorMessage || 'No asset URL yet.'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No GFX asset records yet. A GFXTools job creates an asset record, then resize emits the asset-ready handoff.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Shopify / Printify Prep</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{shopifyPreparations.length + printifyPreparations.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {[...shopifyPreparations.map(item => ({ ...item, service: 'Shopify' })), ...printifyPreparations.map(item => ({ ...item, service: 'Printify' }))].length ? (
                      [...shopifyPreparations.map(item => ({ ...item, service: 'Shopify' })), ...printifyPreparations.map(item => ({ ...item, service: 'Printify' }))].slice(0, 5).map(item => (
                        <div key={`${item.service}-${item.id}`} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.service} · asset {item.assetId?.slice(0, 8)}</div>
                            <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                          </div>
                          <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                            connector: {item.connectorState} · external call: {item.externalCallPerformed ? 'yes' : 'no'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No Shopify or Printify payloads yet. These appear only after a ready asset is approved for connector preparation.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Shopify Products</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{shopifyProducts.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {shopifyProducts.length ? shopifyProducts.slice(0, 5).map(item => (
                      <div key={item.productId} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.title}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          provider: {item.fulfillmentProvider} · sync: {item.syncStatus} · external call: {item.externalCallPerformed ? 'yes' : 'no'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No Shopify product records yet. Product creation starts only from a ready GFX asset and an approval card.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Fulfilment Providers</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{fulfillmentProviders.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {fulfillmentProviders.length ? fulfillmentProviders.slice(0, 8).map(item => {
                      const tone = item.status === 'active' || item.status === 'connected' ? '#34d399' : item.status === 'configured_unverified' ? '#fbbf24' : '#94a3b8';
                      return (
                        <div key={item.provider} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.provider}</div>
                            <Badge variant="outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: tone }}>{item.status}</Badge>
                          </div>
                          <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.52)', fontSize: '0.73rem', lineHeight: 1.45 }}>
                            {item.connection_type || item.connectionType} · {item.shopify_app_url || 'direct API connector'}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        Provider manifest appears after the fulfilment read action runs. Shopify-app providers are routing-only in V2.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Commerce Events</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{commerceEvents.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {commerceEvents.length ? commerceEvents.slice(0, 5).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.event_type || item.eventType}</div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.52)', fontSize: '0.73rem', lineHeight: 1.45 }}>
                          provider: {item.provider || 'n/a'} · asset: {(item.asset_id || item.assetId || '').slice(0, 8) || 'n/a'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No commerce handoff events yet. product_published and store_summary events appear only after approved operations.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>POD API Products</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{apiPodProducts.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {apiPodProducts.length ? apiPodProducts.slice(0, 5).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.title || 'POD product'}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.52)', fontSize: '0.73rem', lineHeight: 1.45 }}>
                          Shopify {item.shopifyProductId || 'pending'} · Printify {item.printifyProductId || 'pending'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No API-created POD products yet. Product creation stops at ready; publishing needs a separate approval.
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Social Connectors</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialConnectors.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialConnectors.length ? socialConnectors.map(item => {
                      const tone = item.state === 'connected' ? '#34d399' : item.state === 'configured_unverified' ? '#fbbf24' : '#94a3b8';
                      return (
                        <div key={item.provider} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.label}</div>
                            <Badge variant="outline" style={{ borderColor: 'rgba(255,255,255,0.1)', color: tone }}>{item.state}</Badge>
                          </div>
                          <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.52)', fontSize: '0.73rem', lineHeight: 1.45 }}>
                            {item.note || 'Connector status unavailable.'}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        Social connector status is unavailable. Refresh after signing in.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Social Drafts</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialDrafts.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialDrafts.length ? socialDrafts.slice(0, 4).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.assetSource || 'asset'} · {item.assetType}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {(item.platforms || []).join(', ') || 'No platforms'} · variants saved by platform
                        </div>
                        <div style={{ marginTop: 9, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.24)', color: 'rgba(255,255,255,0.58)', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          {Object.entries(item.variants || {}).slice(0, 2).map(([platform, variants]) => `${platform}: ${(variants || [])[0]?.caption || 'drafted'}`).join(' | ') || 'No variant preview available.'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No social drafts yet. Prepare drafts from an approved asset before creating a cadence.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Queued Social Posts</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialQueuedPosts.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialQueuedPosts.length ? socialQueuedPosts.slice(0, 5).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.platform}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {(item.content || '').slice(0, 150) || 'No content'}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {item.previewScreenshotUrl && (
                            <a href={item.previewScreenshotUrl} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', fontSize: '0.74rem' }}>
                              Preview receipt
                            </a>
                          )}
                          {item.metadata?.published_screenshot_url && (
                            <a href={item.metadata.published_screenshot_url} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc', fontSize: '0.74rem' }}>
                              Published receipt
                            </a>
                          )}
                        </div>
                        {item.status === 'failed' && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <button type="button" style={{ marginTop: 9, border: '1px solid rgba(248,113,113,0.22)', borderRadius: 10, background: 'rgba(248,113,113,0.08)', color: '#fecaca', padding: '7px 9px', fontSize: '0.72rem', cursor: 'pointer' }}>
                                What the browser saw
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <pre style={{ marginTop: 8, maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.58)', fontSize: '0.68rem' }}>
                                {JSON.stringify(item.accessibilityTreeSnapshot || item.error || {}, null, 2)}
                              </pre>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No queued posts yet. Compose creates a preview receipt first; publishing stays a separate user button.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Distribution Rules</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialDistributionRules.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialDistributionRules.length ? socialDistributionRules.slice(0, 4).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.name || 'Social cadence'}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          Every {item.intervalMinutes} minutes · {(item.platforms || []).join(', ')} · rotate {item.variantRotationCount}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No cadence rules yet. The 10-10-10 pattern is user-configurable, not hardcoded.
                      </div>
                    )}
                  </div>
                </article>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Scheduled Social Posts</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialScheduledPosts.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialScheduledPosts.length ? socialScheduledPosts.slice(0, 6).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.platform} · variant {Number(item.variantIndex) + 1}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : 'No time'} · connector {item.connectorState}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No scheduled social posts yet. Scheduling creates rows only after approval.
                      </div>
                    )}
                  </div>
                </article>

                <article style={{ ...cardStyle, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Social Fire Logs</h2>
                    <Badge variant="outline" className="border-white/10 text-white/50">{socialFireLogs.length}</Badge>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {socialFireLogs.length ? socialFireLogs.slice(0, 6).map(item => (
                      <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.025)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ color: '#fff', fontSize: '0.86rem', fontWeight: 600 }}>{item.platform}</div>
                          <Badge variant="outline" className="border-white/10 text-white/45">{item.status}</Badge>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.56)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                          {item.message || 'No message'}
                        </div>
                      </div>
                    )) : (
                      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                        No fire logs yet. Missing credentials will create truthful blocked logs, not fake posts.
                      </div>
                    )}
                  </div>
                </article>
              </section>

              {/* Automations management panel */}
              <section style={{ ...cardStyle, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Automations</h2>
                  <Badge variant="outline" className="border-white/10 text-white/50">{schedules.length} scheduled</Badge>
                </div>
                {schedules.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.8rem' }}>
                    No automations yet. Ask CubiQo to create a daily or weekly report schedule.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {schedules.map((s, i) => (
                      <div key={s.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 10, alignItems: 'center', borderTop: i ? undefined : undefined }}>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>
                            {s.cadence} · {s.status} {s.nextRunAt ? `· next ${new Date(s.nextRunAt).toLocaleString()}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const newStatus = s.status === 'active' ? 'paused' : 'active';
                            await apiJson('/api/reports/schedules', { method: 'PATCH', body: JSON.stringify({ id: s.id, status: newStatus }) });
                            setSchedules(prev => prev.map(x => x.id === s.id ? { ...x, status: newStatus } : x));
                          }}
                          style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                        >
                          {s.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={async () => {
                            await apiJson('/api/reports/schedules', { method: 'PATCH', body: JSON.stringify({ id: s.id, status: 'cancelled' }) });
                            setSchedules(prev => prev.filter(x => x.id !== s.id));
                          }}
                          style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'rgba(239,68,68,0.7)', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Tasks', value: tasks.length, items: tasks.map(item => item.title) },
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
                    <div key={log.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '9px 10px', color: 'rgba(255,255,255,0.66)', fontSize: '0.76rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                        <span>{log.status}</span>
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                        <span style={{ color: 'rgba(255,255,255,0.36)' }}>{log.actionType}</span>
                      </div>
                      {(log.screenshotUrl || log.blockReason || log.accessibilityTreeSnapshot) && (
                        <div style={{ marginTop: 8, display: 'grid', gap: 6, color: 'rgba(255,255,255,0.42)', fontSize: '0.68rem' }}>
                          {log.blockReason && <span>block: {log.blockReason}</span>}
                          {log.screenshotUrl && <a href={log.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc' }}>signed screenshot receipt</a>}
                          {log.accessibilityTreeSnapshot && (
                            <details>
                              <summary style={{ cursor: 'pointer', color: '#fde68a' }}>What the browser saw</summary>
                              <pre style={{ margin: '8px 0 0', maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.58)' }}>
                                {JSON.stringify(log.accessibilityTreeSnapshot, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>No audit entries yet.</div>
                  )}
                </div>
              </section>

              <section style={{ ...cardStyle, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>V2 Capability Boundary</h2>
                  <Badge variant="outline" className="border-white/10 text-white/50">
                    {capabilities.filter(item => item.status === 'active').length} active
                  </Badge>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {capabilities.length ? capabilities.map(item => {
                    const isActive = item.status === 'active';
                    const isReadOnly = item.status === 'read_only';
                    const tone = isActive ? '#34d399' : isReadOnly ? '#7dd3fc' : '#fbbf24';
                    return (
                      <div key={item.actionType} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.035)', minHeight: 126 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tone }}>
                            {isActive ? <CheckCircle2 size={14} /> : <Lock size={14} />}
                            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{item.label}</span>
                          </div>
                          <span style={{ color: tone, fontSize: '0.62rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>{item.status}</span>
                        </div>
                        <div style={{ marginTop: 7, color: 'rgba(255,255,255,0.46)', fontSize: '0.72rem', lineHeight: 1.45 }}>{item.summary}</div>
                        {!isActive && (
                          <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.34)', fontSize: '0.68rem', lineHeight: 1.35 }}>
                            Needs: {(item.requirements || []).slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.78rem' }}>Capability manifest unavailable.</div>
                  )}
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [recommendationCards, setRecommendationCards] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [diagHealth, setDiagHealth] = useState(null); // null=unknown, true=ok, false=warn
  const [jobPipelineOpen, setJobPipelineOpen] = useState(false);
  const [duoModeOpen, setDuoModeOpen] = useState(false);
  const [duoModeCapsule, setDuoModeCapsule] = useState(null);
  // Feature overlay — Next-app pages presented as overlays INSIDE /app.
  // Nothing in this UI redirects; every screen is an overlay on the hero.
  const [featureOverlay, setFeatureOverlay] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [keywords, setKeywords] = useState({ green: [], yellow: [], red: [] });
  const [signals, setSignals] = useState([]);
  const [signalSyncStatus, setSignalSyncStatus] = useState('');
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');

  // ── Agentic Dashboards ────────────────────────────────────────────────────
  // Dashboards exist only after a capsule is launched (the RGY capsule is the
  // door to agentic — there is no separate tab and no manual "add dashboard").
  const [agentTasks, setAgentTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cubiqo_agent_tasks') || '[]'); } catch { return []; }
  });
  const launchCapsuleDashboard = (label, colorHex) => {
    const clean = String(label || '').trim();
    if (!clean) return null;
    const existing = agentTasks.find(t => t.label.toLowerCase() === clean.toLowerCase());
    if (existing) return existing;
    const task = { id: Date.now(), label: clean, color: colorHex || null };
    const tasks = [...agentTasks, task];
    setAgentTasks(tasks);
    localStorage.setItem('cubiqo_agent_tasks', JSON.stringify(tasks));
    return task;
  };
  const removeAgentTask = (id) => {
    const tasks = agentTasks.filter(t => t.id !== id);
    setAgentTasks(tasks);
    localStorage.setItem('cubiqo_agent_tasks', JSON.stringify(tasks));
  };
  const [projectIds, setProjectIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cubiqo_project_ids') || '{}'); } catch { return {}; }
  });
  const [duoProjectId, setDuoProjectId] = useState(null);
  // Unified DuoMode launcher — replaces the old openDashboard path.
  // Creates or reuses a duo_project, then opens DuoModeDashboard with the
  // resolved projectId so WorkspacePanel can poll live workspace data.
  const openWorkspace = async (task, signalOverride) => {
    const taskId = String(task.id);
    const goal   = task.label || task.keyword || task.color || 'Capsule';
    const capsule = signalOverride || {
      keyword: goal,
      color: task.color?.startsWith('#')
        ? Object.keys(colorMap).find(k => colorMap[k]?.hex === task.color) || 'yellow'
        : task.color || 'yellow',
      confirmed_intents: [],
      suggested_intents: [],
    };
    if (!accessToken) {
      setDuoModeCapsule(capsule);
      setDuoProjectId(null);
      setDuoModeOpen(true);
      return;
    }
    let projectId = projectIds[taskId];
    if (!projectId) {
      try {
        const res  = await fetch('/api/duo/projects', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.project?.id) {
          projectId = json.project.id;
          const newMap = { ...projectIds, [taskId]: projectId };
          setProjectIds(newMap);
          localStorage.setItem('cubiqo_project_ids', JSON.stringify(newMap));
        }
      } catch {}
    }
    setDuoModeCapsule(capsule);
    setDuoProjectId(projectId || null);
    setDuoModeOpen(true);
  };
  // ── End Agentic Dashboard ─────────────────────────────────────────────────

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
  const [accessToken, setAccessToken] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profileSyncError, setProfileSyncError] = useState('');
  const [uiVisible, setUiVisible] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [imageAttachment, setImageAttachment] = useState(null);   // base64 for API
  const [imagePreview, setImagePreview] = useState(null);         // data URL for display
  const [imageGenResult, setImageGenResult] = useState(null);     // last generated image
  const [imageLoading, setImageLoading] = useState(false);
  const imageInputRef = useRef(null);
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

  // Fetch system health on mount and whenever the left panel opens
  useEffect(() => {
    if (diagHealth !== null) return;
    fetch('/api/diagnostics')
      .then(r => r.json())
      .then(d => {
        const checks = d.checks || {};
        const ok = checks.supabase?.ok && (checks.openai || checks.anthropic || checks.openrouter);
        setDiagHealth(Boolean(ok));
      })
      .catch(() => setDiagHealth(false));
  }, [diagHealth]);

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
  const listeningStartedAtRef = useRef(0);
  // Voice-convo state:
  //   cueAlreadySpokenRef     → has the "I am listening" cue been spoken yet
  //                             in this browser session? Played once per session.
  //   skipNextCueRef          → set when auto-restarting mic after AI finishes
  //                             speaking, so we don't re-greet between turns.
  //   conversationActiveRef   → user is in continuous voice convo mode.
  //                             True from first tap until user explicitly stops.
  const cueAlreadySpokenRef = useRef(false);
  const skipNextCueRef = useRef(false);
  const conversationActiveRef = useRef(false);
  const callBackendRef = useRef(null);
  const toggleListeningRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const voiceReplyRequestedRef = useRef(false);

  const unlockAudioPlayback = () => {
    audioUnlockedRef.current = true;
    try {
      localStorage.setItem('cubiqo_audio_unlocked', '1');
    } catch {}
  };

  const isAudioPlaybackUnlocked = () => {
    if (audioUnlockedRef.current) return true;
    try {
      return localStorage.getItem('cubiqo_audio_unlocked') === '1';
    } catch {
      return false;
    }
  };

  const processRecommendationCards = async (responseText, signalId = null) => {
    if (!responseText) return responseText;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const recRes = await fetch('/api/recommendations/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({ responseText, signalId })
      });
      const recPayload = await recRes.json().catch(() => ({}));
      if (Array.isArray(recPayload.cards)) setRecommendationCards(recPayload.cards);
      if (recPayload.enrichedText) return recPayload.enrichedText;
    } catch (error) {
      console.warn('Recommendation post-processing failed:', error.message);
    }
    return responseText;
  };

  const applyOutputSafety = async (responseText, userInput) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const safetyRes = await fetch('/api/safety/output', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({ input: userInput, output: responseText })
      });
      const payload = await safetyRes.json().catch(() => ({}));
      return payload.safeText || responseText;
    } catch (error) {
      console.warn('Output safety check failed:', error.message);
      return responseText;
    }
  };

  const migratePhaseALocalSession = async (session) => {
    const sessionUser = session?.user;
    if (!sessionUser?.id || typeof window === 'undefined') return;

    let localSession = null;
    try {
      localSession = JSON.parse(localStorage.getItem('cubiqo_session') || 'null');
    } catch {
      localSession = null;
    }

    if (!localSession || localSession.migrated_user_id === sessionUser.id) return;

    const signalsToMigrate = Array.isArray(localSession.signals) ? localSession.signals.slice(-5) : [];
    const latestSignal = signalsToMigrate[signalsToMigrate.length - 1] || null;
    const summary = localSession.last_summary
      || latestSignal?.keyword
      || visitMemory[visitMemory.length - 1]?.user_message
      || null;

    try {
      await supabase.from('profiles').upsert({
        id: sessionUser.id,
        display_name: localSession.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || null,
        voice_preference: localSession.voice_preference === 'voice' ? 'voice' : 'text',
        language_preference: localSession.language_preference || navigator.language || 'en',
        primary_goal: latestSignal?.keyword || undefined,
        onboarding_done: Boolean(latestSignal?.keyword),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (localSession.permissions) {
        await supabase.from('user_permissions').upsert({
          user_id: sessionUser.id,
          mic: localSession.permissions.mic || 'pending',
          camera: localSession.permissions.camera || 'pending',
          memory: localSession.permissions.memory || 'pending',
          location: localSession.permissions.location || 'pending',
          push: localSession.permissions.push || 'pending',
          tracking: localSession.permissions.tracking || 'pending',
          metadata: { migrated_from: 'localStorage' },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }

      if (summary) {
        await supabase.from('memory_events').insert({
          user_id: sessionUser.id,
          event_type: latestSignal?.keyword ? 'goal_update' : 'session_summary',
          summary: String(summary).slice(0, 800),
          keywords: signalsToMigrate.map(signal => signal.keyword).filter(Boolean).slice(0, 10),
          weight: latestSignal?.keyword ? 3 : 2,
          confidence: 0.72,
          source: 'anonymous_migration',
          user_confirmed: false,
          metadata: { local_session_id: localSession.session_id || null }
        });
      }

      localStorage.removeItem('cubiqo_session');
    } catch (error) {
      console.warn('Phase A local session migration failed:', error.message);
      try {
        localStorage.setItem('cubiqo_session', JSON.stringify({
          ...localSession,
          migration_failed_at: new Date().toISOString()
        }));
      } catch {}
    }
  };

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
    await migratePhaseALocalSession(session);
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
    let cancelled = false;
    let callbackHydrationTimer = null;
    let callbackHydrationAttempts = 0;
    const isCallbackReturn = typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).get('auth') === 'callback';

    const syncAuthSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return false;
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
      await ensureUserProfile(data.session);
      await loadUserMemory(data.session?.user);
      await loadSignals();
      if (data.session?.user) {
        setActiveModal(null);
        setAuthError('');
      }
      return Boolean(data.session?.user);
    };

    syncAuthSession();

    if (isCallbackReturn) {
      callbackHydrationTimer = window.setInterval(async () => {
        callbackHydrationAttempts += 1;
        const hasSession = await syncAuthSession();
        if (hasSession || callbackHydrationAttempts >= 12) {
          if (callbackHydrationTimer) window.clearInterval(callbackHydrationTimer);
          callbackHydrationTimer = null;
          if (hasSession) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }, 250);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      await ensureUserProfile(session);
      await loadUserMemory(session?.user);
      await loadSignals();
      if (session?.user) setActiveModal(null);
    });
    // Profile and memory helpers only depend on stable Supabase client module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      cancelled = true;
      if (callbackHydrationTimer) window.clearInterval(callbackHydrationTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    setProfileSyncError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else {
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
      await ensureUserProfile(data.session);
      await loadUserMemory(data.session?.user);
      await loadSignals();
      setActiveModal(null);
    }
    setAuthLoading(false);
  };

  const rememberAppAuthReturn = () => {
    if (typeof window !== 'undefined') {
      // OAuth and email links must visit /auth/callback first; this keeps the CRA app as the final destination.
      window.sessionStorage.setItem('cubiqo_auth_return_to', '/app?auth=callback');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    setProfileSyncError('');
    rememberAppAuthReturn();
    // Pass the prod callback URL explicitly so Supabase doesn't fall back
    // to a Site URL that may be localhost in the dashboard config.
    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: { emailRedirectTo }
    });
    if (error) setAuthError(error.message);
    else {
      const profileReady = await ensureUserProfile(data.session);
      setAuthError(
        data.session && profileReady
          ? 'Account created and profile synced.'
          : "Check your email — we sent a confirmation link to " + authEmail + ". Open it on the same device to finish."
      );
    }
    setAuthLoading(false);
  };
  // OAuth providers — Google + Apple via Supabase. Failure surfaces as
  // an inline error (most often: provider not yet enabled in Supabase
  // Dashboard → Authentication → Providers).
  const handleOAuth = async (provider) => {
    setAuthLoading(true); setAuthError('');
    rememberAppAuthReturn();
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo }
      });
      if (error) {
        setAuthError(
          /not enabled|not configured/i.test(error.message)
            ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in isn't enabled yet. Use email + password for now.`
            : error.message
        );
      }
    } catch (err) {
      setAuthError(err?.message || `${provider} sign-in failed`);
    }
    setAuthLoading(false);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    setUserMemory([]);
    setProfileSyncError('');
  };

  const handleMagicLink = async () => {
    setMagicLinkLoading(true);
    setAuthError('');
    setProfileSyncError('');
    rememberAppAuthReturn();
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
    rec.lang = localStorage.getItem('cubiqo_language_preference') || navigator.language || 'en-US';
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
      const startedAt = listeningStartedAtRef.current || 0;
      const heldFor = startedAt ? Date.now() - startedAt : 0;
      manualStopRef.current = false;
      listeningActiveRef.current = false;
      listeningStartedAtRef.current = 0;
      stopMicAnalysis();
      transcriptRef.current = '';

      if (text) {
        // Keep speaker enabled — we're staying in the conversation. The AI
        // response handler will auto-restart recognition silently when it
        // finishes speaking. Do not setSpeakerEnabled(false) here.
        setIsProcessing(true);
        callBackendRef.current?.(text);
      } else if (wasManualStop) {
        // User explicitly tapped to stop — exit conversation mode.
        conversationActiveRef.current = false;
        voiceReplyRequestedRef.current = false;
        setSpeakerEnabled(false);
        setConversationError('');
      } else if (heldFor < 3000) {
        // Mobile gesture race or denied mic permission — silent reset.
        conversationActiveRef.current = false;
        voiceReplyRequestedRef.current = false;
        setSpeakerEnabled(false);
        setConversationError('');
      } else if (conversationActiveRef.current) {
        // Genuine silence in continuous mode — restart mic silently, the user
        // may just be thinking. The recognition will time out again if they
        // really are done; that's when we exit.
        skipNextCueRef.current = true;
        listeningActiveRef.current = true;
        listeningStartedAtRef.current = Date.now();
        try { recognitionRef.current?.start(); startMicAnalysis(); } catch {}
      } else {
        voiceReplyRequestedRef.current = false;
        setSpeakerEnabled(false);
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
      id: raw.id || raw.signal_id || `local-${color}-${keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-') || Date.now()}`,
      signal_id: raw.signal_id || raw.signalId,
      color,
      keyword,
      intent_status: confirmedIntents.length ? 'confirmed' : (suggestedIntents.length ? 'suggested' : (raw.intent_status || raw.intentStatus || 'pending')),
      suggested_intents: suggestedIntents,
      confirmed_intents: confirmedIntents,
      matching_enabled: Boolean(raw.matching_enabled || raw.matchingEnabled || confirmedIntents.length),
      source: raw.source || 'conversation',
      display_state: raw.display_state || raw.displayState || 'visible',
      confidence: raw.confidence,
      shown_in_panel: raw.shown_in_panel !== false && raw.shownInPanel !== false,
      editable_by_user: raw.editable_by_user !== false && raw.editableByUser !== false,
      created_at: raw.created_at || raw.createdAt || new Date().toISOString()
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

  const speakBrowserText = (text, options = {}) => new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    if (!synth || !Utterance) return resolve(false);

    try {
      synth.cancel();
      const utterance = new Utterance(String(text || '').slice(0, 500));
      const voices = synth.getVoices?.() || [];
      const preferredVoice = voices.find(voice => /river|aria|jenny|sonia|natural|neural|english/i.test(`${voice.name} ${voice.voiceURI}`))
        || voices.find(voice => /en[-_]/i.test(voice.lang))
        || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.lang = preferredVoice?.lang || navigator.language || 'en-US';
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 0.82;
      utterance.volume = options.volume ?? 0.9;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingAudioLevel(0.2);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingAudioLevel(0);
        resolve(true);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingAudioLevel(0);
        resolve(false);
      };
      synth.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setSpeakingAudioLevel(0);
      resolve(false);
    }
  });

  const speakBrowserListeningCue = () => speakBrowserText('I am listening.', {
    rate: 0.82,
    pitch: 0.72,
    volume: 0.78
  });

  const speakBrowserResponse = (text) => speakBrowserText(text, {
    rate: 0.92,
    pitch: 0.82,
    volume: 0.95
  });

  /**
   * Unified LLM-response voice playback.
   * Used by every chat path so we never accidentally drop voice.
   *
   * Try premium ElevenLabs via /api/tts; if it 401s / 5xxs / no audio / network
   * fails, fall back to the browser SpeechSynthesis voice. Either way the user
   * always hears something. Logs each step so devtools shows the path taken.
   *
   * `data.audio_url` (from /api/converse) is honoured first when present —
   * saves an extra /api/tts round-trip on that path.
   */
  const playLlmResponseAudio = async (responseText, options = {}) => {
    if (!responseText) return;
    if (!isAudioPlaybackUnlocked()) {
      console.warn('[voice] audio playback not unlocked, skipping');
      return;
    }

    const { inlineAudioUrl, token, color } = options;
    const audio = audioRef.current || (audioRef.current = new Audio());

    // Reset any cue/prior playback before we attach new handlers
    try { audio.pause(); audio.currentTime = 0; } catch {}

    const playUrl = async (url) => new Promise((resolve) => {
      audio.src = url;
      audio.volume = 1;
      audio.onplay = () => { setIsSpeaking(true); startAudioAnalysis(); };
      audio.onpause = () => stopAudioAnalysis();
      audio.onended = () => {
        setIsSpeaking(false);
        stopAudioAnalysis();
        resolve(true);
        // Auto-restart listening silently for continuous voice convo.
        // skipNextCueRef = true → toggleListening won't re-play "I am
        // listening" between turns; user just sees the listening glow.
        if (conversationActiveRef.current && toggleListeningRef.current) {
          skipNextCueRef.current = true;
          setTimeout(() => {
            if (!conversationActiveRef.current) return;
            if (!speakerEnabled && !listeningActiveRef.current) {
              toggleListeningRef.current?.();
            }
          }, 400);
        }
      };
      audio.onerror = () => {
        console.warn('[voice] audio element onerror');
        setIsSpeaking(false);
        stopAudioAnalysis();
        resolve(false);
      };
      audio.play().catch((e) => {
        console.warn('[voice] audio.play() rejected:', e?.message || e);
        setIsSpeaking(false);
        stopAudioAnalysis();
        resolve(false);
      });
    });

    let played = false;

    // Path 1 — inline audio from /api/converse (already MP3 base64)
    if (inlineAudioUrl) {
      console.log('[voice] using inline audio_url from response');
      played = await playUrl(inlineAudioUrl);
    }

    // Path 2 — /api/tts (premium ElevenLabs)
    if (!played) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ text: String(responseText).slice(0, 500), color: color || 'yellow' })
        });
        const data = await res.json().catch(() => ({}));
        if (data.audio_url) {
          console.log('[voice] /api/tts ok, playing');
          played = await playUrl(data.audio_url);
        } else {
          console.warn('[voice] /api/tts no audio_url:', data.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn('[voice] /api/tts fetch failed:', err?.message || err);
      }
    }

    // Path 3 — browser SpeechSynthesis (always available, free, less premium)
    if (!played) {
      console.log('[voice] falling back to browser SpeechSynthesis');
      try {
        const ok = await speakBrowserResponse(responseText);
        if (!ok) console.warn('[voice] browser SpeechSynthesis failed too');
      } catch (err) {
        console.warn('[voice] browser TTS threw:', err?.message || err);
      }
    }

    voiceReplyRequestedRef.current = false;
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
    // Skip cue between conversation turns (auto-restart) or if we've already
    // greeted the user this session. The first manual tap of the session is
    // the only time the cue ever plays — after that the experience is silent
    // and continuous, like a normal phone call.
    if (skipNextCueRef.current) {
      skipNextCueRef.current = false;
      return;
    }
    if (cueAlreadySpokenRef.current) return;
    cueAlreadySpokenRef.current = true;

    const audio = audioRef.current;
    if (!audio) return;
    stopAudioAnalysis();
    setSpeakingAudioLevel(0);

    let elevenLabsWorked = false;
    try {
      // Abort if ElevenLabs takes longer than 3.5 s — visual "I am listening." is enough
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      let res, data;
      try {
        res = await fetch('/api/voice-cue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cue: 'listening' }),
          signal: controller.signal
        });
        data = await res.json();
      } finally {
        clearTimeout(timeout);
      }
      if (data?.audio_url) {
        await new Promise((resolve) => {
          audio.pause();
          audio.currentTime = 0;
          audio.onplay = () => { elevenLabsWorked = true; };
          audio.onpause = null;
          audio.src = data.audio_url;
          audio.volume = 0.82;
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(resolve);
        });
      } else if (data?.error) {
        // Diagnostic: log so we can see quota_exceeded / no-key in console
        console.warn('[voice-cue]', data.error);
      }
    } catch {
      // fetch / abort path — fall through to browser TTS
    } finally {
      setSpeakingAudioLevel(0);
    }

    // Fallback: when ElevenLabs is over-quota / no-key / failed, use the
    // browser's built-in SpeechSynthesis so the user always hears the cue.
    // The browser voice is less premium but always available and free.
    if (!elevenLabsWorked) {
      try { await speakBrowserListeningCue(); } catch {}
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
    setRecommendationCards([]);
    setConversationError('');
    setAgentTrace([]);
    setAgentMode('idle');
    const { data: initialSessionData } = await supabase.auth.getSession();
    const initialToken = initialSessionData?.session?.access_token;
    let rgyClassifiedThisTurn = false;

    const shouldUseAgenticFlow = Boolean(options.agentFirst) || /(repo|code|stack|route|routes|built|framework|implementation|self|yourself|what model|test|tests|regression|diagnostic|runtime|provider|supabase|vercel|nextjs|next\.js|react|agentic|what did you check|what can you inspect|job|jobs|career|resume|linkedin|indeed|dice|application|apply|interview|recruiter|startup|business|market|revenue|investor|investors|funding|brainstorm|validate|validation|customer|competitor|growth|ecomm|ecommerce|shopify|printify|printful|pod|fashion|brand|clothing|sales|marketing|gfx|gfxtools|routine|memory|daily|context|research|browser|extension|social|affiliate|campaign|shopping|food|taxi|calendar|email|smart-home|smart home|cq|messenger|wallet|crypto|payment|self-heal|self heal|reporting|coder|studio|camera|biometric|voice|microphone)/i.test(cleanInput);

    try {
      // RGY classification is independent of the answer path. It updates the
      // right panel immediately, while matching remains off until user intent
      // confirmation is saved through /api/signals.
      if (initialToken) {
        const rgyRes = await fetch('/api/rgy/classify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${initialToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ input: cleanInput, user_id: user?.id })
        });
        const rgyData = await rgyRes.json().catch(() => ({}));
        if (rgyData.status === 'crisis' || rgyData.status === 'blocked') {
          setAiResponse(rgyData.message || 'This request is blocked by the RGY safety layer.');
          setModelUsed('rgy-safety-layer');
          setAgentMode('idle');
          return;
        }
        const classifiedSignal = normalizeSignal(rgyData.signal || rgyData.capsule);
        if (classifiedSignal) {
          rgyClassifiedThisTurn = true;
          setRgyCapsule({
            ...(rgyData.capsule || {}),
            color: classifiedSignal.color,
            keyword: classifiedSignal.keyword,
            intent_status: classifiedSignal.intent_status,
            suggested_intents: classifiedSignal.suggested_intents,
            confirmed_intents: classifiedSignal.confirmed_intents,
            matching_enabled: classifiedSignal.matching_enabled,
            age_gate_required: rgyData.age_gate_required
          });
          if (!colorLock) setSelectedKeywordColor(classifiedSignal.color);
          setSignals(prev => [classifiedSignal, ...prev.filter(item => item.id !== classifiedSignal.id)].slice(0, 30));
        }
      }

      if (shouldUseAgenticFlow) {
        setAgentMode('working');
        setIsStreaming(true);
        const streamRes = await fetch('/api/agent/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(initialToken ? { Authorization: `Bearer ${initialToken}` } : {})
          },
          body: JSON.stringify({
            message: cleanInput,
            history: memoryEventsToHistory(user?.id ? [...visitMemory, ...userMemory] : visitMemory)
          })
        });

        let responseText = '';
        const liveTrace = [];

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const t = line.trim();
              if (t.startsWith('0:')) {
                // AI SDK text stream format
                try { responseText += JSON.parse(t.slice(2)); setAiResponse(responseText); } catch {}
              } else if (t.startsWith('data: ') && t !== 'data: [DONE]') {
                // AI SDK UI message stream format (used by our stream route)
                // AI SDK v6 uses "delta"; our fallback uses "textDelta" — handle both
                try {
                  const parsed = JSON.parse(t.slice(6));
                  if (parsed.type === 'text-delta') {
                    const chunk = parsed.delta ?? parsed.textDelta ?? '';
                    if (chunk) { responseText += chunk; setAiResponse(responseText); }
                  } else if (parsed.type === 'tool-input-available' || parsed.type === 'tool-output-available') {
                    const toolName = parsed.toolName || parsed.tool || 'tool';
                    liveTrace.push({ tool: toolName, status: 'completed', summary: 'ran' });
                    setAgentTrace([...liveTrace]);
                    setAgentTraceOpen(true);
                  }
                } catch {}
              } else if (t.startsWith('9:')) {
                // tool call start — show live in trace
                try {
                  const toolInfo = JSON.parse(t.slice(2));
                  const toolName = toolInfo?.toolName || toolInfo?.tool || 'tool';
                  liveTrace.push({ tool: toolName, status: 'completed', summary: 'running…' });
                  setAgentTrace([...liveTrace]);
                  setAgentTraceOpen(true);
                } catch {}
              }
            }
          }
        } else {
          // Fallback to JSON agent
          const agentRes = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(initialToken ? { Authorization: `Bearer ${initialToken}` } : {}) },
            body: JSON.stringify({ message: cleanInput, history: memoryEventsToHistory(user?.id ? [...visitMemory, ...userMemory] : visitMemory) })
          });
          const agentData = await agentRes.json().catch(() => ({}));
          responseText = agentData.response || '';
          setAiResponse(responseText);
          if (Array.isArray(agentData.trace)) { setAgentTrace(agentData.trace); setAgentTraceOpen(Boolean(agentData.trace.length)); }
          if (agentData.model_used) setModelUsed(agentData.model_used);
        }

        setIsStreaming(false);
        if (!responseText) {
          responseText = 'I checked what I could, but I do not have enough evidence to answer that yet.';
          setAiResponse(responseText);
        }
        responseText = await applyOutputSafety(responseText, cleanInput);
        responseText = await processRecommendationCards(responseText);
        setAiResponse(responseText);
        const isConversationDelegated = false;
        const nextAgentTrace = liveTrace;
        if (!liveTrace.length) setAgentTrace([]);
        setAgentMode('read-only');
        if (streamRes.ok) setModelUsed('agent-stream-v1');

        // ── Speak the agentic response via unified voice helper ──
        if ((speakerEnabled || voiceReplyRequestedRef.current) && responseText) {
          playLlmResponseAudio(responseText, {
            token: initialToken,
            color: activeColor
          }).catch((err) => console.warn('[voice] playLlmResponseAudio threw:', err?.message || err));
        }

        const agentData = { rgy: null, audio_url: null };
        if (agentData.rgy && !rgyClassifiedThisTurn) {
          const normalizedColor = normalizeKeywordColor(agentData.rgy.color);
          setRgyCapsule({ ...agentData.rgy, color: normalizedColor });
          if (!colorLock && agentData.rgy.color) setSelectedKeywordColor(normalizedColor);
          const capturedSignal = signalFromRgy({ ...agentData.rgy, color: normalizedColor }, {}, cleanInput);
          if (capturedSignal) await rememberSignal(capturedSignal);
        }
        try {
          if (agentData.audio_url && isAudioPlaybackUnlocked()) {
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
      const safeResponseText = await applyOutputSafety(responseText, cleanInput);
      const enrichedResponseText = await processRecommendationCards(safeResponseText);
      setAiResponse(enrichedResponseText);
      if (data.keywords) setKeywords(normalizeKeywords(data.keywords));
      if (data.model_used) setModelUsed(data.model_used);
      if (data.rgy && !rgyClassifiedThisTurn) {
        const normalizedColor = normalizeKeywordColor(data.rgy.color);
        setRgyCapsule({ ...data.rgy, color: normalizedColor });
        if (!colorLock && data.rgy.color) setSelectedKeywordColor(normalizedColor);
        const capturedSignal = signalFromRgy({ ...data.rgy, color: normalizedColor }, data.keywords || {}, cleanInput);
        if (capturedSignal) await rememberSignal(capturedSignal);
      }
      if ((speakerEnabled || voiceReplyRequestedRef.current) && enrichedResponseText) {
        // /api/converse returns audio_url inline — use it first, fall through to
        // /api/tts then browser TTS via the unified helper.
        playLlmResponseAudio(enrichedResponseText, {
          inlineAudioUrl: data.audio_url,
          token: initialToken,
          color: activeColor
        }).catch((err) => console.warn('[voice] playLlmResponseAudio threw:', err?.message || err));
      }
      try {
        await rememberConversation(cleanInput, enrichedResponseText, data);
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
      if (!rgyClassifiedThisTurn) {
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
      }
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

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();

    // Image mode: if a photo is attached, send to image API first
    if (imageAttachment) {
      if (isProcessing || imageLoading) return;
      setImageLoading(true);
      setChatInput('');
      const prompt = text || 'Enhance this photo beautifully.';
      try {
        // Require auth — image API rejects unauthenticated requests
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          setAiResponse('Please sign in to use image editing. Your photos are only processed for signed-in users.');
          setImageAttachment(null);
          setImagePreview(null);
          setImageLoading(false);
          return;
        }
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: 'edit',
            prompt,
            imageBase64: imageAttachment,
            negativePrompt: 'bad quality, blurry, watermark, text, ugly, deformed',
          }),
        });
        const data = await res.json();
        if (data.imageBase64) {
          setImageGenResult(`data:image/png;base64,${data.imageBase64}`);
          setAiResponse('Here\'s the edited image ↑');
        } else {
          setAiResponse(`Image generation failed: ${data.error || 'unknown error'}`);
        }
      } catch (err) {
        setAiResponse(`Image error: ${String(err)}`);
      } finally {
        setImageAttachment(null);
        setImagePreview(null);
        setImageLoading(false);
      }
      return;
    }

    if (!text || isProcessing) return;
    unlockAudioPlayback();
    voiceReplyRequestedRef.current = false;
    setChatInput('');
    setIsProcessing(true);
    callBackend(text);
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      // Strip the "data:...;base64," prefix — API wants raw base64
      setImageAttachment(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const handleGenerateImage = async (prompt) => {
    if (imageLoading) return;
    setImageLoading(true);
    try {
      // Require auth — image API rejects unauthenticated requests
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setAiResponse('Please sign in to generate images.');
        return;
      }
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: 'generate', prompt }),
      });
      const data = await res.json();
      if (data.imageBase64) {
        setImageGenResult(`data:image/png;base64,${data.imageBase64}`);
        setAiResponse('Generated image ↑');
      } else {
        setAiResponse(`Failed to generate: ${data.error || 'unknown error'}`);
      }
    } catch (err) {
      setAiResponse(`Generate error: ${String(err)}`);
    } finally {
      setImageLoading(false);
    }
  };

  const toggleListening = async () => {
    // CRITICAL: do all audio + mic + recognition work synchronously inside this
    // user gesture. Mobile browsers (Chrome Android, iOS Safari) only honour
    // .play() and getUserMedia() calls that happen on the SAME tick as the
    // user tap — any await before them kills the gesture and the OS denies
    // both audio playback and mic permission.
    unlockAudioPlayback();
    if (audioRef.current) {
      // Pre-warm the audio element with a silent data URL inside the gesture.
      // Calling .play() with no src is a no-op on mobile; setting a tiny valid
      // src first lets the element become "user-unlocked" for later writes.
      try {
        if (!audioRef.current.src) {
          audioRef.current.src = 'data:audio/mp3;base64,/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        }
        audioRef.current.volume = 0;
        audioRef.current.play().catch(() => {});
      } catch {}
    }

    // Tap-to-interrupt: if AI is currently speaking, stop the audio and
    // immediately start listening for the user's interruption. Skips the cue
    // because we're mid-conversation. This is the ChatGPT-voice barge-in
    // pattern — the user can cut the AI off whenever they want.
    if (isSpeaking) {
      try { audioRef.current?.pause(); } catch {}
      const synth = window.speechSynthesis;
      if (synth) try { synth.cancel(); } catch {}
      setIsSpeaking(false);
      stopAudioAnalysis();
      skipNextCueRef.current = true;
      // Fall through to the "start recognition" branch below — do not return.
    } else if (isProcessing) {
      return;
    }

    if (speakerEnabled && !isSpeaking) {
      // Second tap when idle-listening — user explicitly ending convo.
      manualStopRef.current = true;
      listeningActiveRef.current = false;
      conversationActiveRef.current = false;
      voiceReplyRequestedRef.current = false;
      setConversationError('');
      setSpeakerEnabled(false);
      stopMicAnalysis();
      recognitionRef.current?.stop?.();
      return;
    }

    if (!recognitionRef.current) {
      setConversationError('Voice input unavailable in this browser. Use the text field instead.');
      return;
    }

    transcriptRef.current = '';
    manualStopRef.current = false;
    listeningActiveRef.current = true;
    voiceReplyRequestedRef.current = true;
    conversationActiveRef.current = true;
    listeningStartedAtRef.current = Date.now();
    setConversationError('');
    setSpeakerEnabled(true);

    // STEP 1 (sync, in-gesture): start recognition so the browser keeps the
    // mic permission grant attached to this tap.
    try {
      recognitionRef.current.start();
    } catch (err) {
      // start() throws if already running — safe to ignore
    }
    startMicAnalysis();

    // STEP 2 (fire-and-forget): play the cue. The audio element was unlocked
    // above, so when fetch resolves and we set .src + .play(), mobile honours
    // it because the same element already passed the unlock gate.
    playListeningCue().catch(() => {});
  };
  // Keep ref in sync so async callbacks (e.g. TTS onended) can trigger a new listen cycle
  toggleListeningRef.current = toggleListening;

  const colorMap = {
    green: { label: 'Green', desc: 'Sattva / Growth', hex: '#22c55e', rgb: '34,197,94', aura: 'rgba(34,197,94,0.15)' },
    yellow: { label: 'Yellow', desc: 'Rajas / Social', hex: '#f59e0b', rgb: '245,158,11', aura: 'rgba(245,158,11,0.15)' },
    red: { label: 'Red', desc: 'Tamas / Restricted', hex: '#ef4444', rgb: '239,68,68', aura: 'rgba(239,68,68,0.15)' }
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
    if (signal.color === 'red') return;
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

  const updateSignalColor = (signalInput, color) => {
    const signal = normalizeSignal(signalInput);
    const nextColor = normalizeKeywordColor(color);
    if (!signal || !['green', 'yellow', 'red'].includes(nextColor)) return;
    void rememberSignal({
      ...signal,
      color: nextColor,
      suggested_intents: nextColor === 'red' ? [] : signal.suggested_intents,
      confirmed_intents: nextColor === 'red' ? [] : signal.confirmed_intents,
      intent_status: nextColor === 'red' ? 'pending' : signal.intent_status
    }, { patch: true });
  };

  const signalStatusLabel = (item) => {
    const signal = normalizeSignal(item);
    if (!signal) return 'Intent pending';
    const confirmed = normalizeIntentList(signal.confirmed_intents);
    const suggested = normalizeIntentList(signal.suggested_intents);
    if (signal.color === 'red') return 'Age-gated';
    if (confirmed.length) return `${confirmed.map(intent => intentLabels[intent]).join(' + ')} active`;
    if (signal.intent_status === 'ambiguous') return 'Not sure about intent';
    if (suggested.length) return `${suggested.map(intent => intentLabels[intent]).join(' + ')} suggested`;
    return 'Intent pending';
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

            {(lastUserMessage || aiResponse || isProcessing || isStreaming) && (
              <div style={{
                width: '100%', maxHeight: '28vh', overflowY: 'auto',
                background: pageTheme.responseBg, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                border: `1px solid ${pageTheme.responseBorder}`, borderRadius: 18,
                padding: '14px 16px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                textAlign: 'left'
              }}>
                <style>{`
                  @keyframes cq-blink { 0%,100%{opacity:1} 50%{opacity:0} }
                  @keyframes cq-dot { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
                  .cq-cursor { display:inline-block; width:2px; height:0.85em; background:currentColor; margin-left:2px; vertical-align:text-bottom; animation:cq-blink 0.9s step-end infinite; }
                  .cq-thinking span { animation:cq-dot 1.4s infinite; display:inline-block; }
                  .cq-thinking span:nth-child(2) { animation-delay:0.2s; }
                  .cq-thinking span:nth-child(3) { animation-delay:0.4s; }
                `}</style>
                {lastUserMessage && (
                  <div style={{ color: pageTheme.responseMuted, fontSize: '0.76rem', lineHeight: 1.5, marginBottom: (aiResponse || isProcessing) ? 8 : 0 }}>
                    {lastUserMessage}
                  </div>
                )}
                {isProcessing && !aiResponse && !isStreaming && (
                  <div className="cq-thinking" style={{ color: pageTheme.responseMuted, fontSize: '0.88rem' }}>
                    <span>•</span><span>•</span><span>•</span>
                  </div>
                )}
                {(aiResponse || isStreaming) && (
                  <div style={{ color: pageTheme.responseText, fontSize: '0.95rem', lineHeight: 1.55, fontWeight: 300 }}>
                    {aiResponse}
                    {isStreaming && <span className="cq-cursor" aria-hidden="true" />}
                  </div>
                )}
                {recommendationCards.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginTop: 12, paddingBottom: 2 }}>
                    {recommendationCards.map(card => (
                      <div key={card.id} style={{
                        minWidth: 220,
                        maxWidth: 260,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.055)',
                        borderRadius: 8,
                        padding: 12,
                        color: pageTheme.responseText
                      }}>
                        {card.imageUrl && (
                          <img
                            src={card.imageUrl}
                            alt=""
                            style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 6, marginBottom: 8, background: 'rgba(255,255,255,0.06)' }}
                          />
                        )}
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>{card.entityName}</div>
                        {card.tagline && <div style={{ fontSize: '0.76rem', color: pageTheme.responseMuted, lineHeight: 1.35, marginBottom: 8 }}>{card.tagline}</div>}
                        {card.price && (
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 6 }}>
                            {card.price.currency === 'GBP' ? '£' : card.price.currency === 'USD' ? '$' : `${card.price.currency} `}
                            {Number(card.price.amount).toFixed(2)}
                          </div>
                        )}
                        {card.rating != null && (
                          <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginBottom: 6 }}>
                            ★ {Number(card.rating).toFixed(1)}
                            {card.reviewCount != null ? ` (${Number(card.reviewCount).toLocaleString()})` : ''}
                          </div>
                        )}
                        {(card.isPrime || card.primeEligible) && (
                          <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginBottom: 6 }}>Prime eligible</div>
                        )}
                        {card.promoCode && <div style={{ fontSize: '0.72rem', marginBottom: 8 }}>Promo: <strong>{card.promoCode}</strong></div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <a href={card.trackedUrl} target="_blank" rel="noreferrer" style={{
                            color: pageTheme.responseText,
                            textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: 6,
                            padding: '6px 8px',
                            fontSize: '0.72rem'
                          }}>{card.tier === 3 ? 'View product' : 'Get started'}</a>
                          <button type="button" onClick={async () => {
                            const { data: sessionData } = await supabase.auth.getSession();
                            await fetch('/api/recommendations/save', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
                              },
                              body: JSON.stringify({ recommendationEventId: card.id })
                            });
                          }} style={{ border: 0, borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem' }}>Save</button>
                          <button type="button" onClick={async () => {
                            const { data: sessionData } = await supabase.auth.getSession();
                            await fetch('/api/recommendations/have', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
                              },
                              body: JSON.stringify({ recommendationEventId: card.id })
                            });
                            setRecommendationCards(prev => prev.filter(item => item.id !== card.id));
                          }} style={{ border: 0, borderRadius: 6, padding: '6px 8px', fontSize: '0.72rem' }}>I have this</button>
                        </div>
                        <div style={{ color: pageTheme.responseMuted, fontSize: '0.64rem', lineHeight: 1.3, marginTop: 8 }}>
                          {card.disclosure || 'CubiQo may earn a commission. Your price does not change.'}
                        </div>
                      </div>
                    ))}
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

            {/* Last generated image result */}
            {imageGenResult && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img src={imageGenResult} alt="Generated" style={{ width: '100%', maxWidth: 360, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={imageGenResult} download="cubiqo-generated.png" style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem', textDecoration: 'none', cursor: 'pointer' }}>Download</a>
                  <button onClick={() => setImageGenResult(null)} style={{ padding: '5px 14px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', cursor: 'pointer' }}>Dismiss</button>
                </div>
              </div>
            )}

            {/* Attached image preview */}
            {imagePreview && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={imagePreview} alt="Attached" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }} />
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem' }}>Photo attached — type a prompt or send to edit</span>
                  <button onClick={() => { setImageAttachment(null); setImagePreview(null); }} style={{ padding: '3px 9px', borderRadius: 7, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.68rem', cursor: 'pointer' }}>Remove</button>
                </div>
                {/* Privacy disclosure */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px', background: 'rgba(139,92,246,0.06)', borderRadius: 7, border: '1px solid rgba(139,92,246,0.15)' }}>
                  <span style={{ fontSize: '0.7rem' }}>🔒</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.67rem', lineHeight: 1.4 }}>
                    Sent securely over HTTPS to a GPU for processing. Never stored by CubiQo.
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleTextSubmit} onClick={e => e.stopPropagation()} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: pageTheme.inputBg, backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: `1px solid ${imageAttachment ? 'rgba(139,92,246,0.4)' : pageTheme.inputBorder}`, borderRadius: 20,
              padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
              {/* Hidden file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImagePick}
              />
              {/* Image upload button */}
              <button
                type="button"
                title={imageAttachment ? 'Image attached' : 'Attach photo for editing'}
                onClick={() => imageInputRef.current?.click()}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: `1px solid ${imageAttachment ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: imageAttachment ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  color: imageAttachment ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                {imageLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={14} />}
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isProcessing || imageLoading}
                placeholder={imageAttachment ? 'Describe the edit (or send as-is)…' : 'Type to CubiQo'}
                style={{
                  flex: 1, minWidth: 0, height: 42, border: 'none', outline: 'none',
                  background: 'transparent', color: pageTheme.inputText, padding: '0 10px',
                  fontSize: '0.92rem'
                }}
              />
              <button type="submit" title="Send message" aria-label="Send message"
                disabled={(isProcessing || imageLoading) || (!chatInput.trim() && !imageAttachment)}
                style={{
                  width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                  background: (chatInput.trim() || imageAttachment) && !isProcessing && !imageLoading
                    ? 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (chatInput.trim() || imageAttachment) && !isProcessing && !imageLoading ? 'pointer' : 'not-allowed',
                  opacity: (chatInput.trim() || imageAttachment) && !isProcessing && !imageLoading ? 1 : 0.45
                }}>
                <Send size={17} />
              </button>
            </form>

            {speakerEnabled && !conversationError && (
              <div style={{ color: 'rgba(251,191,36,0.92)', fontSize: '0.74rem', letterSpacing: 2, textTransform: 'uppercase', animation: 'pulse 1.6s ease-in-out infinite' }}>
                I am listening.
              </div>
            )}

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

          {/* Scrollable content area */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, paddingRight: 4, marginRight: -4 }}>

          {/* ── CubiQo system drawer (left side) ──
              Mental model: hero + this drawer = "CubiQo the AI" as one product.
              Everything here is about the AI itself — its connections, what
              it remembers about you, how it talks, what devices it runs on.
              RGY/Capsules/Chatrooms live in the RIGHT drawer, not here. */}
          {(() => {
            const navItemStyle = {
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
            };
            const navHover = e => { e.currentTarget.style.background = trayTheme.cardHover; };
            const navOut = e => { e.currentTarget.style.background = trayTheme.card; };
            // No redirects, ever: internal routes use the in-app router; every
            // Next-app feature opens as an OVERLAY on top of the hero.
            const INTERNAL_ROUTES = ['/', '/app', '/auth/callback', '/dashboard', '/journal', '/actions'];
            const go = (path) => {
              setLeftPanelOpen(false);
              if (INTERNAL_ROUTES.includes(path)) navigate(path);
              else setFeatureOverlay(path);
            };
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>CubiQo</div>

                  <button type="button" onClick={() => setLeftPanelOpen(false)} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><Send size={15} /> Chat</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>Voice · text · vision</span>
                  </button>

                  <button type="button" onClick={() => go('/messenger')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><Mail size={15} /> CQ Messenger</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>Private 1:1 DMs</span>
                  </button>

                  <button type="button" onClick={() => go('/journal')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><BookOpen size={15} /> Daily Journal</span>
                  </button>

                  <button type="button" onClick={() => go('/connectors')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><Globe2 size={15} /> Apps</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>Gmail · Shopify · …</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ color: trayTheme.title, fontSize: '0.66rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Account</div>

                  <button type="button" onClick={() => go('/profile')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><User size={15} /> Profile</span>
                  </button>

                  <button type="button" onClick={() => go('/account/memory')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><BrainCircuit size={15} /> Memory</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>What I remember</span>
                  </button>

                  <button type="button" onClick={() => go('/settings')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><SlidersHorizontal size={15} /> Settings</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>Voice · AI · Thresholds</span>
                  </button>

                  <button type="button" onClick={() => go('/account/surfaces')} style={navItemStyle} onMouseOver={navHover} onMouseOut={navOut}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem' }}><Monitor size={15} /> Surfaces</span>
                    <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>Devices I run on</span>
                  </button>

                  {/* System Health — live dot from /api/diagnostics */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: trayTheme.card, border: `1px solid ${trayTheme.cardBorder}`, borderRadius: 14, padding: '12px 14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '0.84rem', color: trayTheme.text }}><Activity size={15} /> System Health</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: diagHealth === null ? '#f59e0b' : diagHealth ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${diagHealth === null ? '#f59e0b' : diagHealth ? '#22c55e' : '#ef4444'}` }} />
                      <span style={{ color: trayTheme.muted, fontSize: '0.7rem' }}>{diagHealth === null ? 'checking…' : diagHealth ? 'All OK' : 'Issue detected'}</span>
                    </span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* ── Display section ── */}
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

          </div>{/* end scrollable content area */}

        </div>


        {/* RIGHT PANEL */}
        <div data-testid="signal-match-panel" style={{ ...panelBase, right: '28px', width: '372px', maxWidth: 'calc(100vw - 56px)', transform: rightPanelOpen ? 'translateX(0)' : 'translateX(130%)', opacity: rightPanelOpen ? 1 : 0, pointerEvents: rightPanelOpen ? 'auto' : 'none', padding: '28px 22px' }}>

          {/* The RGY capsule IS the door to agentic — no separate tab.
              Launched dashboards appear below the capsule entry points. */}
          <>

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

          {/* RGY UNIVERSE entry points — DuoMode + Chatrooms full-screen pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => {
                // Launching the capsule IS the door to agentic: create (or
                // reuse) its dashboard and open the duo overlay — no redirect.
                setRightPanelOpen(false);
                const task = launchCapsuleDashboard(titleizeSignal(visibleSignal?.keyword || activeColor), active.hex);
                if (task) openWorkspace(task);
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '11px 12px', borderRadius: 14,
                border: `1px solid ${active.hex}3a`,
                background: `linear-gradient(135deg, rgba(${active.rgb},0.14) 0%, rgba(${active.rgb},0.04) 100%)`,
                color: '#fff', cursor: 'pointer', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${active.rgb},0.24) 0%, rgba(${active.rgb},0.08) 100%)`; }}
              onMouseOut={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${active.rgb},0.14) 0%, rgba(${active.rgb},0.04) 100%)`; }}
            >
              <span>
                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.4 }}>DuoMode</span>
                <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.64rem', marginTop: 2 }}>Launch capsule</span>
              </span>
              <span style={{ color: active.hex, fontSize: '0.85rem' }}>→</span>
            </button>
            <button
              type="button"
              onClick={() => { setRightPanelOpen(false); setFeatureOverlay('/chatrooms'); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '11px 12px', borderRadius: 14,
                border: `1px solid ${active.hex}3a`,
                background: `linear-gradient(135deg, rgba(${active.rgb},0.14) 0%, rgba(${active.rgb},0.04) 100%)`,
                color: '#fff', cursor: 'pointer', textAlign: 'left'
              }}
              onMouseOver={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${active.rgb},0.24) 0%, rgba(${active.rgb},0.08) 100%)`; }}
              onMouseOut={e => { e.currentTarget.style.background = `linear-gradient(135deg, rgba(${active.rgb},0.14) 0%, rgba(${active.rgb},0.04) 100%)`; }}
            >
              <span>
                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.4 }}>RGY Chats</span>
                <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.64rem', marginTop: 2 }}>Public rooms</span>
              </span>
              <span style={{ color: active.hex, fontSize: '0.85rem' }}>→</span>
            </button>
          </div>

          {/* Launched dashboards — exist only after a capsule launch */}
          {agentTasks.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.64rem', letterSpacing: 2.4, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Dashboards</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {agentTasks.map(task => (
                  <div key={task.id} onClick={() => { setRightPanelOpen(false); openWorkspace(task); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: task.color || 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: '0.81rem', fontWeight: 500 }}>{task.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', padding: '2px 5px' }}>→</span>
                    <button onClick={e => { e.stopPropagation(); removeAgentTask(task.id); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <span style={{ color: index === 0 ? active.hex : 'rgba(255,255,255,0.46)', fontSize: '0.62rem', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 800 }}>{signalStatusLabel(item)}</span>
                      <button type="button" onClick={() => deleteSignal(item)} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.42)', borderRadius: 9, width: 26, height: 26, cursor: 'pointer', display: 'grid', placeItems: 'center' }} aria-label="Remove signal">
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      {['green', 'yellow', 'red'].map(color => {
                        const entry = colorMap[color];
                        const selected = item.color === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            title={`Set ${entry.label}`}
                            aria-label={`Set signal color ${color}`}
                            onClick={() => updateSignalColor(item, color)}
                            style={{
                              width: selected ? 38 : 30,
                              height: 14,
                              borderRadius: 5,
                              border: `1px solid ${entry.hex}${selected ? '88' : '24'}`,
                              background: entry.hex,
                              opacity: selected ? 1 : 0.28,
                              boxShadow: selected ? `0 0 14px ${entry.hex}55` : 'none',
                              cursor: 'pointer',
                              transform: 'skewX(-10deg)',
                              transition: 'all 0.24s ease'
                            }}
                          />
                        );
                      })}
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
                    {item.color !== 'red' ? (
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
                    ) : (
                      <div style={{ marginTop: 11, color: 'rgba(239,68,68,0.76)', fontSize: '0.7rem', lineHeight: 1.4 }}>
                        Intent confirmation is hidden until age-gate checks pass.
                      </div>
                    )}
                    {/* DUO MODE button — available on all non-red capsules */}
                    {item.color !== 'red' && (
                      <button
                        type="button"
                        onClick={() => {
                          setRightPanelOpen(false);
                          const t = launchCapsuleDashboard(item.keyword || item.color, colorMap[item.color]?.hex);
                          if (t) openWorkspace(t, item);
                        }}
                        style={{
                          marginTop: 10,
                          width: '100%',
                          background: 'linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.10) 100%)',
                          border: '1px solid rgba(139,92,246,0.38)',
                          borderRadius: 10,
                          padding: '7px 0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          cursor: 'pointer',
                          transition: 'all 0.18s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.32)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, rgba(124,58,237,0.18) 0%, rgba(168,85,247,0.10) 100%)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.38)'; }}
                      >
                        <span style={{
                          background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          fontWeight: 900, fontSize: '0.7rem', letterSpacing: 1.5, fontStyle: 'italic'
                        }}>DUO</span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem', letterSpacing: 1.5 }}>MODE</span>
                        <span style={{ color: '#a855f7', fontSize: '0.75rem' }}>▶</span>
                      </button>
                    )}
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
          </>
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
                  {/* OAuth providers — industry-standard pattern. Top of the
                      modal so they're the first option users see. */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      disabled={authLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px', background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 13, color: '#1f1f1f', fontSize: '0.86rem', fontWeight: 600,
                        cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.6 : 1,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#4285F4" d="M16.51 8.18c0-.57-.05-1.12-.15-1.66H9v3.14h4.21c-.18.99-.74 1.83-1.57 2.39v1.99h2.54c1.49-1.37 2.34-3.39 2.34-5.86z"/>
                        <path fill="#34A853" d="M9 16.5c2.12 0 3.9-.7 5.2-1.9l-2.54-1.96c-.7.47-1.6.75-2.66.75-2.05 0-3.78-1.38-4.4-3.24H1.97v2.04C3.27 14.78 5.95 16.5 9 16.5z"/>
                        <path fill="#FBBC05" d="M4.6 10.15c-.16-.47-.25-.97-.25-1.5s.09-1.03.25-1.5V5.11H1.97A7.49 7.49 0 0 0 1.5 8.65a7.5 7.5 0 0 0 .47 3.54L4.6 10.15z"/>
                        <path fill="#EA4335" d="M9 4.42c1.16 0 2.2.4 3.02 1.18l2.25-2.25C12.9 2.1 11.12 1.5 9 1.5c-3.05 0-5.73 1.72-7.03 4.11l2.63 2.04C5.22 5.79 6.95 4.42 9 4.42z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuth('apple')}
                      disabled={authLoading}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px', background: '#000', border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: 13, color: '#fff', fontSize: '0.86rem', fontWeight: 600,
                        cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.6 : 1
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.6 3.2c-.3-.4-.7-.7-1.2-.9-.5-.2-1-.3-1.5-.3-.4 0-.8.1-1.2.2-.4.1-.7.3-.9.5-.3.2-.5.4-.8.4-.2 0-.5-.1-.8-.4-.3-.2-.6-.4-1-.5-.4-.1-.8-.2-1.2-.2-.6 0-1.1.1-1.6.4s-.9.6-1.2 1.1c-.6.8-.9 1.8-.9 3 0 1 .2 2 .5 2.9.4 1 .9 1.9 1.5 2.6.5.6 1 1 1.6 1 .3 0 .6-.1.9-.2.3-.1.6-.2.9-.2.3 0 .6.1.9.2.3.1.6.2 1 .2.6 0 1.2-.4 1.7-1 .4-.4.7-.9.9-1.4-.6-.3-1-.7-1.3-1.2-.3-.5-.5-1.1-.5-1.7 0-.7.2-1.3.5-1.8.3-.5.7-.9 1.2-1.1zM11.5 1.8c.3-.4.6-.8.7-1.3.1-.4.2-.7.2-1V0c-.4.1-.8.2-1.2.5-.4.2-.7.6-.9.9-.3.4-.5.8-.6 1.3 0 .2-.1.5-.1.7 0 .1 0 .1.1.1.5 0 1-.1 1.4-.4.2-.3.3-.6.4-.9z"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </div>

                  {/* divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: authTheme.muted, fontSize: '0.72rem', margin: '4px 0' }}>
                    <div style={{ flex: 1, height: 1, background: authTheme.fieldBorder }} />
                    <span style={{ letterSpacing: 1 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: authTheme.fieldBorder }} />
                  </div>

                  {/* Strong-contrast Sign in / Sign up segmented control */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8, padding: 4, borderRadius: 16, background: authTheme.segment, border: `1px solid ${authTheme.fieldBorder}` }}>
                    {['login', 'signup'].map(v => {
                      const active = authView === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => { setAuthView(v); setAuthError(''); }}
                          style={{
                            padding: '11px 8px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            border: active ? '1px solid rgba(34,211,238,0.55)' : '1px solid transparent',
                            background: active
                              ? 'linear-gradient(135deg, rgba(34,211,238,0.30) 0%, rgba(124,58,237,0.30) 100%)'
                              : 'transparent',
                            color: active ? '#fff' : authTheme.muted,
                            fontSize: '0.9rem',
                            fontWeight: active ? 700 : 500,
                            boxShadow: active ? '0 4px 16px rgba(34,211,238,0.25)' : 'none',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          {v === 'login' ? 'Sign in' : 'Sign up'}
                        </button>
                      );
                    })}
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

        {/* JOB PIPELINE MODAL */}
        <JobPipeline
          token={accessToken || null}
          visible={jobPipelineOpen}
          onClose={() => setJobPipelineOpen(false)}
        />

        {/* DUO MODE DASHBOARD */}
        {duoModeOpen && duoModeCapsule && (
          <DuoModeDashboard
            capsule={duoModeCapsule}
            token={accessToken || null}
            projectId={duoProjectId}
            onClose={() => { setDuoModeOpen(false); setDuoModeCapsule(null); setDuoProjectId(null); }}
          />
        )}

        {/* FEATURE OVERLAY — Next-app pages hosted as overlays (no redirects) */}
        {featureOverlay && (
          <div onClick={() => setFeatureOverlay(null)} style={{ position: 'fixed', inset: 0, zIndex: 360, background: 'rgba(2,2,8,0.86)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 26, animation: 'fadeIn 0.25s ease-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 'min(1100px, 100%)', height: '100%', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#050510', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
              <button onClick={() => setFeatureOverlay(null)} aria-label="Close overlay" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(10,10,18,0.85)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
              <iframe src={`${featureOverlay}${featureOverlay.includes('?') ? '&' : '?'}embed=1`} title="CubiQo" style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
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
      {/* Global overlay-card stack — approval (z500), question (z490),
          RGY context (z470). Floats over hero + drawers; never replaces. */}
      <CubiQoOverlays />
    </div>
  );
}

export default App;
