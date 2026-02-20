'use client';

import { useState } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

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

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
  currentFile: string;
}

export default function FileExplorer({ onFileSelect, currentFile }: FileExplorerProps) {
  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">📁 Files</h3>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {mockFiles.map(node => (
          <FileTreeNode 
            key={node.path}
            node={node}
            onSelect={onFileSelect}
            currentFile={currentFile}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}

function FileTreeNode({ 
  node, 
  onSelect, 
  currentFile, 
  level 
}: { 
  node: FileNode; 
  onSelect: (path: string) => void; 
  currentFile: string;
  level: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = currentFile === node.path;

  if (node.type === 'folder') {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 py-1 px-2 hover:bg-gray-700 rounded cursor-pointer text-sm"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
          <span className="text-gray-300">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                onSelect={onSelect}
                currentFile={currentFile}
                level={level + 1}
              />
            ))}
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
