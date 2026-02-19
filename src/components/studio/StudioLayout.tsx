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

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-teal-400">CubiQo Studio</h1>
          <span className="text-sm text-gray-400">{currentFile}</span>
        </div>
        <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-md font-medium transition-colors">
          Deploy Now
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
