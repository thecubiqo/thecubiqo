'use client';

import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import ConversationPanel from './ConversationPanel';
import CodeEditor from './CodeEditor';
import TerminalPanel from './TerminalPanel';
import PreviewPanel from './PreviewPanel';
import FileExplorer from './FileExplorer';
import EditorTabs, { EditorTab } from './EditorTabs';
import StatusBar from './StatusBar';
import EmptyState from './EmptyState';
import Toast, { ToastType } from './Toast';
import AnalyticsPanel from './AnalyticsPanel';
import GrowthPanel from './GrowthPanel';
import { BiometricWatcher } from './BiometricWatcher';
import { PlasmaWaveField } from '../cube/PlasmaWaveField';
import { Zap, Activity, Monitor, Shield, Cpu, Eye, EyeOff, Scan } from 'lucide-react';
import { useMultimodalAI } from '../../hooks/useMultimodalAI';

export default function StudioLayout() {
  // Multi-file tab management
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([
    {
      id: '1',
      path: 'app/page.tsx',
      name: 'page.tsx',
      isDirty: false,
      language: 'tsx',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');

  const [fileContents, setFileContents] = useState<Map<string, string>>(
    new Map([
      ['1', '// Welcome to CubiQo Studio\n// Start building with AI\n\nexport default function Home() {\n  return (\n    <div>\n      <h1>Hello from Studio!</h1>\n    </div>\n  );\n}'],
    ])
  );

  const [isDeploying, setIsDeploying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm(`${tab.name} has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);

    // Remove file content
    const newContents = new Map(fileContents);
    newContents.delete(tabId);
    setFileContents(newContents);

    // Switch to another tab if this was active
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const handleFileOpen = (path: string) => {
    // Check if file is already open
    const existingTab = openTabs.find(t => t.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Create new tab
    const newTab: EditorTab = {
      id: Date.now().toString(),
      path,
      name: path.split('/').pop() || path,
      isDirty: false,
    };

    setOpenTabs([...openTabs, newTab]);
    setActiveTabId(newTab.id);

    // Load file content (mock for now)
    const newContents = new Map(fileContents);
    newContents.set(newTab.id, `// File: ${path}\n// Content loaded...`);
    setFileContents(newContents);
  };

  const handleCodeChange = (newCode: string) => {
    const newContents = new Map(fileContents);
    newContents.set(activeTabId, newCode);
    setFileContents(newContents);

    // Mark tab as dirty
    setOpenTabs(openTabs.map(tab =>
      tab.id === activeTabId ? { ...tab, isDirty: true } : tab
    ));
  };

  const handleCodeFromAI = (code: string, language: string) => {
    // If there's an active tab, replace its content
    if (activeTabId && openTabs.length > 0) {
      const newContents = new Map(fileContents);
      newContents.set(activeTabId, code);
      setFileContents(newContents);
      setOpenTabs(openTabs.map(tab =>
        tab.id === activeTabId ? { ...tab, isDirty: true, language: language === 'tsx' || language === 'typescript' ? 'tsx' : language } : tab
      ));
      setToast({ message: 'Code applied to editor from AI', type: 'success' });
    } else {
      // Create a new tab with the AI-generated code
      const ext = language === 'typescript' || language === 'tsx' ? 'tsx' : language === 'javascript' || language === 'jsx' ? 'jsx' : language || 'tsx';
      const newTab: EditorTab = {
        id: Date.now().toString(),
        path: `ai-generated.${ext}`,
        name: `ai-generated.${ext}`,
        isDirty: true,
        language: ext,
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      const newContents = new Map(fileContents);
      newContents.set(newTab.id, code);
      setFileContents(newContents);
      setToast({ message: 'AI-generated code opened in new tab', type: 'success' });
    }
  };

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const currentCode = fileContents.get(activeTabId) || '';

  const [rightPanel, setRightPanel] = useState<'preview' | 'analytics' | 'growth'>('preview');
  const [isEmergentMode, setIsEmergentMode] = useState(true);
  const [isWatching, setIsWatching] = useState(false);

  // Multimodal AI for facial tracking
  const { context: aiContext, initialize: initAI, stop: stopAI } = useMultimodalAI({
    enableVision: true,
    autoStart: false
  });

  const toggleWatch = async () => {
    if (!isWatching) {
      await initAI();
      setIsWatching(true);
    } else {
      stopAI();
      setIsWatching(false);
    }
  };

  // Extract face position for the watcher
  const facePos = (isWatching && aiContext?.vision?.faces && aiContext.vision.faces.length > 0)
    ? {
      x: (aiContext.vision.faces[0].bbox.x + aiContext.vision.faces[0].bbox.width / 2 - 0.5) * 2,
      y: -(aiContext.vision.faces[0].bbox.y + aiContext.vision.faces[0].bbox.height / 2 - 0.5) * 2
    }
    : { x: 0, y: 0 };

  const handleDeploy = async () => {
    if (isDeploying) return;

    setIsDeploying(true);
    const timestamp = new Date().toLocaleString();
    try {
      const response = await fetch('/api/emergent/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeTab?.path || 'demo-project',
          environment: 'production',
          platform: 'vercel',
        }),
      });

      const data = await response.json();

      // Track in analytics
      const analytics = (window as any).__cubiqoAnalytics;
      if (analytics?.addDeployment) {
        analytics.addDeployment({
          id: data.deployment?.id || `deploy-${Date.now()}`,
          projectId: activeTab?.path || 'demo-project',
          environment: 'production',
          platform: 'vercel',
          status: data.success ? 'queued' : 'failed',
          url: data.deployment?.url || null,
          message: data.deployment?.message || data.error || 'Deployment triggered',
          timestamp,
        });
      }

      if (data.success) {
        setToast({
          message: `Deployment started! ID: ${data.deployment.id}`,
          type: 'success',
        });
      } else {
        setToast({
          message: 'Deployment failed: ' + (data.error || 'Unknown error'),
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Deploy error:', error);
      setToast({
        message: 'Failed to trigger deployment',
        type: 'error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white relative font-mono">
      {/* 1. LAYER ZERO: PLASMA WAVE BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <PlasmaWaveField isEnabled={isEmergentMode} aiState="neutral" />
            <BiometricWatcher
              isActive={isWatching}
              facePosition={facePos}
              engagement={aiContext?.userState?.engagement || 'medium'}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* 2. LAYER ONE: HUD SCANLINES & OVERLAYS */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 4px, 4px 100%'
      }}></div>

      {/* Toast Notifications */}
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header HUD */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleWatch}
            className={`p-3 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${isWatching ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_20px_rgba(255,165,0,0.3)]' : 'bg-white/5 border-white/10 text-white/20 hover:border-white/30'}`}
            title={isWatching ? 'Disable Biometric Uplink' : 'Enable Biometric Uplink'}
          >
            <div className={`absolute inset-0 bg-orange-500/5 ${isWatching ? 'animate-pulse' : ''}`} />
            {isWatching ? <Eye className="w-5 h-5 relative z-10" /> : <EyeOff className="w-5 h-5 relative z-10" />}

            {/* HUD Scanline effect on button */}
            {isWatching && <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-400/50 animate-scan z-20" />}
          </button>

          <div className="flex items-center gap-6 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isEmergentMode ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-gray-800'} rounded-xl flex items-center justify-center border border-cyan-400/30`}>
                <Zap className={`w-6 h-6 ${isEmergentMode ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent uppercase">
                  CubiQo <span className="text-white/20">//</span> Emergent
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest">System Secure</span>
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-ping" />
                </div>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10"></div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Active File</span>
                <span className="text-xs font-bold text-cyan-200">{activeTab?.name || 'idle_kernel.log'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEmergentMode(!isEmergentMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isEmergentMode ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            <Monitor className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{isEmergentMode ? 'Emergent Mode Active' : 'Standard View'}</span>
          </button>

          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="group relative overflow-hidden px-8 py-3 bg-white text-black font-black uppercase tracking-tighter rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              {isDeploying ? 'Syncing...' : 'Deploy System'}
            </span>
          </button>
        </div>
      </header>

      {/* Main HUD Interaction Space */}
      <div className="relative z-20 h-full w-full pt-24 pb-8 px-4 flex gap-4 pointer-events-none">
        {/* Left Module - Brain / Conversation */}
        <div className="w-[400px] pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-cyan-500/30">
          <ConversationPanel onCodeGenerated={handleCodeFromAI} />
        </div>

        {/* Center Module - Core / Editor */}
        <div className="flex-1 flex flex-col gap-4 pointer-events-none">
          {/* Top - Editor & Explorer */}
          <div className="flex-1 flex gap-4 pointer-events-none">
            {/* File Explorer Module */}
            <div className="w-64 pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:border-purple-500/30">
              <FileExplorer
                onFileSelect={handleFileOpen}
                currentFile={activeTab?.path || ''}
              />
            </div>

            {/* Code Editor Module */}
            <div className="flex-1 pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-cyan-500/20">
              <EditorTabs
                tabs={openTabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
                onTabClose={handleTabClose}
              />
              <div className="flex-1">
                {openTabs.length === 0 ? (
                  <EmptyState
                    icon="⚡"
                    title="System Idle"
                    description="Awaiting instruction. Interface with the AI to mount code modules."
                    action={{
                      label: "Start Uplink",
                      onClick: () => document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
                    }}
                  />
                ) : (
                  <div className="h-full relative opa-80">
                    <CodeEditor
                      value={currentCode}
                      onChange={handleCodeChange}
                      language={activeTab?.language || 'typescript'}
                      theme="vs-dark"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Module - Output / Terminal */}
          <div className="h-64 pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-xl transition-all duration-500 hover:border-cyan-500/30">
            <TerminalPanel />
          </div>
        </div>

        {/* Right Module - Intelligence / Growth */}
        <div className="w-[450px] pointer-events-auto bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-500 hover:border-purple-500/30">
          <div className="flex bg-white/5 border-b border-white/10 shrink-0">
            <button
              onClick={() => setRightPanel('preview')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${rightPanel === 'preview' ? 'text-cyan-400 bg-cyan-500/5' : 'text-white/40 hover:text-white'}`}
            >
              <Activity className="w-3 h-3" /> Preview
              {rightPanel === 'preview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_cyan]" />}
            </button>
            <button
              onClick={() => setRightPanel('growth')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${rightPanel === 'growth' ? 'text-purple-400 bg-purple-500/5' : 'text-white/40 hover:text-white'}`}
            >
              <Zap className="w-3 h-3" /> Growth
              {rightPanel === 'growth' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-400 shadow-[0_0_10px_purple]" />}
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            {rightPanel === 'growth' ? <GrowthPanel /> :
              rightPanel === 'analytics' ? <AnalyticsPanel /> :
                <PreviewPanel code={currentCode} language={activeTab?.language} />}
          </div>
        </div>
      </div>

      {/* Floating Status Bar HUD */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-2 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-1.5 rounded-full pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-400/80 uppercase font-bold">Heuristic Load: 38%</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400/80 uppercase font-bold">Tunnel Stable</span>
            </div>
          </div>
          <StatusBar />
        </div>
      </div>
    </div>
  );
}
