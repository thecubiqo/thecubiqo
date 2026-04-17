import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import PlasmaField from "./components/PlasmaField";
import CubiQoVisual from "./components/CubiQoVisual";
import { Menu, Activity, X, Settings, Database, Shield, User, Mic, MicOff } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://cubiqo-backend.onrender.com";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div data-testid="landing-page" onClick={() => navigate('/app')}
      style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', cursor: 'pointer' }}>
      <PlasmaField aiState="neutral" />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 50, pointerEvents: 'none' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 300, color: '#fff', textShadow: '0 0 60px rgba(0,212,255,0.4)', marginBottom: 20, letterSpacing: 8, fontFamily: "'SF Pro Display','Inter',sans-serif", textTransform: 'uppercase' }}>CubiQo</h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255,255,255,0.6)', marginBottom: 50, fontFamily: "'SF Pro Display','Inter',sans-serif", fontWeight: 300, letterSpacing: 3 }}>One Mind. Many Dimensions.</p>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter',sans-serif", animation: 'pulse 2s ease-in-out infinite' }}>Tap anywhere to begin</p>
      </div>
    </div>
  );
};

const DemoPage = () => {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [keywords, setKeywords] = useState({ red: [], green: [], yellow: [] });
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const aiState = speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral');

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (e) => {
        let t = "";
        for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
        setTranscript(t);
      };
      recognitionRef.current.onend = () => {
        setSpeakerEnabled(false);
        setIsProcessing(true);
      };
    }
  }, []);

  useEffect(() => {
    if (!speakerEnabled && isProcessing && transcript) {
      callBackend(transcript);
    } else if (!speakerEnabled && isProcessing && !transcript) {
      setIsProcessing(false);
    }
  }, [speakerEnabled, isProcessing]);

  const callBackend = async (text) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setAiResponse(data.response || "");
      if (data.keywords) setKeywords(data.keywords);
      if (data.audio_url) {
        audioRef.current = new Audio(data.audio_url);
        audioRef.current.play();
      }
      setRightPanelOpen(true);
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
      setRightPanelOpen(true);
    } finally {
      setIsProcessing(false);
      setTranscript("");
    }
  };

  const toggleListening = () => {
    if (!speakerEnabled && !isProcessing) {
      setSpeakerEnabled(true);
      setTranscript("");
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { console.error(e); }
      }
    } else if (speakerEnabled) {
      setSpeakerEnabled(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  const colorMap = {
    green: { label: 'Green · Sattva', desc: 'Purity, Harmony, Balance', hex: '#34d399', rgb: '52,211,153' },
    yellow: { label: 'Yellow · Rajas', desc: 'Action, Passion, Energy', hex: '#fbbf24', rgb: '251,191,36' },
    red: { label: 'Red · Tamas', desc: 'Inertia, Chaos, Imbalance', hex: '#f87171', rgb: '248,113,113' }
  };
  const active = colorMap[selectedKeywordColor];

  const panelBase = {
    position: 'absolute', top: '90px', bottom: '30px', width: '300px',
    display: 'flex', flexDirection: 'column', borderRadius: '20px',
    background: 'rgba(10,10,18,0.75)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
    zIndex: 10,
    transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
  };

  const navItems = [
    { id: 'dimensions', label: 'My Dimensions', icon: Activity, sub: 'Explore your space' },
    { id: 'settings', label: 'Settings', icon: Settings, sub: 'Preferences & AI models' },
    { id: 'integrations', label: 'Integrations', icon: Database, sub: 'Notion, Calendar, Health' },
    { id: 'privacy', label: 'Data & Privacy', icon: Shield, sub: 'Zero retention policy' }
  ];

  return (
    <>
      <div data-testid="demo-page" style={{ width: '100%', height: '100vh', background: '#08080f', position: 'relative', overflow: 'hidden' }}>

        {/* Toggle buttons */}
        {[
          { side: 'left', open: leftPanelOpen, toggle: () => setLeftPanelOpen(v => !v), Icon: Menu },
          { side: 'right', open: rightPanelOpen, toggle: () => setRightPanelOpen(v => !v), Icon: Activity }
        ].map(({ side, open, toggle, Icon }) => (
          <button key={side} onClick={toggle} style={{
            position: 'absolute', top: 28, [side]: 28, zIndex: 100,
            background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)', color: '#fff', borderRadius: '14px',
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.25s ease',
            boxShadow: open ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none'
          }}>
            {open ? <X size={18} /> : <Icon size={18} />}
          </button>
        ))}

        {/* Hero — centered with 25% margins each side */}
        <div onClick={toggleListening} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '25%', right: '25%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 0
        }}>
          <div style={{ width: '100%', height: '100%', position: 'relative', transition: 'transform 0.6s ease', transform: speakerEnabled || isProcessing ? 'scale(1.04)' : 'scale(1)' }}>
            <CubiQoVisual isEnabled={speakerEnabled || isProcessing} aiState={aiState} />
          </div>

          <div style={{ position: 'absolute', bottom: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', textAlign: 'center', gap: 10 }}>
            {speakerEnabled && (
              <>
                <div style={{ color: '#ff6b35', fontSize: '0.8rem', letterSpacing: 4, textTransform: 'uppercase', animation: 'pulse 1.5s ease-in-out infinite', textShadow: '0 0 20px rgba(255,107,53,0.8)', fontWeight: 600 }}>Listening</div>
                {transcript && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', fontStyle: 'italic', maxWidth: 300 }}>"{transcript}"</div>}
              </>
            )}
            {!speakerEnabled && isProcessing && <div style={{ color: '#00d4ff', fontSize: '0.8rem', letterSpacing: 4, textTransform: 'uppercase', animation: 'pulse 1s ease-in-out infinite', textShadow: '0 0 20px rgba(0,212,255,0.8)', fontWeight: 600 }}>Processing</div>}
            {!speakerEnabled && !isProcessing && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', letterSpacing: 4, textTransform: 'uppercase', fontWeight: 400 }}>Tap to speak</div>}
            {aiResponse && !isProcessing && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 320, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
                {aiResponse}
              </div>
            )}
          </div>
        </div>

        {/* LEFT PANEL */}
        <div style={{ ...panelBase, left: '28px', transform: leftPanelOpen ? 'translateX(0)' : 'translateX(-130%)', opacity: leftPanelOpen ? 1 : 0, pointerEvents: leftPanelOpen ? 'auto' : 'none', padding: '32px 24px' }}>
          {/* Logo */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 200, color: '#fff', letterSpacing: 5, fontFamily: "'SF Pro Display','Inter',sans-serif" }}>CubiQo<sup style={{ fontSize: '0.55rem', opacity: 0.4, letterSpacing: 1 }}>™</sup></div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>One Mind. Many Dimensions.</div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(({ id, label, icon: Icon, sub }) => (
              <div key={id} onClick={() => setActiveModal(id)} style={{
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

          {/* Profile */}
          <div onClick={() => setActiveModal('profile')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={17} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 500 }}>Your Profile</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>Manage account</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ ...panelBase, right: '28px', transform: rightPanelOpen ? 'translateX(0)' : 'translateX(130%)', opacity: rightPanelOpen ? 1 : 0, pointerEvents: rightPanelOpen ? 'auto' : 'none', padding: '32px 24px' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 200, color: '#fff', letterSpacing: 1, fontFamily: "'SF Pro Display','Inter',sans-serif" }}>Signal</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>Real-time awareness</div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {Object.entries(colorMap).map(([id, { label, hex }]) => (
              <button key={id} onClick={() => setSelectedKeywordColor(id)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.25s',
                background: selectedKeywordColor === id ? `rgba(${colorMap[id].rgb},0.15)` : 'rgba(255,255,255,0.03)',
                border: selectedKeywordColor === id ? `1px solid ${hex}50` : '1px solid rgba(255,255,255,0.06)',
                color: selectedKeywordColor === id ? hex : 'rgba(255,255,255,0.4)',
                fontSize: '0.68rem', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
                boxShadow: selectedKeywordColor === id ? `0 0 16px ${hex}20` : 'none'
              }}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          {/* Active category detail */}
          <div style={{ marginBottom: 20, padding: '14px 16px', background: `rgba(${active.rgb},0.08)`, borderRadius: 14, border: `1px solid ${active.hex}25` }}>
            <div style={{ color: active.hex, fontSize: '0.85rem', fontWeight: 600 }}>{active.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: 3 }}>{active.desc}</div>
          </div>

          {/* Keywords */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Keywords Detected</div>
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

          {/* Philosophy note */}
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
            Signal maps to Hindu philosophy — Sattva (clarity), Rajas (motion), Tamas (inertia).
          </div>
        </div>

        {/* MODALS */}
        {activeModal && (
          <div onClick={() => setActiveModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(14,14,22,0.95)', width: 480, maxWidth: '90%', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: '36px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                <X size={16} />
              </button>
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 300, marginBottom: 8, letterSpacing: 0.5 }}>{activeModal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 28, lineHeight: 1.7 }}>Configure your CubiQo experience. All changes sync across sessions.</p>

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
              {activeModal !== 'settings' && activeModal !== 'integrations' && (
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
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
