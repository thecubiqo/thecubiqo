'use client';

import { useState, useEffect, useCallback } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

// ── Fallback mock data (used when the API is unavailable) ──────────────
const mockFiles: FileNode[] = [
  {
    name: 'app',
    type: 'folder',
    path: 'app',
    children: [
      { name: 'page.tsx', type: 'file', path: 'app/page.tsx' },
      { name: 'layout.tsx', type: 'file', path: 'app/layout.tsx' },
      { name: 'globals.css', type: 'file', path: 'app/globals.css' },
    ]
  },
  {
    name: 'components',
    type: 'folder',
    path: 'components',
    children: [
      { name: 'Button.tsx', type: 'file', path: 'components/Button.tsx' },
      { name: 'Card.tsx', type: 'file', path: 'components/Card.tsx' },
    ]
  },
  {
    name: 'package.json',
    type: 'file',
    path: 'package.json'
  },
  {
    name: 'README.md',
    type: 'file',
    path: 'README.md'
  }
];

// ── API helpers ────────────────────────────────────────────────────────

/** Map the API's `'directory'` type to our internal `'folder'` type. */
function apiTypeToNodeType(apiType: string): 'file' | 'folder' {
  return apiType === 'directory' ? 'folder' : 'file';
}

/**
 * Fetch a directory listing from the emergent-files API.
 * Returns an array of FileNode items for the given `dirPath`, or `null`
 * when the request fails so callers can fall back to mock data.
 */
async function fetchDirectory(
  workspaceId: string,
  dirPath: string,
): Promise<FileNode[] | null> {
  try {
    const params = new URLSearchParams({ workspaceId, path: dirPath });
    const res = await fetch(`/api/emergent/files?${params.toString()}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.success || data.type !== 'directory' || !Array.isArray(data.files)) {
      return null;
    }

    return data.files.map(
      (f: { name: string; type: string }) => {
        const childPath =
          dirPath === '/' ? f.name : `${dirPath.replace(/\/$/, '')}/${f.name}`;
        return {
          name: f.name,
          type: apiTypeToNodeType(f.type),
          path: childPath,
          // Folders start with children undefined – they'll be lazy-loaded
          children: undefined,
        } satisfies FileNode;
      },
    );
  } catch {
    return null;
  }
}

/**
 * Recursively replace the children of the node whose `path` matches
 * `targetPath` with `newChildren`, returning an updated copy of the tree.
 */
function updateNodeChildren(
  nodes: FileNode[],
  targetPath: string,
  newChildren: FileNode[],
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return { ...node, children: newChildren };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, targetPath, newChildren),
      };
    }
    return node;
  });
}

// ── Component props ────────────────────────────────────────────────────

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
  currentFile: string;
  workspaceId?: string;
}

// ── Main component ─────────────────────────────────────────────────────

export default function FileExplorer({
  onFileSelect,
  currentFile,
  workspaceId = 'default',
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Set of folder paths that are currently being fetched (for per-folder spinners)
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());

  /** Fetch the root directory listing (or fall back to mock data). */
  const loadRoot = useCallback(async () => {
    setLoading(true);
    const result = await fetchDirectory(workspaceId, '/');
    setFiles(result ?? mockFiles);
    setLoading(false);
  }, [workspaceId]);

  // Fetch on mount (and when workspaceId changes)
  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  /**
   * Called when a folder node is expanded and its children haven't been
   * loaded yet.  Fetches the children from the API and patches the tree.
   */
  const handleExpandFolder = useCallback(
    async (folderPath: string) => {
      setLoadingPaths((prev) => new Set(prev).add(folderPath));

      const children = await fetchDirectory(workspaceId, folderPath);
      if (children) {
        setFiles((prev) => updateNodeChildren(prev, folderPath, children));
      }

      setLoadingPaths((prev) => {
        const next = new Set(prev);
        next.delete(folderPath);
        return next;
      });
    },
    [workspaceId],
  );

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">📁 Files</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const name = prompt('New file name (e.g. components/Header.tsx):');
              if (name?.trim()) {
                onFileSelect(name.trim());
              }
            }}
            className="text-xs text-gray-400 hover:text-teal-300 transition-colors"
            aria-label="Create new file"
            title="New File"
          >
            ➕
          </button>
          <button
            onClick={loadRoot}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-teal-300 disabled:opacity-40 transition-colors"
            aria-label="Refresh file tree"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-gray-400 text-sm animate-pulse">Loading files…</span>
          </div>
        ) : (
          files.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              onSelect={onFileSelect}
              currentFile={currentFile}
              level={0}
              onExpandFolder={handleExpandFolder}
              loadingPaths={loadingPaths}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Tree node (UI preserved exactly as before + lazy-loading support) ──

function FileTreeNode({
  node,
  onSelect,
  currentFile,
  level,
  onExpandFolder,
  loadingPaths,
}: {
  node: FileNode;
  onSelect: (path: string) => void;
  currentFile: string;
  level: number;
  onExpandFolder: (folderPath: string) => void;
  loadingPaths: Set<string>;
}) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isSelected = currentFile === node.path;

  const handleToggle = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    // Lazy-load: if opening a folder whose children are not yet fetched, request them
    if (willOpen && node.type === 'folder' && node.children === undefined) {
      onExpandFolder(node.path);
    }
  }, [isOpen, node, onExpandFolder]);

  if (node.type === 'folder') {
    const isFolderLoading = loadingPaths.has(node.path);

    return (
      <div>
        <div
          onClick={handleToggle}
          className="flex items-center gap-1 py-1 px-2 hover:bg-gray-700 rounded cursor-pointer text-sm"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
          <span className="text-gray-300">{node.name}</span>
        </div>
        {isOpen && (
          <div>
            {isFolderLoading ? (
              <div
                className="text-gray-500 text-xs py-1 animate-pulse"
                style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
              >
                Loading…
              </div>
            ) : (
              node.children?.map((child) => (
                <FileTreeNode
                  key={child.path}
                  node={child}
                  onSelect={onSelect}
                  currentFile={currentFile}
                  level={level + 1}
                  onExpandFolder={onExpandFolder}
                  loadingPaths={loadingPaths}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(node.path)}
      className={`flex items-center gap-1 py-1 px-2 hover:bg-gray-700 rounded cursor-pointer text-sm ${
        isSelected ? 'bg-teal-900/30 text-teal-300' : 'text-gray-300'
      }`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <span className="text-gray-400">📄</span>
      <span>{node.name}</span>
    </div>
  );
}
