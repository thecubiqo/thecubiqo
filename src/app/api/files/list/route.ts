import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/tmp/cubiqo-workspace';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relPath = join(relativePath, entry.name);
      const stats = await stat(fullPath);

      const node: FileNode = {
        name: entry.name,
        path: relPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime.toISOString(),
      };

      if (entry.isDirectory()) {
        // Only traverse one level deep for initial load
        node.children = [];
      }

      nodes.push(node);
    }

    return nodes.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    
    return [];
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '';

    // Security: prevent directory traversal
    const safePath = join(WORKSPACE_ROOT, path);
    if (!safePath.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const tree = await buildFileTree(safePath, path);

    return NextResponse.json({
      success: true,
      data: tree,
      workspace: WORKSPACE_ROOT,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
