'use client';

import { X } from 'lucide-react';

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  isDirty: boolean;
  language?: string;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
}: EditorTabsProps) {
  return (
    <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        
        return (
          <div
            key={tab.id}
            className={`
              flex items-center gap-2 px-4 py-2 min-w-0 cursor-pointer
              border-r border-gray-700 hover:bg-gray-700 transition-colors
              ${isActive ? 'bg-gray-900 border-b-2 border-teal-500' : 'bg-gray-800'}
            `}
            onClick={() => onTabChange(tab.id)}
          >
            {/* File icon based on language */}
            <span className="text-sm flex-shrink-0">
              {getFileIcon(tab.language || getLanguageFromPath(tab.path))}
            </span>
            
            {/* File name */}
            <span className={`text-sm truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
              {tab.name}
            </span>
            
            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="text-teal-400 font-bold flex-shrink-0">●</span>
            )}
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`
                p-1 rounded hover:bg-gray-600 flex-shrink-0 transition-colors
                ${isActive ? 'text-gray-300' : 'text-gray-500'}
                hover:text-white
              `}
              aria-label={`Close ${tab.name}`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      
      {/* Empty state */}
      {tabs.length === 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          No files open
        </div>
      )}
    </div>
  );
}

/**
 * Get file icon based on language/extension
 */
function getFileIcon(language: string): string {
  const iconMap: Record<string, string> = {
    typescript: '📘',
    javascript: '📙',
    tsx: '⚛️',
    jsx: '⚛️',
    python: '🐍',
    go: '🔷',
    rust: '🦀',
    php: '🐘',
    ruby: '💎',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    json: '📋',
    markdown: '📝',
    yaml: '⚙️',
    xml: '📄',
    sql: '🗄️',
    bash: '🐚',
    shell: '🐚',
  };
  
  return iconMap[language.toLowerCase()] || '📄';
}

/**
 * Determine language from file path
 */
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  const extMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'bash',
  };
  
  return extMap[ext || ''] || 'plaintext';
}
