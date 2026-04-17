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

// Demo App Page - 2 Panel UI with Glassmorphism
const DemoPage = () => {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom states that map to Hindu concepts
  const aiState = speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral');
  
  const [keywords, setKeywords] = useState({
    red: ['mindless scrolling', 'junk food binges', 'procrastination'],
    green: ['yoga session', 'reading philosophy', 'meditation'],
    yellow: ['intense work sprint', 'arguing on forums', 'hustle']
  });
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');

  const toggleListening = () => {
    if (!speakerEnabled && !isProcessing) {
      setSpeakerEnabled(true);
      // Simulate listening and then categorizing new activity words
      setTimeout(() => {
        setSpeakerEnabled(false);
        setIsProcessing(true);
        setTimeout(() => {
          setIsProcessing(false);
        }, 3000);
      }, 4000);
    } else if (speakerEnabled) {
      setSpeakerEnabled(false);
    }
  };

  const getSattvaDetails = (colId) => {
    switch (colId) {
      case 'green': return { title: 'Green (Sattva)', desc: 'Purity, Harmony, Balance' };
      case 'yellow': return { title: 'Yellow (Rajas)', desc: 'Action, Passion, Energy' };
      case 'red': return { title: 'Red (Tamas)', desc: 'Inertia, Chaos, Imbalance' };
      default: return { title: '', desc: '' };
    }
  };
  
  const activeColorDetails = getSattvaDetails(selectedKeywordColor);

  return (
    <>
      <style>
        {`
          @keyframes slideInLeft {
            from { transform: translateX(-120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
      <div 
        data-testid="demo-page"
        style={{ 
          width: '100%', 
          height: '100vh', 
          background: '#0a0a12',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Center - CubiQo Visual - Entire area is tappable for Talk Mode */}
        {/* Center Canvas is absolute and fills the screen, underneath the floating side panels */}
        <div 
          onClick={toggleListening}
          style={{ 
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 0
          }}>
          
          <div style={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            transition: 'all 0.5s ease',
            transform: speakerEnabled || isProcessing ? 'scale(1.02)' : 'scale(1)'
          }}>
            <CubiQoVisual 
              isEnabled={speakerEnabled || isProcessing} // Morphs to interactive cube when active!
              aiState={aiState}
            />
          </div>
          
          {/* Subtle Indicator Overlay */}
          <div style={{
              position: 'absolute',
              bottom: '5%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none'
          }}>
            {speakerEnabled && (
              <div style={{
                color: '#ff6b35',
                fontSize: '0.9rem',
                letterSpacing: 3,
                textTransform: 'uppercase',
                animation: 'pulse 1.5s ease-in-out infinite',
                textShadow: '0 0 10px rgba(255, 107, 53, 0.5)'
              }}>
                Listening...
              </div>
            )}
            {!speakerEnabled && isProcessing && (
              <div style={{
                color: '#00d4ff',
                fontSize: '0.9rem',
                letterSpacing: 3,
                textTransform: 'uppercase',
                animation: 'pulse 1s ease-in-out infinite',
                textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
              }}>
                Processing...
              </div>
            )}
            {!speakerEnabled && !isProcessing && (
              <div style={{
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.75rem',
                letterSpacing: 2,
                textTransform: 'uppercase'
              }}>
                Tap to speak
              </div>
            )}
          </div>
        </div>

        {/* Left - Profile & Settings Sidebar (Frosted Glass) */}
        <div style={{
          position: 'absolute',
          top: '20px', left: '20px', bottom: '20px',
          width: '280px',
          padding: '40px 30px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'rgba(20, 20, 25, 0.25)', // Premium Translucency
          backdropFilter: 'blur(24px)', // Apple-inspired Glassmorphism
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 10,
          animation: 'slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 60, marginTop: 10 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 300, color: '#fff', letterSpacing: 4, fontFamily: "'Inter', sans-serif", margin: 0 }}>
              CubiQo<sup style={{ fontSize: '0.6rem', opacity: 0.5, marginLeft: 2 }}>™</sup>
            </h1>
          </div>
          
          {/* Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
            {[
              { label: 'My Dimensions', active: true },
              { label: 'Account Settings', active: false },
              { label: 'Integrations', active: false },
              { label: 'Data & Privacy', active: false }
            ].map((item, i) => (
              <div key={i} style={{ 
                color: item.active ? '#00d4ff' : 'rgba(255,255,255,0.5)', 
                fontSize: '0.9rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => { if (!item.active) e.target.style.color = '#fff'; }}
              onMouseOut={(e) => { if (!item.active) e.target.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.active ? '#00d4ff' : 'transparent' }} />
                {item.label}
              </div>
            ))}
          </div>
          
          <div style={{ flex: 1 }} />
          
          {/* Auth / Profile Area */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 15, 
            padding: '15px', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>U</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: '0.9rem' }}>User Profile</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Account & Auth</span>
            </div>
          </div>
        </div>
        
        {/* Right - Activities & Insights Panel (Frosted Glass) */}
        <div style={{
          position: 'absolute',
          top: '20px', right: '20px', bottom: '20px',
          width: '320px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          borderRadius: '24px',
          background: 'rgba(20, 20, 25, 0.25)', // Premium Translucency
          backdropFilter: 'blur(24px)', // Apple-inspired Glassmorphism
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 10,
          animation: 'slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: 0, letterSpacing: 0.5, fontFamily: "'Inter', sans-serif" }}>Activities</h2>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: 25 }}>
            Categorisation maps to the Hindu philosophical tenets. Keywords reflect the distinct energy signatures of the activities you indulge in.
          </p>
          
          {/* Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 25 }}>
            {[
              { id: 'green', label: 'Green (Sattva)', dotColor: '#2dd4bf', bgColor: 'rgba(45, 212, 191, 0.15)' },
              { id: 'yellow', label: 'Yellow (Rajas)', dotColor: '#facc15', bgColor: 'rgba(250, 204, 21, 0.15)' },
              { id: 'red', label: 'Red (Tamas)', dotColor: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.15)' }
            ].map(col => (
              <button
                key={col.id}
                onClick={() => setSelectedKeywordColor(col.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: selectedKeywordColor === col.id ? col.bgColor : 'rgba(255,255,255,0.03)',
                  border: selectedKeywordColor === col.id ? `1px solid ${col.dotColor}50` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: selectedKeywordColor === col.id ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedKeywordColor === col.id ? `0 0 15px ${col.dotColor}20` : 'none',
                  textAlign: 'left'
                }}
              >
                <div style={{ 
                  width: 10, height: 10, borderRadius: '50%', 
                  background: col.dotColor,
                  boxShadow: selectedKeywordColor === col.id ? `0 0 8px ${col.dotColor}` : 'none'
                }} />
                <span style={{ fontWeight: selectedKeywordColor === col.id ? 600 : 400 }}>{col.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamics Keywords */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e'}40`,
            borderRadius: '16px',
            padding: '24px 20px',
            marginBottom: 20,
            transition: 'border 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            flex: 1
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, height: '2px',
              background: `linear-gradient(90deg, transparent, ${selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e'}, transparent)`
            }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e'} strokeWidth="2">
                    <path d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                {activeColorDetails.title}
              </h3>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 400, marginLeft: 32 }}>
                {activeColorDetails.desc}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {keywords[selectedKeywordColor] && keywords[selectedKeywordColor].length > 0 ? (
                keywords[selectedKeywordColor].map((k, i) => (
                  <span key={i} style={{ 
                    background: `rgba(${selectedKeywordColor === 'green' ? '45,212,191' : selectedKeywordColor === 'yellow' ? '250,204,21' : '244,63,94'}, 0.1)`, 
                    color: selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e', 
                    border: `1px solid rgba(${selectedKeywordColor === 'green' ? '45,212,191' : selectedKeywordColor === 'yellow' ? '250,204,21' : '244,63,94'}, 0.3)`, 
                    padding: '8px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem',
                    boxShadow: `0 0 10px rgba(${selectedKeywordColor === 'green' ? '45,212,191' : selectedKeywordColor === 'yellow' ? '250,204,21' : '244,63,94'}, 0.1)`
                  }}>
                    {k}
                  </span>
                ))
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>
                  No active behaviors recorded yet.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
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
