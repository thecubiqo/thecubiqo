'use client';

import { useState } from 'react';
import { FileNode } from '@/types/files';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (path: string, type: 'file' | 'directory') => void;
  selectedFile: string | null;
  level?: number;
}

export function FileTree({ files, onFileSelect, selectedFile, level = 0 }: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (name: string, type: 'file' | 'directory') => {
    if (type === 'directory') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }

    const ext = name.split('.').pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      js: 'text-yellow-400',
      jsx: 'text-yellow-400',
      ts: 'text-blue-400',
      tsx: 'text-blue-400',
      json: 'text-yellow-500',
      md: 'text-blue-300',
      css: 'text-pink-400',
      scss: 'text-pink-500',
      html: 'text-orange-400',
      py: 'text-blue-500',
      sh: 'text-green-400',
    };

    return (
      <svg
        className={`w-4 h-4 ${colorMap[ext || ''] || 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="text-sm">
      {files.map((file) => {
        const isExpanded = expandedDirs.has(file.path);
        const isSelected = selectedFile === file.path;

        return (
          <div key={file.path}>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-800 transition-colors ${
                isSelected ? 'bg-gray-800 text-white' : 'text-gray-300'
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => {
                if (file.type === 'directory') {
                  toggleDirectory(file.path);
                  onFileSelect(file.path, file.type);
                } else {
                  onFileSelect(file.path, file.type);
                }
              }}
            >
              {file.type === 'directory' && (
                <svg
                  className={`w-3 h-3 text-gray-500 transition-transform ${
                    isExpanded ? 'transform rotate-90' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {getFileIcon(file.name, file.type)}
              <span className="flex-1 truncate">{file.name}</span>
              {file.size !== undefined && (
                <span className="text-xs text-gray-500">{formatSize(file.size)}</span>
              )}
            </div>

            {file.type === 'directory' && isExpanded && file.children && (
              <FileTree
                files={file.children}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
