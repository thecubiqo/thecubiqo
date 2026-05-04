import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import CubiQoVisual from "./components/CubiQoVisual";
import ParticleWaveHD from "./components/ParticleWaveHD";
import { Menu, Activity, X, Settings, Database, Shield, User, LogOut, Mail, Lock, Send, Plus } from "lucide-react";
import { supabase } from "./lib/supabase";

const SignalIcon = ({ size = 18 }) => (
  <div style={{
    width: size * 0.9, height: size * 1.8, background: 'rgba(255,255,255,0.08)',
    borderRadius: '100px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: size * 0.2, border: '1px solid rgba(255,255,255,0.1)'
  }}>
    <div style={{ width: size * 0.35, height: size * 0.35, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.4)' }} />
    <div style={{ width: size * 0.35, height: size * 0.35, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.4)' }} />
    <div style={{ width: size * 0.35, height: size * 0.35, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.4)' }} />
  </div>
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

const JournalPage = () => {
  const navigate = useNavigate();
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  return (
    <div data-testid="journal-page" onClick={() => setSpeakerEnabled(!speakerEnabled)} style={{ width: '100%', height: '100vh', background: '#020208', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
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
      <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', zIndex: 100, textAlign: 'center', width: '80%', maxWidth: '600px' }}>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '2rem', fontWeight: 300, letterSpacing: 2, marginBottom: 12, textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
          Daily Journal
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 300, lineHeight: 1.6 }}>
          Speak naturally. Your thoughts are recorded in the energy field.
        </div>
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
  const [authError, setAuthError] = useState('');
  const [profileSyncError, setProfileSyncError] = useState('');
  const [uiVisible, setUiVisible] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [journalEntry, setJournalEntry] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [conversationError, setConversationError] = useState('');
  const [speakingAudioLevel, setSpeakingAudioLevel] = useState(0);

  // Periodic UI Breathing (Back and Forth between functional and cinematic)
  useEffect(() => {
    const interval = setInterval(() => {
      setUiVisible(prev => !prev);
    }, 15000); // 15s cycle
    return () => clearInterval(interval);
  }, []);

  const aiState = isSpeaking ? 'speaking' : (speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral'));
  const statusLabel = isSpeaking ? 'Speaking' : (speakerEnabled ? 'Listening' : (isProcessing ? 'Thinking' : 'Idle'));

  const recognitionRef = useRef(null);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const audioAnalysisContextRef = useRef(null);
  const audioAnalysisSourceRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const audioAnalysisFrameRef = useRef(null);
  const transcriptRef = useRef('');
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

  // Supabase auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user ?? null);
      await ensureUserProfile(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null);
      await ensureUserProfile(session);
      if (session?.user) setActiveModal(null);
    });
    // ensureUserProfile only depends on stable Supabase client module state.
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
      setSpeakerEnabled(false);
      setIsProcessing(false);
      setConversationError(e.error === 'not-allowed' ? 'Microphone permission denied. Use the text field instead.' : 'Voice input stopped. Use the text field or try again.');
    };
    rec.onend = () => {
      const text = transcriptRef.current.trim();
      transcriptRef.current = '';
      setSpeakerEnabled(false);
      if (text) {
        setIsProcessing(true);
        callBackendRef.current?.(text);
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
      audioAnalysisContextRef.current?.close?.();
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
        body: JSON.stringify({ message: cleanInput })
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
      setAiResponse("I am here, but the live model connection is degraded. I still caught your intent; try again in a moment or keep typing and I will keep tracking the signal.");
      setConversationError('Model connection degraded');
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

  const toggleListening = () => {
    // Unlock audio context for iOS/Safari
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});
    }
    
    if (isProcessing) return;
    if (!speakerEnabled) {
      if (!recognitionRef.current) {
        setConversationError('Voice input unavailable in this browser. Use the text field instead.');
        return;
      }
      transcriptRef.current = '';
      setSpeakerEnabled(true);
      try {
        recognitionRef.current?.start();
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
    } else {
      recognitionRef.current?.stop(); // triggers onend which handles the rest
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
  const systemRows = [
    { label: 'State', value: statusLabel, color: signal.hex },
    { label: 'RGY', value: `${signal.label} · ${rgyCapsule.intent || 'session'}`, color: signal.hex },
    { label: 'Router', value: rgyCapsule.routing_mode === 'direct' ? 'Direct' : 'Intelligent', color: '#60a5fa' },
    { label: 'Backend', value: modelUsed, color: modelUsed.includes('fallback') ? '#f59e0b' : '#34d399' }
  ];

  const addKeyword = (value = keywordDraft) => {
    const next = value.trim().toLowerCase().replace(/[^a-z0-9 -]/g, '');
    if (!next) return;
    setKeywords(prev => ({
      ...prev,
      [activeColor]: [...new Set([...(prev[activeColor] || []), next])].slice(-12)
    }));
    setKeywordDraft('');
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
    overflow: 'hidden'
  };

  const navItems = [
    { id: 'dimensions', label: 'My Dimensions', icon: Activity, sub: 'Explore your space' },
    { id: 'journal', label: 'Daily Journal', icon: Activity, sub: 'Reflect and capture thoughts' },
    { id: 'settings', label: 'Settings', icon: Settings, sub: 'Preferences & AI models' },
    { id: 'integrations', label: 'Integrations', icon: Database, sub: 'Notion, Calendar, Health' },
    { id: 'privacy', label: 'Data & Privacy', icon: Shield, sub: 'Zero retention policy' }
  ];

  return (
    <>
      <div 
        data-testid="demo-page" 
        onClick={() => setUiVisible(true)}
        style={{ width: '100%', height: '100vh', background: '#08080f', position: 'relative', overflow: 'hidden', cursor: uiVisible ? 'default' : 'pointer' }}
      >

        {/* Toggle buttons */}
        {[
          { side: 'left', open: leftPanelOpen, toggle: () => setLeftPanelOpen(v => !v), Icon: Menu, offset: 28 },
          { side: 'right', open: rightPanelOpen, toggle: () => setRightPanelOpen(v => !v), Icon: Activity, offset: 42 }
        ].map(({ side, open, toggle, Icon, offset }) => (
          <button key={side} onClick={toggle} style={{
            position: 'absolute', top: 28, [side]: offset, zIndex: 100,
            background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)', color: '#fff', borderRadius: '16px',
            width: 48, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: open ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none',
            opacity: uiVisible || open ? 1 : 0,
            pointerEvents: uiVisible || open ? 'auto' : 'none'
          }}>
            {open ? <X size={20} /> : (Icon === Activity ? <SignalIcon size={24} /> : <Icon size={20} />)}
          </button>
        ))}

        {/* PERSISTENT BRAND LOCKUP (Top Left) */}
        <div style={{ 
          position: 'absolute', top: 26, left: 100, zIndex: 100,
          pointerEvents: 'none', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: uiVisible ? 1 : 0,
          transform: uiVisible ? 'translateX(0)' : 'translateX(-20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, fontFamily: "'SF Pro Display','Inter',sans-serif", letterSpacing: '-0.5px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 600, color: '#ff6b35' }}>C</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 500, color: '#fff' }}>ubi</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 600, color: '#ff6b35' }}>Q</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 500, color: '#fff' }}>o</span>
            <sup style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>TM</sup>
          </div>
          <div style={{ 
            fontSize: '0.58rem', color: 'rgba(255,255,255,0.45)', letterSpacing: 3.5, 
            marginTop: 6, textTransform: 'uppercase', fontWeight: 500,
            opacity: 0.9, whiteSpace: 'nowrap'
          }}>
            Home to General Intelligence
          </div>
        </div>

        {/* Hero — centered with 25% margins each side */}
        <div onClick={toggleListening} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '25%', right: '25%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 0
        }}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transition: 'transform 0.6s ease', transform: speakerEnabled || isProcessing || isSpeaking ? 'scale(1.04)' : 'scale(1)' }}>
            
            {/* SINGLE HERO VISUAL: Clean morphing system using provided prototype */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
              <ParticleWaveHD isVoiceMode={speakerEnabled || isProcessing || isSpeaking} audioLevel={speakerEnabled ? 0.2 : speakingAudioLevel} />
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '8%', width: 'min(92vw, 560px)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto', textAlign: 'center', gap: 14, transition: 'opacity 0.8s ease', opacity: uiVisible ? 1 : 0 }}>
            {(lastUserMessage || aiResponse) && (
              <div style={{
                width: '100%', maxHeight: '28vh', overflowY: 'auto',
                background: 'rgba(10,10,16,0.56)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18,
                padding: '14px 16px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                textAlign: 'left'
              }}>
                {lastUserMessage && (
                  <div style={{ color: 'rgba(255,255,255,0.46)', fontSize: '0.76rem', lineHeight: 1.5, marginBottom: aiResponse ? 8 : 0 }}>
                    {lastUserMessage}
                  </div>
                )}
                {aiResponse && (
                  <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.95rem', lineHeight: 1.55, fontWeight: 300 }}>
                    {aiResponse}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleTextSubmit} onClick={e => e.stopPropagation()} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(20,20,25,0.5)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
              padding: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Type to CubiQo"
                style={{
                  flex: 1, minWidth: 0, height: 42, border: 'none', outline: 'none',
                  background: 'transparent', color: '#fff', padding: '0 10px',
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

            <div style={{
              background: 'rgba(20,20,25,0.4)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '40px',
              padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: 'all 0.4s ease'
            }}>
              {isSpeaking ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: signal.hex, boxShadow: `0 0 12px ${signal.hex}`, animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Speaking</div>
                </div>
              ) : speakerEnabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: signal.hex, boxShadow: `0 0 12px ${signal.hex}`, animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Listening</div>
                </div>
              ) : isProcessing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: signal.hex, boxShadow: `0 0 12px ${signal.hex}`, animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Thinking</div>
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: '0.85rem', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 400 }}>
                  Idle · {signal.label}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* LEFT PANEL */}
        <div style={{ ...panelBase, left: '28px', transform: leftPanelOpen ? 'translateX(0)' : (uiVisible ? 'translateX(-130%)' : 'translateX(-130%)'), opacity: leftPanelOpen ? 1 : 0, pointerEvents: leftPanelOpen ? 'auto' : 'none', padding: '40px 24px' }}>
          {/* Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(({ id, label, icon: Icon, sub }) => (
              <div key={id} onClick={() => id === 'journal' ? navigate('/journal') : setActiveModal(id)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s ease',
                background: activeModal === id ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseOut={e => e.currentTarget.style.background = activeModal === id ? 'rgba(255,255,255,0.08)' : 'transparent'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color="rgba(255,255,255,0.6)" />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 1 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* AI model status */}
          <div style={{ background: `rgba(${signal.rgb},0.07)`, border: `1px solid ${signal.hex}26`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: '0.68rem', color: signal.hex, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Active Systems</div>
            {systemRows.map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, minWidth: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.72rem', width: 54, flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Profile / Auth */}

          <div style={{ marginTop: 14, marginBottom: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>Daily Journal</div>
            <textarea
              value={journalEntry}
              onChange={e => setJournalEntry(e.target.value)}
              placeholder="Personality notes for today (mood, energy, focus)..."
              style={{ width: '100%', minHeight: 86, resize: 'vertical', borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(0,0,0,0.2)', color: '#fff', padding: 10, fontSize: '0.78rem' }}
            />
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={17} color="#fff" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Signed in</div>
              </div>
              <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div onClick={() => setActiveModal('auth')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,212,255,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(0,212,255,0.06)'}
            >
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={17} color="#00d4ff" />
              </div>
              <div>
                <div style={{ color: '#00d4ff', fontSize: '0.88rem', fontWeight: 500 }}>Sign In</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>Create or access account</div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT PANEL */}
        <div style={{ ...panelBase, right: '28px', transform: rightPanelOpen ? 'translateX(0)' : 'translateX(130%)', opacity: rightPanelOpen ? 1 : 0, pointerEvents: rightPanelOpen ? 'auto' : 'none', padding: '32px 24px' }}>

          {/* Signal Aura Indicator (Replaces Tabs) */}
          <div style={{ position: 'relative', height: '60px', marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: `radial-gradient(circle, ${active.aura} 0%, transparent 70%)`,
              filter: 'blur(10px)', transition: 'all 0.5s ease'
            }} />
            <div style={{ display: 'flex', gap: 16, zIndex: 1 }}>
              {Object.entries(colorMap).map(([id, { hex }]) => (
                <div key={id} onClick={() => setSelectedKeywordColor(id)} style={{
                  width: selectedKeywordColor === id ? 32 : 12,
                  height: 12, borderRadius: 6, cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: hex,
                  opacity: selectedKeywordColor === id ? 1 : 0.25,
                  boxShadow: selectedKeywordColor === id ? `0 0 15px ${hex}80` : 'none'
                }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 14, background: `rgba(${active.rgb},0.07)`, border: `1px solid ${active.hex}24` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: active.hex, fontSize: '0.68rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>{active.label}</span>
              {colorLock && <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.68rem', letterSpacing: 1.5, textTransform: 'uppercase' }}>Locked</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.86rem', lineHeight: 1.35 }}>{active.desc}</div>
            <div style={{ color: 'rgba(255,255,255,0.34)', fontSize: '0.72rem', lineHeight: 1.45, marginTop: 8 }}>
              {activeColor === normalizeKeywordColor(rgyCapsule.color || 'yellow') ? rgyCapsule.intent : 'keyword shelf'}
            </div>
          </div>

          {/* Keywords */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {keywords[activeColor]?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keywords[activeColor].map((k, i) => (
                  <span key={i} style={{
                    background: `rgba(${active.rgb},0.12)`, color: active.hex,
                    border: `1px solid ${active.hex}30`, padding: '7px 14px',
                    borderRadius: 24, fontSize: '0.82rem', fontWeight: 500,
                    animation: 'fadeIn 0.3s ease-out'
                  }}>{k}</span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', marginTop: 40, lineHeight: 1.8 }}>
                Speak to CubiQo<br />Keywords will appear here
              </div>
            )}
          </div>

          <form onSubmit={e => { e.preventDefault(); addKeyword(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <input
              value={keywordDraft}
              onChange={e => setKeywordDraft(e.target.value)}
              placeholder="company, trade, collaboration"
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
            {['company', 'collaboration', 'trade'].map(k => (
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
          <div onClick={() => setActiveModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(14,14,22,0.95)', width: 480, maxWidth: '90%', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '36px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                <X size={16} />
              </button>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 300, marginBottom: 8, letterSpacing: 0.5 }}>{activeModal === 'auth' ? (authView === 'login' ? 'Welcome back' : 'Create account') : activeModal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
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
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    {['login', 'signup'].map(v => (
                      <button key={v} type="button" onClick={() => { setAuthView(v); setAuthError(''); }} style={{ flex: 1, padding: '8px', borderRadius: 10, cursor: 'pointer', border: 'none', background: authView === v ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)', color: authView === v ? '#00d4ff' : 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {v === 'login' ? 'Sign In' : 'Sign Up'}
                      </button>
                    ))}
                  </div>
                  {[{ label: 'Email', val: authEmail, set: setAuthEmail, type: 'email', Icon: Mail }, { label: 'Password', val: authPassword, set: setAuthPassword, type: 'password', Icon: Lock }].map(({ label, val, set, type, Icon }) => (
                    <div key={label} style={{ position: 'relative' }}>
                      <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                      <input type={type} placeholder={label} value={val} onChange={e => set(e.target.value)} required style={{ width: '100%', padding: '13px 14px 13px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  {authError && <div style={{ color: authError.includes('created') || authError.includes('synced') ? '#34d399' : '#f87171', fontSize: '0.8rem', padding: '8px 12px', background: authError.includes('created') || authError.includes('synced') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{authError}</div>}
                  {profileSyncError && <div style={{ color: '#f59e0b', fontSize: '0.8rem', padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8 }}>{profileSyncError}</div>}
                  <button type="submit" disabled={authLoading} style={{ padding: '13px', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', border: 'none', borderRadius: 12, color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1, marginTop: 4 }}>
                    {authLoading ? 'Loading...' : authView === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
              )}
              {activeModal !== 'settings' && activeModal !== 'integrations' && activeModal !== 'auth' && (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.85rem' }}>System connected. Ready.</span>
                </div>
              )}
              <button onClick={() => setActiveModal(null)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', border: 'none', borderRadius: 14, color: '#fff', fontSize: '0.9rem', fontWeight: 600, marginTop: 28, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 8px 24px rgba(0,212,255,0.25)' }}>
                Done
              </button>
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
          <Route path="/journal" element={<JournalPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
