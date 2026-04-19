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
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [keywords, setKeywords] = useState({ red: [], green: [], yellow: [] });
  const [user, setUser] = useState(null);

  const aiState = isSpeaking ? 'speaking' : (speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral'));

  // Sample prompts from reference image
  const samplePrompts = [
    "\"I need motivation to start working out\"",
    "\"Explain quantum computing like I'm five\"",
    "\"Best restaurants in Brooklyn?\"",
    "\"How do I learn Spanish fast?\"",
    "\"What's the meaning of life?\""
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const toggleListening = () => {
    if (isProcessing) return;
    setSpeakerEnabled(!speakerEnabled);
  };

  return (
    <>
      <div 
        data-testid="demo-page" 
        style={{ width: '100%', height: '100vh', background: '#020205', position: 'relative', overflow: 'hidden' }}
      >
        {/* BACKGROUND VISUAL (High Fidelity Ribbons) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} onClick={toggleListening}>
          <CubiQoVisual isEnabled={speakerEnabled || isProcessing || isSpeaking} aiState={aiState} />
        </div>

        {/* TOP BRANDING (Picture 4 Style) */}
        <div style={{ position: 'absolute', top: 32, left: 140, zIndex: 100, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: "'Inter', sans-serif" }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 600, color: '#ff6b35' }}>C</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 500, color: '#fff' }}>ubi</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 600, color: '#ff6b35' }}>Q</span>
            <span style={{ fontSize: '2.2rem', fontWeight: 500, color: '#fff' }}>o</span>
            <sup style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>TM</sup>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 4, marginTop: 4, textTransform: 'uppercase', fontWeight: 500 }}>
            HOME TO GENERAL INTELLIGENCE
          </div>
        </div>

        {/* LEFT: SAMPLE PROMPTS (Picture 4) */}
        <div style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 24, pointerEvents: 'none' }}>
          {samplePrompts.map((prompt, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 300, transition: 'all 0.5s ease' }}>
              {prompt}
            </div>
          ))}
        </div>

        {/* RIGHT: RGY SIGNAL & KEYWORDS (Picture 4) */}
        <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Signal Light Container */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '100px', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 10, backdropFilter: 'blur(10px)'
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 10px #ff444480', opacity: aiState === 'thinking' ? 1 : 0.3 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffcc33', boxShadow: '0 0 10px #ffcc3380', opacity: aiState === 'listening' ? 1 : 0.3 }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff8880', opacity: aiState === 'speaking' ? 1 : 0.3 }} />
          </div>
          
          {/* Keywords Trigger */}
          <div onClick={() => setRightPanelOpen(!rightPanelOpen)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.5 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 300 }}>#</span>
            </div>
            <div style={{ fontSize: '0.55rem', color: '#fff', letterSpacing: 2, textTransform: 'uppercase' }}>KEYWORDS</div>
          </div>
        </div>

        {/* BOTTOM CENTER: TAP TO SPEAK */}
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 100, textAlign: 'center' }}>
          <button 
            onClick={toggleListening}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '100px', padding: '14px 48px', color: '#fff', fontSize: '0.8rem',
              letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(20px)',
              transition: 'all 0.3s ease'
            }}
          >
            {aiState === 'neutral' ? 'TAP TO SPEAK' : aiState}
          </button>
        </div>

        {/* FOOTER (Picture 3/4) */}
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', padding: '0 40px', pointerEvents: 'none' }}>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', letterSpacing: 0.5 }}>
            Conversations are confidential. CubiQo never retains user voice by policy.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', letterSpacing: 0.5, display: 'flex', gap: 12 }}>
            <span>Try BYO Mode — Your data · Your storage · Your API key</span>
            <span>© 2025 CubiQo</span>
          </div>
        </div>

        {/* SIDE CONTROLS (Settings/Sign In) */}
        <div style={{ position: 'absolute', bottom: 30, left: 30, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button onClick={() => setActiveModal('settings')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            <Settings size={16} /> Settings
          </button>
          <button onClick={() => setActiveModal('auth')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            <User size={16} /> Sign In
          </button>
        </div>

        {/* MODALS (Simplified for layout) */}
        {activeModal && (
          <div onClick={() => setActiveModal(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div onClick={e => e.stopPropagation()} style={{ background: '#0a0a0f', padding: 40, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
               <h2>{activeModal.toUpperCase()}</h2>
               <button onClick={() => setActiveModal(null)}>Close</button>
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
