'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Eye,
  Plug,
  BarChart2,
  FolderOpen,
  Terminal as TerminalIcon,
  ChevronRight,
  Upload as UploadIcon,
} from 'lucide-react';
import ConversationPanel from './ConversationPanel';
import CodeEditor from './CodeEditor';
import FileExplorer from './FileExplorer';
import EditorTabs, { EditorTab } from './EditorTabs';
import StatusBar from './StatusBar';
import TerminalPanel from './TerminalPanel';
import PreviewPanel from './PreviewPanel';
import AnalyticsPanel from './AnalyticsPanel';
import Toast, { ToastType } from './Toast';
import EmptyState from './EmptyState';
import EcommerceIntegrationsPanel from './EcommerceIntegrationsPanel';

/* ─── Sidebar tab definitions ─────────────────────────────── */
type SidebarTab = 'build' | 'preview' | 'integrations' | 'analytics' | 'files' | 'terminal';

interface TabDef {
  id: SidebarTab;
  label: string;
  icon: React.ReactNode;
}

const SIDEBAR_TABS: TabDef[] = [
  { id: 'build',        label: 'Build',        icon: <MessageSquare size={18} /> },
  { id: 'preview',      label: 'Preview',      icon: <Eye size={18} /> },
  { id: 'integrations', label: 'Integrations', icon: <Plug size={18} /> },
  { id: 'analytics',    label: 'Analytics',    icon: <BarChart2 size={18} /> },
  { id: 'files',        label: 'Files',        icon: <FolderOpen size={18} /> },
  { id: 'terminal',     label: 'Terminal',     icon: <TerminalIcon size={18} /> },
];

/* ─── Main Component ─────────────────────────────────────── */
export default function StudioLayout() {
  /* ── Workspace ID (stable per session) ──── */
  const workspaceId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('studio-workspace-id') ??
        (() => {
          const id = `ws-${Date.now()}`;
          sessionStorage.setItem('studio-workspace-id', id);
          return id;
        })()
      : 'studio-default';

  /* ── File / tab state ─────────────────── */
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [fileExplorerKey, setFileExplorerKey] = useState(0);

  /* ── UI state ─────────────────────────── */
  const [activeTab, setActiveTab] = useState<SidebarTab>('build');
  const [isDeploying, setIsDeploying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  /* ── Tab helpers ──────────────────────── */
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string) => {
    const tab = openTabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      if (!confirm(`${tab.name} has unsaved changes. Close anyway?`)) return;
    }
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    const newContents = new Map(fileContents);
    newContents.delete(tabId);
    setFileContents(newContents);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[0].id : '');
    }
  };

  const handleFileOpen = (path: string) => {
    const existing = openTabs.find(t => t.path === path);
    if (existing) {
      setActiveTabId(existing.id);
      setActiveTab('build');
      return;
    }
    const newTab: EditorTab = {
      id: Date.now().toString(),
      path,
      name: path.split('/').pop() || path,
      isDirty: false,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setActiveTab('build');
    setFileContents(prev => new Map(prev).set(newTab.id, `// File: ${path}\n`));
  };

  const handleCodeChange = (newCode: string) => {
    setFileContents(prev => new Map(prev).set(activeTabId, newCode));
    setOpenTabs(prev =>
      prev.map(tab => (tab.id === activeTabId ? { ...tab, isDirty: true } : tab))
    );
  };

  const handleCodeFromAI = (code: string, language: string) => {
    if (activeTabId && openTabs.length > 0) {
      setFileContents(prev => new Map(prev).set(activeTabId, code));
      setOpenTabs(prev =>
        prev.map(tab =>
          tab.id === activeTabId
            ? {
                ...tab,
                isDirty: true,
                language:
                  language === 'tsx' || language === 'typescript' ? 'tsx' : language,
              }
            : tab
        )
      );
      setToast({ message: 'Code applied to editor from AI', type: 'success' });
    } else {
      const ext =
        language === 'typescript' || language === 'tsx'
          ? 'tsx'
          : language === 'javascript' || language === 'jsx'
          ? 'jsx'
          : language || 'tsx';
      const newTab: EditorTab = {
        id: Date.now().toString(),
        path: `ai-generated.${ext}`,
        name: `ai-generated.${ext}`,
        isDirty: true,
        language: ext,
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setFileContents(prev => new Map(prev).set(newTab.id, code));
      setToast({ message: 'AI-generated code opened in new tab', type: 'success' });
    }
  };

  /* ── Keyboard shortcuts ───────────────── */
  const activeEditorTab = openTabs.find(t => t.id === activeTabId);
  const currentCode = fileContents.get(activeTabId) || '';

  // "Latest ref" pattern: keep a ref up-to-date with the latest state so the
  // keyboard handler (registered once) always reads current values without
  // needing to be re-registered on every render.
  const keyboardStateRef = useRef({ activeTabId, openTabs, activeEditorTab, handleFileOpen });
  useEffect(() => {
    keyboardStateRef.current = { activeTabId, openTabs, activeEditorTab, handleFileOpen };
  }, [activeTabId, openTabs, activeEditorTab, handleFileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { activeTabId: tabId, openTabs: tabs, activeEditorTab: editorTab, handleFileOpen: openFile } =
        keyboardStateRef.current;

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (tabId && tabs.length > 0) {
          setOpenTabs(prev =>
            prev.map(tab => (tab.id === tabId ? { ...tab, isDirty: false } : tab))
          );
          setToast({ message: `Saved ${editorTab?.name || 'file'}`, type: 'success' });
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const name = prompt('New file name (e.g. components/Header.tsx):');
        if (name?.trim()) openFile(name.trim());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Deploy ───────────────────────────── */
  type DeployResponse = {
    success?: boolean;
    deployment?: { id?: string; url?: string; message?: string };
    error?: string;
  };

  function getCubiqoAnalytics(): { addDeployment?: (d: unknown) => void } | undefined {
    return (window as Record<string, unknown>)
      .__cubiqoAnalytics as { addDeployment?: (d: unknown) => void } | undefined;
  }

  const handleDeploy = async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    const timestamp = new Date().toLocaleString();
    try {
      const response = await fetch('/api/emergent/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeEditorTab?.path || 'demo-project',
          environment: 'production',
          platform: 'vercel',
        }),
      });
      const data = (await response.json()) as DeployResponse;

      getCubiqoAnalytics()?.addDeployment?.({
        id: data.deployment?.id || `deploy-${Date.now()}`,
        projectId: activeEditorTab?.path || 'demo-project',
        environment: 'production',
        platform: 'vercel',
        status: data.success ? 'queued' : 'failed',
        url: data.deployment?.url,
        message: data.deployment?.message ?? data.error ?? 'Deployment triggered',
        timestamp,
      });

      if (data.success) {
        setToast({ message: `Deployment started! ID: ${data.deployment?.id}`, type: 'success' });
      } else {
        setToast({ message: 'Deployment failed: ' + (data.error || 'Unknown error'), type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to trigger deployment', type: 'error' });
    } finally {
      setIsDeploying(false);
    }
  };

  /* ── Main content per tab ─────────────── */
  const renderMainContent = () => {
    switch (activeTab) {
      case 'build':
        return (
          <div className="flex h-full overflow-hidden">
            {/* AI Conversation */}
            <div className="w-[340px] shrink-0 border-r border-gray-800 flex flex-col overflow-hidden">
              <ConversationPanel
                onCodeGenerated={handleCodeFromAI}
                onFilesWritten={() => setFileExplorerKey(k => k + 1)}
                workspaceId={workspaceId}
              />
            </div>

            {/* Editor area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File explorer strip */}
              <div className="h-48 shrink-0 border-b border-gray-800 overflow-hidden">
                <FileExplorer
                  key={fileExplorerKey}
                  onFileSelect={handleFileOpen}
                  currentFile={activeEditorTab?.path || ''}
                  workspaceId={workspaceId}
                />
              </div>

              {/* Editor tabs + code editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <EditorTabs
                  tabs={openTabs}
                  activeTabId={activeTabId}
                  onTabChange={handleTabChange}
                  onTabClose={handleTabClose}
                />
                <div className="flex-1 relative overflow-hidden">
                  {openTabs.length === 0 ? (
                    <EmptyState
                      icon="✦"
                      title="No files open"
                      description="Ask the AI builder to generate code, or open a file from the explorer."
                      action={{
                        label: 'Start building',
                        onClick: () =>
                          document.querySelector<HTMLTextAreaElement>('textarea')?.focus(),
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <CodeEditor
                        value={currentCode}
                        onChange={handleCodeChange}
                        language={activeEditorTab?.language || 'typescript'}
                        theme="vs-dark"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="h-full overflow-hidden">
            <PreviewPanel code={currentCode} language={activeEditorTab?.language} />
          </div>
        );

      case 'integrations':
        return (
          <div className="h-full overflow-hidden">
            <EcommerceIntegrationsPanel />
          </div>
        );

      case 'analytics':
        return (
          <div className="h-full overflow-hidden">
            <AnalyticsPanel />
          </div>
        );

      case 'files':
        return (
          <div className="h-full overflow-hidden">
            <FileExplorer
              key={`files-${fileExplorerKey}`}
              onFileSelect={handleFileOpen}
              currentFile={activeEditorTab?.path || ''}
              workspaceId={workspaceId}
            />
          </div>
        );

      case 'terminal':
        return (
          <div className="h-full overflow-hidden">
            <TerminalPanel workspaceId={workspaceId} />
          </div>
        );

      default:
        return null;
    }
  };

  /* ── JSX ──────────────────────────────── */
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0f0f11] text-white">

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Top Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#111114] border-b border-gray-800 z-40">
        {/* Left: logo + active file breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white leading-none shrink-0">
              C
            </span>
            <span className="text-sm font-semibold text-white">Store Builder</span>
          </div>

          {activeEditorTab && (
            <>
              <ChevronRight size={13} className="text-gray-600 shrink-0" />
              <span className="text-sm text-gray-400 truncate max-w-[220px]">
                {activeEditorTab.name}
                {activeEditorTab.isDirty && (
                  <span className="ml-1 text-indigo-400">•</span>
                )}
              </span>
            </>
          )}
        </div>

        {/* Right: deploy button */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shrink-0"
          aria-label="Deploy project to Vercel"
        >
          <span className="text-xs font-bold">▲</span>
          {isDeploying ? 'Deploying…' : 'Deploy'}
        </button>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Icon sidebar */}
        <nav
          className="w-12 shrink-0 flex flex-col items-center py-2 gap-1 bg-[#111114] border-r border-gray-800"
          aria-label="Studio navigation"
        >
          {SIDEBAR_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                  ${isActive
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}
                `}
                title={tab.label}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon}
              </button>
            );
          })}

          {/* Upload shortcut at the bottom */}
          <div className="mt-auto">
            <button
              onClick={() => setActiveTab('files')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-colors"
              title="Upload assets"
              aria-label="Upload assets"
            >
              <UploadIcon size={15} />
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {/* Status bar */}
      <footer className="shrink-0 border-t border-gray-800 bg-[#111114]">
        <StatusBar
          language={activeEditorTab?.language || 'TypeScript React'}
          fileName={activeEditorTab?.name}
        />
      </footer>
    </div>
  );
}
