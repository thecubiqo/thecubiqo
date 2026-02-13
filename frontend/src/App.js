import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlasmaField from "./components/PlasmaField";

// AI State control panel
const AIStateControls = ({ currentState, onStateChange }) => {
  const states = ['neutral', 'thinking', 'speaking', 'listening', 'error'];
  
  return (
    <div
      data-testid="ai-state-controls"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100,
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        maxWidth: '300px',
      }}
    >
      {states.map((state) => (
        <button
          key={state}
          data-testid={`state-btn-${state}`}
          onClick={() => onStateChange(state)}
          style={{
            padding: '8px 16px',
            background: currentState === state 
              ? 'rgba(0, 212, 255, 0.4)' 
              : 'rgba(255, 255, 255, 0.1)',
            border: currentState === state 
              ? '1px solid #00d4ff' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            textTransform: 'capitalize',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
        >
          {state}
        </button>
      ))}
    </div>
  );
};

// Landing page with plasma effect
const LandingPage = () => {
  const [aiState, setAiState] = useState('neutral');
  const [audioLevel, setAudioLevel] = useState(0);
  
  return (
    <div data-testid="landing-page" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Plasma Background */}
      <PlasmaField 
        aiState={aiState} 
        onAudioLevelChange={setAudioLevel}
      />
      
      {/* AI State Controls */}
      <AIStateControls currentState={aiState} onStateChange={setAiState} />
      
      {/* Hero Content Overlay */}
      <div
        data-testid="hero-content"
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
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 0 40px rgba(0, 212, 255, 0.5), 0 0 80px rgba(224, 64, 251, 0.3)',
            marginBottom: '20px',
            letterSpacing: '-2px',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          CubiQo
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            margin: '0 auto 30px',
            lineHeight: 1.6,
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          One Mind. Many Dimensions.
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          Move your mouse • Enable audio • Change AI states
        </p>
      </div>
      
      {/* Bottom info */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
        }}
      >
        <p>3D Plasma Particle System • Three.js + React Three Fiber</p>
        <p style={{ marginTop: '4px', opacity: 0.6 }}>
          Audio Level: {(audioLevel * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
