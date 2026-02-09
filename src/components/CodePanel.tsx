'use client';

import { useState, useEffect } from 'react';

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

  // Safe save function (optional, if user wants to intervene)
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

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm border-l border-[#333]">
      {/* Header */}
      <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span className="font-semibold text-gray-200">
            {agentId ? `Dev Workspace (${agentId})` : 'Local Workspace'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshFiles}
            className="p-1 hover:bg-[#3d3d3d] rounded text-gray-400 hover:text-white"
            title="Refresh Files"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleRollback}
            className="p-1 hover:bg-[#3d3d3d] rounded text-red-400 hover:text-red-300 ml-1"
            title="Rollback Changes (Git)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Tree */}
        <div className="w-48 bg-[#252526] flex flex-col border-r border-[#333]">
          <div className="p-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Explorer</div>
          <div className="flex-1 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.name}
                onClick={() => file.type === 'file' && openFile(file.name)}
                className={`px-3 py-1 cursor-pointer flex items-center gap-2 hover:bg-[#2a2d2e] ${currentFile === file.name || currentFile?.endsWith('/' + file.name)
                  ? 'bg-[#37373d] text-white'
                  : 'text-gray-400'
                  }`}
              >
                <span className={file.type === 'directory' ? 'text-yellow-400' : 'text-blue-400'}>
                  {file.type === 'directory' ? '📁' : '📄'}
                </span>
                <span className="truncate">{file.name}</span>
              </div>
            ))}
            {files.length === 0 && !isLoading && (
              <div className="p-4 text-gray-500 italic text-xs text-center">
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
              className={`px-4 flex items-center gap-2 text-xs border-r border-[#333] ${activeTab === 'editor' ? 'bg-[#1e1e1e] text-white' : 'text-gray-500 hover:bg-[#2a2d2e]'
                }`}
            >
              {currentFile ? currentFile.split('/').pop() : 'Untitled'}
            </button>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            {activeTab === 'editor' && (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
                placeholder="// Select a file to view content..."
              />
            )}
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between">
            <span>{status}</span>
            <div className="flex gap-4">
              <button
                onClick={saveFile}
                disabled={!currentFile}
                className="hover:bg-white/10 px-2 rounded disabled:opacity-50"
              >
                Save
              </button>
              <span>UTF-8</span>
              <span>{agentId ? 'REMOTE' : 'LOCAL'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
