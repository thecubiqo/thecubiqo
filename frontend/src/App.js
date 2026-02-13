import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import PlasmaField from "./components/PlasmaField";
import PlasmaCube from "./components/PlasmaCube";

// Landing Page - Plasma waves, click anywhere to enter
const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/app');
  };
  
  return (
    <div 
      data-testid="landing-page" 
      onClick={handleClick}
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
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            fontWeight: 300,
            color: '#fff',
            textShadow: '0 0 60px rgba(0, 212, 255, 0.4)',
            marginBottom: 20,
            letterSpacing: 8,
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
          }}
        >
          CubiQo
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 50,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            letterSpacing: 3,
          }}
        >
          One Mind. Many Dimensions.
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.35)',
            fontFamily: "'Inter', sans-serif",
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          Tap anywhere to begin
        </p>
      </div>
    </div>
  );
};

// App Page - Dark cube with orange soul nodes, speaker activates plasma cube
const AppPage = () => {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  
  const toggleSpeaker = () => {
    setSpeakerEnabled(!speakerEnabled);
  };
  
  return (
    <div 
      data-testid="app-page"
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100vh', 
        background: '#0a0a12',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        zIndex: 100,
      }}>
        <div style={{ width: 40 }}>
          {/* Logo placeholder */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="18" y="4" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="4" y="18" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="18" y="18" width="10" height="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '1.2rem',
          fontWeight: 400,
          color: '#fff',
          letterSpacing: 4,
          fontFamily: "'Inter', sans-serif",
        }}>
          CubiQo<sup style={{ fontSize: '0.6rem', opacity: 0.5 }}>™</sup>
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
      
      {/* Main Cube Area */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
      }}>
        {/* Dark cube (inactive state) */}
        {!speakerEnabled && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotateX(-15deg) rotateY(25deg)',
            width: '200px',
            height: '200px',
            background: 'rgba(15, 15, 25, 0.9)',
            borderRadius: '20px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 0 50px rgba(100, 100, 180, 0.1)',
            transition: 'all 0.5s ease',
          }}>
            {/* Orange soul nodes inside dark cube */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ff6b35',
                  boxShadow: '0 0 15px #ff6b35, 0 0 30px rgba(255, 107, 53, 0.5)',
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Plasma Cube (active state) */}
        <PlasmaCube isActive={speakerEnabled} />
      </div>
      
      {/* Floating ambient particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: i % 5 === 0 ? '#ff6b35' : 'rgba(255,255,255,0.4)',
              boxShadow: i % 5 === 0 ? '0 0 10px #ff6b35' : '0 0 5px rgba(255,255,255,0.3)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `drift ${10 + Math.random() * 20}s linear infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      
      {/* Sample prompts on left */}
      <div style={{
        position: 'absolute',
        left: 30,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 25,
        maxWidth: '280px',
      }}>
        {[
          '"Explain quantum computing like I\'m five"',
          '"Best restaurants in Brooklyn?"',
          '"How do I learn Spanish fast?"',
          '"What\'s the meaning of life?"',
          '"Recommend a morning routine"',
        ].map((prompt, i) => (
          <p
            key={i}
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.9rem',
              fontStyle: 'italic',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
          >
            {prompt}
          </p>
        ))}
      </div>
      
      {/* Color indicators on right */}
      <div style={{
        position: 'absolute',
        right: 30,
        top: '35%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
      }}>
        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'].map((color, i) => (
          <div
            key={i}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}40`,
            }}
          />
        ))}
        <span style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: '0.7rem', 
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span>🔑</span> Keywords
        </span>
      </div>
      
      {/* Speaker Enable Button */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        <button
          data-testid="speaker-toggle-btn"
          onClick={toggleSpeaker}
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={speakerEnabled ? '#ff6b35' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5">
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
          fontFamily: "'Inter', sans-serif",
        }}>
          {speakerEnabled ? 'Listening...' : 'Enable'}
        </span>
      </div>
      
      {/* Footer */}
      <footer style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 30px',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }}>⚙️ Settings</span>
          <span style={{ cursor: 'pointer' }}>💻 Dev Panel</span>
          <span style={{ cursor: 'pointer' }}>👤 Sign In</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          All conversations are confidential. CubiQo never retains user voice by policy.
          <span style={{ marginLeft: 10, color: '#06b6d4' }}>Try BYO Mode</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
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
          <Route path="/app" element={<AppPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
