import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import PlasmaField from "./components/PlasmaField";
import CubiQoVisual from "./components/CubiQoVisual";

// Landing Page - Full page plasma waves
const LandingPage = () => {
  const navigate = useNavigate();
  
  return (
    <div 
      data-testid="landing-page" 
      onClick={() => navigate('/app')}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      <PlasmaField aiState="neutral" />
      
      {/* Hero Content */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 7rem)',
          fontWeight: 300,
          color: '#fff',
          textShadow: '0 0 60px rgba(0, 212, 255, 0.4)',
          marginBottom: 20,
          letterSpacing: 8,
          fontFamily: "'Inter', sans-serif",
          textTransform: 'uppercase',
        }}>
          CubiQo
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: 50,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          letterSpacing: 3,
        }}>
          One Mind. Many Dimensions.
        </p>
        <p style={{
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.35)',
          fontFamily: "'Inter', sans-serif",
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          Tap anywhere to begin
        </p>
      </div>
    </div>
  );
};

// Demo App Page - Shows CubiQoVisual component integration
const DemoPage = () => {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [aiState, setAiState] = useState('neutral');
  
  return (
    <div 
      data-testid="demo-page"
      style={{ 
        width: '100%', 
        height: '100vh', 
        background: '#0a0a12',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="18" y="4" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="4" y="18" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="18" y="18" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '1.3rem',
          fontWeight: 400,
          color: '#fff',
          letterSpacing: 4,
          fontFamily: "'Inter', sans-serif",
        }}>
          CubiQo<sup style={{ fontSize: '0.6rem', opacity: 0.5 }}>Γäó</sup>
        </h1>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10,
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.85rem',
        }}>
          <span style={{ color: '#ff6b35', fontWeight: 600 }}>SIGNAL</span>
          <span style={{ opacity: 0.5 }}>One is enough.</span>
        </div>
      </header>
      
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Left - Sample prompts */}
        <div style={{
          width: '280px',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 25,
        }}>
          {[
            '"Explain quantum computing like I\'m five"',
            '"Best restaurants in Brooklyn?"',
            '"How do I learn Spanish fast?"',
            '"What\'s the meaning of life?"',
            '"Recommend a morning routine"',
          ].map((prompt, i) => (
            <p key={i} style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.9rem',
              fontStyle: 'italic',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
              {prompt}
            </p>
          ))}
        </div>
        
        {/* Center - CubiQoVisual Component */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {/* The standalone visual component */}
          <div style={{ 
            width: '600px', 
            height: '450px',
            position: 'relative'
          }}>
            <CubiQoVisual 
              isEnabled={speakerEnabled}
              aiState={aiState}
            />
          </div>
          
          {/* Speaker button */}
          <div style={{
            marginTop: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <button
              data-testid="speaker-toggle-btn"
              onClick={() => setSpeakerEnabled(!speakerEnabled)}
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: speakerEnabled ? '2px solid #ff6b35' : '2px solid rgba(255,255,255,0.2)',
                background: speakerEnabled ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" 
                stroke={speakerEnabled ? '#ff6b35' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                {speakerEnabled && (
                  <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </>
                )}
              </svg>
            </button>
            <span style={{
              color: speakerEnabled ? '#ff6b35' : 'rgba(255,255,255,0.4)',
              fontSize: '0.85rem',
            }}>
              {speakerEnabled ? 'Listening...' : 'Enable'}
            </span>
          </div>
        </div>
        
        {/* Right - AI State Controls & Indicators */}
        <div style={{
          width: '200px',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          {/* AI State buttons */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: 10, letterSpacing: 1 }}>
              AI STATE
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['neutral', 'thinking', 'speaking', 'listening', 'error'].map((state) => (
                <button
                  key={state}
                  data-testid={`state-btn-${state}`}
                  onClick={() => setAiState(state)}
                  style={{
                    padding: '8px 12px',
                    background: aiState === state ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: aiState === state ? '1px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    color: aiState === state ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
          
          {/* Color indicators */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: 10, letterSpacing: 1 }}>
              KEYWORDS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'].map((color, i) => (
                <div key={i} style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 10px ${color}40`,
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }}>ΓÜÖ∩╕Å Settings</span>
          <span style={{ cursor: 'pointer' }}>≡ƒÆ╗ Dev Panel</span>
          <span style={{ cursor: 'pointer' }}>≡ƒæñ Sign In</span>
        </div>
        <div>
          All conversations are confidential. CubiQo never retains user voice by policy.
          <span style={{ marginLeft: 10, color: '#06b6d4', cursor: 'pointer' }}>Try BYO Mode</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span>Powered by <strong style={{ color: '#fff' }}>Claude</strong></span>
          <span>Powered by <strong style={{ color: '#fff' }}>OpenAI</strong></span>
        </div>
      </footer>
    </div>
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
