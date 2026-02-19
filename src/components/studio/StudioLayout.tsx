'use client';

import { useState } from 'react';
import ConversationPanel from './ConversationPanel';
import CodeEditor from './CodeEditor';
import TerminalPanel from './TerminalPanel';
import PreviewPanel from './PreviewPanel';
import FileExplorer from './FileExplorer';
import EditorTabs, { EditorTab } from './EditorTabs';

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

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const currentCode = fileContents.get(activeTabId) || '';

  const handleDeploy = async () => {
    if (isDeploying) return;
    
    setIsDeploying(true);
    try {
      const response = await fetch('/api/emergent/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'demo-project',
          environment: 'production',
          platform: 'vercel',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Deployment started! ID: ${data.deployment.id}\n${data.deployment.message}`);
      } else {
        alert('Deployment failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Deploy error:', error);
      alert('Failed to trigger deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-teal-400">CubiQo Studio</h1>
          <span className="text-sm text-gray-400">{activeTab?.name || 'No file open'}</span>
        </div>
        <button 
          onClick={handleDeploy}
          disabled={isDeploying}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Now'}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversation */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <ConversationPanel />
        </div>

        {/* Center Panel - Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Top - File Explorer + Code Editor */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className="w-64 border-r border-gray-700">
              <FileExplorer 
                onFileSelect={handleFileOpen}
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
                <CodeEditor 
                  value={currentCode}
                  onChange={handleCodeChange}
                  language={activeTab?.language || 'typescript'}
                  theme="vs-dark"
                />
              </div>
            </div>
          </div>

          {/* Bottom - Terminal */}
          <div className="h-64 border-t border-gray-700">
            <TerminalPanel />
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/3 border-l border-gray-700">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
