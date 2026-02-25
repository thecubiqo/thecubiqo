'use client';

import { useState, useEffect } from 'react';
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

  const [showAnalytics, setShowAnalytics] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S — Save current file
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTabId && openTabs.length > 0) {
          setOpenTabs(prev => prev.map(tab =>
            tab.id === activeTabId ? { ...tab, isDirty: false } : tab
          ));
          setToast({ message: `Saved ${activeTab?.name || 'file'}`, type: 'success' });
        }
      }
      // Ctrl+N / Cmd+N — New file
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const name = prompt('New file name (e.g. components/Header.tsx):');
        if (name?.trim()) {
          handleFileOpen(name.trim());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, openTabs, activeTab]);

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
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-sm">
              C
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              CubiQo Studio
            </h1>
          </div>
          <div className="h-6 w-px bg-gray-700"></div>
          <span className="text-sm text-gray-400">{activeTab?.name || 'No file open'}</span>
        </div>
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-teal-500/50"
        >
          {isDeploying ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deploying...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Deploy Now
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversation */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <ConversationPanel onCodeGenerated={handleCodeFromAI} />
        </div>

        {/* Center Panel - Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Top - File Explorer + Code Editor */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className="w-64 border-r border-gray-700">
              <FileExplorer
                onFileSelect={handleFileOpen}
                currentFile={activeTab?.path || ''}
              />
            </div>

            {/* Code Editor with Tabs */}
            <div className="flex-1 flex flex-col">
              {/* Editor Tabs */}
              <EditorTabs
                tabs={openTabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
                onTabClose={handleTabClose}
              />

              {/* Code Editor */}
              <div className="flex-1">
                {openTabs.length === 0 ? (
                  <EmptyState
                    icon="📝"
                    title="No files open"
                    description="Select a file from the explorer or start a conversation with AI to generate code"
                    action={{
                      label: "Start Conversation",
                      onClick: () => {
                        // Focus on conversation panel
                        document.querySelector<HTMLTextAreaElement>('textarea')?.focus();
                      }
                    }}
                  />
                ) : (
                  <CodeEditor
                    value={currentCode}
                    onChange={handleCodeChange}
                    language={activeTab?.language || 'typescript'}
                    theme="vs-dark"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom - Terminal */}
          <div className="h-64 border-t border-gray-700">
            <TerminalPanel />
          </div>
        </div>

        {/* Right Panel - Preview / Analytics */}
        <div className="w-1/3 border-l border-gray-700 flex flex-col">
          <div className="flex border-b border-gray-700 shrink-0">
            <button
              onClick={() => setShowAnalytics(false)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                !showAnalytics ? 'bg-gray-800 text-white border-b-2 border-teal-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                showAnalytics ? 'bg-gray-800 text-white border-b-2 border-teal-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Analytics
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {showAnalytics ? <AnalyticsPanel /> : <PreviewPanel code={currentCode} language={activeTab?.language} />}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar language={activeTab?.language || 'typescript'} />
    </div>
  );
}
