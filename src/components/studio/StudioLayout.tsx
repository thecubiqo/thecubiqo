'use client';

import { useState } from 'react';
import ConversationPanel from './ConversationPanel';
import CodeEditor from './CodeEditor';
import TerminalPanel from './TerminalPanel';
import PreviewPanel from './PreviewPanel';
import FileExplorer from './FileExplorer';

export default function StudioLayout() {
  const [currentFile, setCurrentFile] = useState<string>('app/page.tsx');
  const [fileContent, setFileContent] = useState<string>('// Welcome to CubiQo Studio\n// Start building with AI\n\nexport default function Home() {\n  return (\n    <div>\n      <h1>Hello from Studio!</h1>\n    </div>\n  );\n}');
  const [isDeploying, setIsDeploying] = useState(false);

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
          <span className="text-sm text-gray-400">{currentFile}</span>
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
                onFileSelect={(file) => setCurrentFile(file)}
                currentFile={currentFile}
              />
            </div>

            {/* Code Editor */}
            <div className="flex-1">
              <CodeEditor 
                value={fileContent}
                onChange={setFileContent}
                language="typescript"
                theme="vs-dark"
              />
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
