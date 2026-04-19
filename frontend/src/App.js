import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import PlasmaWaveField from "./components/PlasmaWaveField";
import CubiQoVisual from "./components/CubiQoVisual";
import { Menu, Activity, X, Settings, Database, Shield, User, LogOut, Mail, Lock } from "lucide-react";
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
    <div data-testid="landing-page" onClick={() => navigate('/app')}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: 'pointer' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.6} color="#4444ff" />
          <pointLight position={[0, 10, 0]} intensity={0.4} color="#00ffff" />
          <group>
            <PlasmaWaveField isEnabled={false} aiState="neutral" />
          </group>
          <EffectComposer>
            <Bloom intensity={1.2} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 50, pointerEvents: 'none' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 300, color: '#fff', textShadow: '0 0 60px rgba(0,212,255,0.4)', marginBottom: 20, letterSpacing: 8, fontFamily: "'SF Pro Display','Inter',sans-serif", textTransform: 'uppercase' }}>CubiQo</h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255,255,255,0.6)', marginBottom: 50, fontFamily: "'SF Pro Display','Inter',sans-serif", fontWeight: 300, letterSpacing: 3 }}>One Mind. Many Dimensions.</p>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter',sans-serif", animation: 'pulse 2s ease-in-out infinite' }}>Tap anywhere to begin</p>
      </div>
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
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [keywords, setKeywords] = useState({ red: [], green: [], yellow: [] });
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [uiVisible, setUiVisible] = useState(true);

  // Periodic UI Breathing (Back and Forth between functional and cinematic)
  useEffect(() => {
    const interval = setInterval(() => {
      setUiVisible(prev => !prev);
    }, 15000); // 15s cycle
    return () => clearInterval(interval);
  }, []);

  const aiState = isSpeaking ? 'speaking' : (speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral'));

  const recognitionRef = useRef(null);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const transcriptRef = useRef('');
  const callBackendRef = useRef(null);

  // Supabase auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setActiveModal(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else setAuthError('Check your email to confirm your account.');
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
      setTranscript(t);
    };
    rec.onerror = (e) => {
      console.warn('Speech error:', e.error);
      setSpeakerEnabled(false);
      setIsProcessing(false);
    };
    rec.onend = () => {
      const text = transcriptRef.current.trim();
      transcriptRef.current = '';
      setTranscript('');
      setSpeakerEnabled(false);
      if (text) {
        setIsProcessing(true);
        callBackendRef.current(text);
      }
    };
    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callBackend = async (text) => {
    try {
      const res = await fetch('/api/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setAiResponse(data.response || "");
      if (data.keywords) setKeywords(data.keywords);
      if (data.audio_url) {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = data.audio_url;
        audioRef.current.volume = 1;
        audioRef.current.onplay = () => setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsSpeaking(false);
        });
      } else if (window.speechSynthesis) {
        // Fallback to browser TTS if no audio_url (e.g., missing API key)
        const utterance = new SpeechSynthesisUtterance(data.response || "");
        utterance.rate = 0.9; // Slightly slower, more deliberate
        utterance.pitch = 0.8;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      // Fallback: local keyword extraction
      const words = text.split(" ").filter(w => w.length > 3);
      const nk = { red: [...keywords.red], green: [...keywords.green], yellow: [...keywords.yellow] };
      words.forEach(w => {
        const r = Math.random();
        if (r < 0.33) nk.red.push(w); else if (r < 0.66) nk.green.push(w); else nk.yellow.push(w);
      });
      nk.red = [...new Set(nk.red)].slice(-10);
      nk.green = [...new Set(nk.green)].slice(-10);
      nk.yellow = [...new Set(nk.yellow)].slice(-10);
      setKeywords(nk);
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };
  callBackendRef.current = callBackend;

  const toggleListening = () => {
    // Unlock audio context for iOS/Safari
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});
    }
    
    if (isProcessing) return;
    if (!speakerEnabled) {
      transcriptRef.current = '';
      setTranscript('');
      setSpeakerEnabled(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Fallback: simulate for browsers without mic/Speech API
        setSpeakerEnabled(true);
        setTimeout(() => {
          const fake = 'simulated voice input about balance and focus';
          transcriptRef.current = fake;
          setTranscript(fake);
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
    green: { label: 'Potential', desc: 'Future Growth', hex: '#10b981', rgb: '16,185,129', aura: 'rgba(16,185,129,0.15)' },
    yellow: { label: 'Activity', desc: 'Active Energy', hex: '#f59e0b', rgb: '245,158,11', aura: 'rgba(245,158,11,0.15)' },
    red: { label: 'Wish', desc: 'Deep Desire', hex: '#ef4444', rgb: '239,68,68', aura: 'rgba(239,68,68,0.15)' }
  };
  const active = colorMap[selectedKeywordColor];

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
            
            {/* 1. PRE-MORPH: The exact 60k particle classic visual from 3 weeks ago */}
            <div style={{ position: 'absolute', inset: 0, opacity: (speakerEnabled || isProcessing || isSpeaking) ? 0 : 1, transition: 'opacity 1.2s ease', pointerEvents: 'none', zIndex: 1 }}>
              <CubiQoVisual isEnabled={false} aiState={aiState} />
            </div>

            {/* 2. POST-MORPH: The structured R3F pipe cube currently live */}
            <div style={{ position: 'absolute', inset: 0, opacity: (speakerEnabled || isProcessing || isSpeaking) ? 1 : 0, transition: 'opacity 1.2s ease', pointerEvents: 'none', zIndex: 2 }}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 1000 }}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
                dpr={[1, 2]}
                style={{ background: 'transparent' }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={0.8} />
                  <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
                  <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
                  <pointLight position={[-10, -10, -10]} intensity={0.6} color="#4444ff" />
                  <pointLight position={[0, 10, 0]} intensity={0.4} color="#00ffff" />
                  <group>
                    <PlasmaWaveField isEnabled={speakerEnabled || isProcessing || isSpeaking} aiState={aiState} />
                  </group>
                  <EffectComposer>
                    <Bloom intensity={1.2} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
                    <Noise opacity={0.02} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                  </EffectComposer>
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', textAlign: 'center', gap: 16, transition: 'opacity 0.8s ease', opacity: uiVisible ? 1 : 0 }}>
            

            <div style={{
              background: 'rgba(20,20,25,0.4)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '40px',
              padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              transition: 'all 0.4s ease'
            }}>
              {isSpeaking ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0088', boxShadow: '0 0 12px #ff0088', animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Speaking</div>
                </div>
              ) : speakerEnabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b35', boxShadow: '0 0 12px #ff6b35', animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Listening</div>
                </div>
              ) : isProcessing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 12px #00d4ff', animation: 'pulse 1s infinite' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 500 }}>Processing</div>
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 400 }}>
                  Tap to speak
                </div>
              )}
            </div>

            {speakerEnabled && transcript && (
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', fontStyle: 'italic', maxWidth: 360, textShadow: '0 2px 10px rgba(0,0,0,0.5)', fontWeight: 300 }}>
                "{transcript}"
              </div>
            )}
            {aiResponse && !isProcessing && (
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 380, background: 'rgba(10,10,15,0.5)', backdropFilter: 'blur(20px)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginTop: 8, fontWeight: 300, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                {aiResponse}
              </div>
            )}
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
          <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(0,212,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Active Systems</div>
            {['Claude 3.5', 'GPT-4o', 'ElevenLabs TTS', 'Web Search'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Profile / Auth */}
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

          {/* Category detail removed - no literal explanation needed */}
          <div style={{ marginBottom: 24 }} />

          {/* Keywords */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {keywords[selectedKeywordColor]?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {keywords[selectedKeywordColor].map((k, i) => (
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
                  {[{ label: 'AI Voice', value: 'ElevenLabs · Rachel', color: '#00d4ff' }, { label: 'Primary Model', value: 'Claude 3.5 Sonnet', color: '#8b5cf6' }, { label: 'Fallback Model', value: 'GPT-4o', color: '#f59e0b' }, { label: 'Web Search', value: 'Enabled · Playwright', color: '#34d399' }].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{label}</span>
                      <span style={{ color, fontSize: '0.85rem', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeModal === 'integrations' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['Notion', 'Google Calendar', 'Spotify', 'Apple Health', 'Slack', 'Linear'].map(app => (
                    <div key={app} style={{ background: 'rgba(255,255,255,0.04)', padding: '18px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                      <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.88rem' }}>{app}</div>
                      <div style={{ color: '#00d4ff', fontSize: '0.72rem', marginTop: 6, letterSpacing: 1 }}>CONNECT</div>
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
                  {authError && <div style={{ color: authError.includes('Check your') ? '#34d399' : '#f87171', fontSize: '0.8rem', padding: '8px 12px', background: authError.includes('Check your') ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{authError}</div>}
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
