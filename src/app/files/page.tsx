'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/AppLayout';
import { FileTree } from '@/components/files/FileTree';
import { FileNode } from '@/types/files';

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@/components/files/MonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  ),
});

export default function FilesPage() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async (path: string = '') => {
    try {
      const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.data);
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    }
  };

  const handleFileSelect = async (path: string, type: 'file' | 'directory') => {
    if (type === 'directory') {
      // Expand/collapse directory
      loadFileTree(path);
      return;
    }

    setSelectedFile(path);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);
      const data = await response.json();

      if (data.success) {
        setFileContent(data.data.content);
      } else {
        setError(data.error || 'Failed to read file');
        setFileContent('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setFileContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      css: 'css',
      scss: 'scss',
      html: 'html',
      xml: 'xml',
      py: 'python',
      sh: 'shell',
      bash: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
      sql: 'sql',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      php: 'php',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <AppLayout>
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4">
        <h1 className="text-xl font-semibold text-white">File Browser</h1>
        {selectedFile && (
          <span className="ml-4 text-sm text-gray-400">
            {selectedFile}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-80 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <FileTree
            files={files}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col">
          {error && (
            <div className="bg-red-900/20 border-b border-red-800 px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-gray-400">Loading file...</div>
            </div>
          ) : selectedFile ? (
            <MonacoEditor
              value={fileContent}
              language={getLanguageFromPath(selectedFile)}
              onChange={handleContentChange}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg">Select a file to view</p>
                <p className="text-sm mt-2 text-gray-600">
                  Choose a file from the tree to open it in the editor
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
