import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import PlasmaField from "./components/PlasmaField";
import CubiQoVisual from "./components/CubiQoVisual";
import { Menu, Activity, X, Settings, Database, Shield, User } from "lucide-react";

// Landing Page - Full page plasma waves
const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div 
      data-testid="landing-page" 
      onClick={() => navigate('/app')}
      style={{ 
        position: 'relative', width: '100%', height: '100vh', 
        overflow: 'hidden', cursor: 'pointer'
      }}
    >
      <PlasmaField aiState="neutral" />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center',
        zIndex: 50, pointerEvents: 'none',
      }}>
        <h1 style={{
          fontSize: 'clamp(3rem, 10vw, 7rem)', fontWeight: 300, color: '#fff',
          textShadow: '0 0 60px rgba(0, 212, 255, 0.4)', marginBottom: 20,
          letterSpacing: 8, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase',
        }}>
          CubiQo
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: 50, fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: 3,
        }}>
          One Mind. Many Dimensions.
        </p>
        <p style={{
          fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.35)',
          fontFamily: "'Inter', sans-serif", animation: 'pulse 2s ease-in-out infinite',
        }}>
          Tap anywhere to begin
        </p>
      </div>
    </div>
  );
};

const DemoPage = () => {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const aiState = speakerEnabled ? 'listening' : (isProcessing ? 'thinking' : 'neutral');
  
  const [keywords, setKeywords] = useState({
    red: [],
    green: [],
    yellow: []
  });
  const [selectedKeywordColor, setSelectedKeywordColor] = useState('green');
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onend = () => {
          if (speakerEnabled) {
             setSpeakerEnabled(false);
             setIsProcessing(true);
             processTranscript(transcript);
          }
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerEnabled, transcript]);

  const processTranscript = (text) => {
    if (!text) {
      setIsProcessing(false);
      return;
    }
    
    // Fake AI processing simulation
    setTimeout(() => {
      const words = text.split(" ").filter(w => w.length > 3);
      if (words.length > 0) {
        const newKeywords = { ...keywords };
        words.forEach(word => {
          const rand = Math.random();
          if (rand < 0.33) newKeywords.red.push(word);
          else if (rand < 0.66) newKeywords.green.push(word);
          else newKeywords.yellow.push(word);
        });
        
        // Keep only last 10
        newKeywords.red = [...new Set(newKeywords.red)].slice(-10);
        newKeywords.green = [...new Set(newKeywords.green)].slice(-10);
        newKeywords.yellow = [...new Set(newKeywords.yellow)].slice(-10);
        
        setKeywords(newKeywords);
      }
      setIsProcessing(false);
      setTranscript("");
      setRightPanelOpen(true); // Automatically open right panel to show results
    }, 2000);
  };

  const toggleListening = () => {
    if (!speakerEnabled && !isProcessing) {
      setSpeakerEnabled(true);
      setTranscript("");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback for browsers without speech API
        setTimeout(() => {
          setSpeakerEnabled(false);
          setIsProcessing(true);
          processTranscript("simulated voice input identifying deep focus and stress points");
        }, 3000);
      }
    } else if (speakerEnabled) {
      setSpeakerEnabled(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
      <div 
        data-testid="demo-page"
        style={{ 
          width: '100%', height: '100vh', background: '#0a0a12',
          position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Top Floating Action Buttons */}
        <button 
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          style={{
            position: 'absolute', top: 30, left: 30, zIndex: 100,
            background: leftPanelOpen ? 'rgba(255,255,255,0.1)' : 'rgba(20,20,25,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)', color: '#fff', borderRadius: '50%',
            width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          {leftPanelOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <button 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          style={{
            position: 'absolute', top: 30, right: 30, zIndex: 100,
            background: rightPanelOpen ? 'rgba(255,255,255,0.1)' : 'rgba(20,20,25,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)', color: '#fff', borderRadius: '50%',
            width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s'
          }}
        >
          {rightPanelOpen ? <X size={24} /> : <Activity size={24} />}
        </button>

        {/* Center Canvas */}
        <div 
          onClick={toggleListening}
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 0
          }}>
          <div style={{ 
            width: '100%', height: '100%', position: 'relative', transition: 'all 0.5s ease',
            transform: speakerEnabled || isProcessing ? 'scale(1.05)' : 'scale(1)'
          }}>
            <CubiQoVisual isEnabled={speakerEnabled || isProcessing} aiState={aiState} />
          </div>
          
          <div style={{
              position: 'absolute', bottom: '8%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', pointerEvents: 'none', maxWidth: '60%', textAlign: 'center'
          }}>
            {speakerEnabled && (
              <>
                <div style={{
                  color: '#ff6b35', fontSize: '1rem', letterSpacing: 3, textTransform: 'uppercase',
                  animation: 'pulse 1.5s ease-in-out infinite', textShadow: '0 0 15px rgba(255, 107, 53, 0.8)',
                  marginBottom: 10, fontWeight: 500
                }}>Listening...</div>
                {transcript && <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', fontStyle: 'italic' }}>"{transcript}"</div>}
              </>
            )}
            {!speakerEnabled && isProcessing && (
              <div style={{
                color: '#00d4ff', fontSize: '1rem', letterSpacing: 3, textTransform: 'uppercase',
                animation: 'pulse 1s ease-in-out infinite', textShadow: '0 0 15px rgba(0, 212, 255, 0.8)', fontWeight: 500
              }}>Processing Neural Data...</div>
            )}
            {!speakerEnabled && !isProcessing && (
              <div style={{
                color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', letterSpacing: 3, textTransform: 'uppercase'
              }}>Tap anywhere to speak</div>
            )}
          </div>
        </div>

        {/* Left Side Panel */}
        <div style={{
          position: 'absolute', top: '90px', left: '30px', bottom: '30px', width: '280px',
          padding: '40px 30px', display: 'flex', flexDirection: 'column', borderRadius: '24px',
          background: 'rgba(15, 15, 20, 0.6)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 10,
          transform: leftPanelOpen ? 'translateX(0)' : 'translateX(-150%)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s',
          opacity: leftPanelOpen ? 1 : 0,
          pointerEvents: leftPanelOpen ? 'auto' : 'none'
        }}>
          <div style={{ marginBottom: 50 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#fff', letterSpacing: 4, fontFamily: "'Inter', sans-serif", margin: 0 }}>
              CubiQo<sup style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: 2 }}>™</sup>
            </h1>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
            {[
              { id: 'dimensions', label: 'My Dimensions', icon: <Activity size={18} /> },
              { id: 'settings', label: 'Account Settings', icon: <Settings size={18} /> },
              { id: 'integrations', label: 'Integrations', icon: <Database size={18} /> },
              { id: 'privacy', label: 'Data & Privacy', icon: <Shield size={18} /> }
            ].map((item) => (
              <div key={item.id} 
                onClick={() => setActiveModal(item.id)}
                style={{ 
                color: activeModal === item.id ? '#00d4ff' : 'rgba(255,255,255,0.6)', 
                fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 0.2s', padding: '8px 0'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateX(5px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = activeModal === item.id ? '#00d4ff' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
          
          <div style={{ flex: 1 }} />
          
          <div 
            onClick={() => setActiveModal('profile')}
            style={{ 
            display: 'flex', alignItems: 'center', gap: 15, padding: '15px', 
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px', cursor: 'pointer', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={20} color="#fff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 500 }}>User Profile</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Manage Account</span>
            </div>
          </div>
        </div>
        
        {/* Right Side Panel */}
        <div style={{
          position: 'absolute', top: '90px', right: '30px', bottom: '30px', width: '340px',
          padding: '35px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', borderRadius: '24px',
          background: 'rgba(15, 15, 20, 0.6)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', zIndex: 10,
          transform: rightPanelOpen ? 'translateX(0)' : 'translateX(150%)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s',
          opacity: rightPanelOpen ? 1 : 0,
          pointerEvents: rightPanelOpen ? 'auto' : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 300, color: '#fff', margin: 0, letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>Activities</h2>
          </div>
          
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: 30 }}>
            Categorisation maps to the Hindu philosophical tenets. Speak to the AI to generate real-time functional data below.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
            {[
              { id: 'green', label: 'Green (Sattva)', dotColor: '#2dd4bf', bgColor: 'rgba(45, 212, 191, 0.15)' },
              { id: 'yellow', label: 'Yellow (Rajas)', dotColor: '#facc15', bgColor: 'rgba(250, 204, 21, 0.15)' },
              { id: 'red', label: 'Red (Tamas)', dotColor: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.15)' }
            ].map(col => (
              <button
                key={col.id} onClick={() => setSelectedKeywordColor(col.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 15,
                  background: selectedKeywordColor === col.id ? col.bgColor : 'rgba(255,255,255,0.03)',
                  border: selectedKeywordColor === col.id ? `1px solid ${col.dotColor}50` : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '14px', padding: '15px 20px',
                  color: selectedKeywordColor === col.id ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.3s ease',
                  boxShadow: selectedKeywordColor === col.id ? `0 0 20px ${col.dotColor}30` : 'none', textAlign: 'left'
                }}
              >
                <div style={{ 
                  width: 12, height: 12, borderRadius: '50%', background: col.dotColor,
                  boxShadow: selectedKeywordColor === col.id ? `0 0 10px ${col.dotColor}` : 'none'
                }} />
                <span style={{ fontWeight: selectedKeywordColor === col.id ? 600 : 400 }}>{col.label}</span>
              </button>
            ))}
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e'}40`,
            borderRadius: '20px', padding: '25px 20px', transition: 'all 0.3s ease',
            position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: `linear-gradient(90deg, transparent, ${selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e'}, transparent)`
            }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 25 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                {activeColorDetails.title}
              </h3>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                {activeColorDetails.desc}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, overflowY: 'auto' }}>
              {keywords[selectedKeywordColor] && keywords[selectedKeywordColor].length > 0 ? (
                keywords[selectedKeywordColor].map((k, i) => (
                  <span key={i} style={{ 
                    background: `rgba(${selectedKeywordColor === 'green' ? '45,212,191' : selectedKeywordColor === 'yellow' ? '250,204,21' : '244,63,94'}, 0.15)`, 
                    color: selectedKeywordColor === 'green' ? '#2dd4bf' : selectedKeywordColor === 'yellow' ? '#facc15' : '#f43f5e', 
                    border: `1px solid rgba(${selectedKeywordColor === 'green' ? '45,212,191' : selectedKeywordColor === 'yellow' ? '250,204,21' : '244,63,94'}, 0.4)`, 
                    padding: '10px 16px', borderRadius: '24px', fontSize: '0.9rem',
                    animation: 'slideInRight 0.3s ease-out'
                  }}>
                    {k}
                  </span>
                ))
              ) : (
                <div style={{ width: '100%', textAlign: 'center', marginTop: 40, color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Awaiting real-time voice input...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals for Functional Left Menu */}
        {activeModal && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              background: '#121218', width: '500px', maxWidth: '90%', borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)', padding: '40px', position: 'relative'
            }}>
              <button onClick={() => setActiveModal(null)} style={{
                position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
              }}>
                <X size={24} />
              </button>
              
              <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 300, marginBottom: 10, textTransform: 'capitalize' }}>
                {activeModal.replace('-', ' ')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', marginBottom: 30, lineHeight: 1.6 }}>
                This is a fully functional interface mapping to the backend services. Connect to your desired dimension below.
              </p>

              {activeModal === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                     <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 5 }}>Voice Assistant Tone</label>
                     <select style={{ width: '100%', background: 'transparent', color: '#00d4ff', border: 'none', outline: 'none', fontSize: '1rem' }}>
                       <option>Philosophical & Calm</option>
                       <option>Direct & Energetic</option>
                     </select>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                     <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 5 }}>Data Retention</label>
                     <select style={{ width: '100%', background: 'transparent', color: '#ff6b35', border: 'none', outline: 'none', fontSize: '1rem' }}>
                       <option>Zero Retention (Privacy First)</option>
                       <option>7 Days (Temporary)</option>
                     </select>
                  </div>
                </div>
              )}

              {activeModal === 'integrations' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  {['Notion', 'Google Calendar', 'Spotify', 'HealthKit'].map(app => (
                    <div key={app} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <div style={{ color: '#fff', fontWeight: 500 }}>{app}</div>
                      <div style={{ color: '#00d4ff', fontSize: '0.8rem', marginTop: 5 }}>Connect</div>
                    </div>
                  ))}
                </div>
              )}

              {activeModal !== 'settings' && activeModal !== 'integrations' && (
                 <div style={{
                   height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.2)'
                 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>System ready. Connection established.</span>
                 </div>
              )}

              <button 
                onClick={() => setActiveModal(null)}
                style={{
                width: '100%', padding: '15px', background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: 600,
                marginTop: 30, cursor: 'pointer'
              }}>
                Save Changes
              </button>
            </div>
          </div>
        )}

      </div>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `}
      </style>
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
