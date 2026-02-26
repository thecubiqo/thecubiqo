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
    <div className="flex bg-black/40 border-b border-white/10 overflow-x-auto custom-scrollbar backdrop-blur-xl shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        return (
          <div
            key={tab.id}
            className={`
              flex items-center gap-3 px-6 py-3 min-w-[120px] cursor-pointer
              border-r border-white/5 transition-all relative group
              ${isActive ? 'bg-cyan-500/5' : 'hover:bg-white/5'}
            `}
            onClick={() => onTabChange(tab.id)}
          >
            {/* File icon based on language */}
            <span className="text-[10px] flex-shrink-0 grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">
              {getFileIcon(tab.language || getLanguageFromPath(tab.path))}
            </span>

            {/* File name */}
            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`}>
              {tab.name}
            </span>

            {/* Active Indicator Line */}
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-400 shadow-[0_0_10px_cyan]" />
            )}

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="text-cyan-400 font-bold flex-shrink-0 animate-pulse text-[10px]">●</span>
            )}

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className={`
                p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0 transition-all
                ${isActive ? 'text-white/40' : 'text-white/10'}
                hover:text-red-400
              `}
              aria-label={`Close ${tab.name}`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* Empty state */}
      {tabs.length === 0 && (
        <div className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/20 italic">
          Awaiting_Mount_Request...
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
