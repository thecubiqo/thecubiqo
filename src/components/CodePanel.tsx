'use client';

import { useState, useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodePanelProps {
  agentId?: string; // If provided, targets specific agent's workspace
  onClose?: () => void;
}

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
}

export default function CodePanel({ agentId, onClose }: CodePanelProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal'>('editor');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const editorRef = useRef<unknown>(null);

  // Initial load
  useEffect(() => {
    refreshFiles();
  }, [agentId]);

  const refreshFiles = async () => {
    setIsLoading(true);
    setStatus('Loading file system...');
    try {
      const res = await fetch('/api/code/file-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'list',
          path: '.',
          agentId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.data.files);
        setStatus('Files loaded');
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setStatus('Failed to connect to workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const openFile = async (path: string) => {
    setIsLoading(true);
    setStatus(`Reading ${path}...`);
    try {
      const res = await fetch('/api/code/file-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'read',
          path,
          agentId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFileContent(data.data.content);
        setCurrentFile(path);
        setStatus('File loaded');
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setStatus('Failed to read file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor;
  };

  const saveFile = async () => {
    if (!currentFile) return;
    setIsLoading(true);
    setStatus('Saving...');
    try {
      const res = await fetch('/api/code/file-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'write',
          path: currentFile,
          content: fileContent,
          agentId
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Saved');
        refreshFiles(); // Refresh in case it was a new file
      } else {
        setStatus(`Save failed: ${data.error}`);
      }
    } catch (e) {
      setStatus('Save error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('Revert all uncommitted changes in the workspace?')) return;
    setIsLoading(true);
    setStatus('Rolling back...');
    try {
      if (!agentId) return; // Only for agents
      const res = await fetch('/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'bash',
          code: 'git clean -fd && git checkout .',
          agentId
        }),
      });
      const data = await res.json();
      if (res.ok && data.exitCode === 0) {
        setStatus('Rollback complete');
        refreshFiles();
        if (currentFile) openFile(currentFile);
      } else {
        setStatus(`Rollback failed: ${data.stderr || data.error}`);
      }
    } catch (e) {
      setStatus('Rollback error');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine language based on file extension
  const getLanguage = (filename: string) => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-sans text-sm border-l border-[#333]">
      {/* Header */}
      <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">⚡</span>
          <span className="font-medium text-gray-200 text-xs uppercase tracking-wider">
            {agentId ? `Dev Workspace (${agentId})` : 'Local Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshFiles}
            className="p-1 hover:bg-[#3d3d3d] rounded text-gray-400 hover:text-white transition-colors"
            title="Refresh Files"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleRollback}
            className="p-1 hover:bg-[#3d3d3d] rounded text-red-400 hover:text-red-300 ml-1 transition-colors"
            title="Rollback Changes (Git)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#3d3d3d] p-1 rounded transition-colors ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <div className="w-56 bg-[#252526] flex flex-col border-r border-[#333]">
          <div className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-4">Explorer</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => file.type === 'file' && openFile(file.name)}
                className={`px-4 py-1.5 cursor-pointer flex items-center gap-2.5 text-xs transition-colors border-l-2 ${(currentFile === file.name || currentFile?.endsWith('/' + file.name))
                  ? 'bg-[#37373d] text-white border-blue-400'
                  : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-300 border-transparent'
                  }`}
              >
                <span className={file.type === 'directory' ? 'text-yellow-400' : 'text-blue-400'}>
                  {file.type === 'directory' ? '📂' : '📄'}
                </span>
                <span className="truncate">{file.name}</span>
              </div>
            ))}
            {files.length === 0 && !isLoading && (
              <div className="p-4 text-gray-600 italic text-xs text-center mt-10">
                Workspace empty
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Editor */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          {/* Tabs */}
          <div className="flex h-9 bg-[#2d2d2d] border-b border-[#333]">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 flex items-center gap-2 text-xs border-r border-[#333] transition-colors ${activeTab === 'editor'
                ? 'bg-[#1e1e1e] text-orange-300 border-t-2 border-t-orange-400'
                : 'text-gray-500 hover:bg-[#2a2d2e]'
                }`}
            >
              <span className="text-blue-400 text-xs">TS</span>
              {currentFile ? currentFile.split('/').pop() : 'Untitled'}
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            {activeTab === 'editor' && (
              <div className="absolute inset-0 pt-2">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  language={currentFile ? getLanguage(currentFile) : 'typescript'}
                  value={fileContent}
                  theme="vs-dark"
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16 },
                    lineNumbers: 'on',
                    renderWhitespace: 'none',
                  }}
                />
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-[11px] justify-between font-medium">
            <div className="flex items-center gap-3">
              <span>{status}</span>
              {isLoading && <span className="animate-pulse">...</span>}
            </div>
            <div className="flex gap-4">
              <button
                onClick={saveFile}
                disabled={!currentFile}
                className="hover:bg-white/20 px-2 rounded disabled:opacity-50 transition-colors"
                title="Ctrl+S"
              >
                Save
              </button>
              <span>UTF-8</span>
              <span>{agentId ? 'REMOTE' : 'LOCAL'}</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
