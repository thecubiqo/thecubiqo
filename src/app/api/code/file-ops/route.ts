import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink, readdir, stat, mkdir } from 'fs/promises';
import { join, resolve, relative } from 'path';
import { validatePath, ensureWorkspace, getWorkspaceDir } from '@/lib/code-execution/sandbox';

interface FileOpsRequest {
  operation: 'read' | 'write' | 'delete' | 'list' | 'create-dir';
  path: string;
  content?: string;
  sessionId?: string;
}

interface FileOpsResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Security: Use session-specific workspace
function getSessionWorkspace(sessionId: string): string {
  return getWorkspaceDir(sessionId);
}

function sanitizePath(userPath: string, sessionId: string): string {
  const workspaceRoot = getSessionWorkspace(sessionId);
  
  const validation = validatePath(userPath, workspaceRoot);
  if (!validation.allowed) {
    throw new Error(validation.reason || 'Invalid path');
  }
  
  return validation.sanitizedCommand || resolve(workspaceRoot, userPath);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: FileOpsRequest = await req.json();
    const { operation, path, content, sessionId = 'default' } = body;

    if (!operation || !path) {
      return NextResponse.json(
        { success: false, error: 'Missing operation or path' },
        { status: 400 }
      );
    }

    // Ensure workspace exists
    await ensureWorkspace(sessionId);

    const safePath = sanitizePath(path, sessionId);
    let result: FileOpsResponse;

    switch (operation) {
      case 'read':
        result = await readFileOp(safePath);
        break;
      case 'write':
        if (content === undefined) {
          return NextResponse.json(
            { success: false, error: 'Missing content for write operation' },
            { status: 400 }
          );
        }
        result = await writeFileOp(safePath, content);
        break;
      case 'delete':
        result = await deleteFileOp(safePath);
        break;
      case 'list':
        result = await listFilesOp(safePath);
        break;
      case 'create-dir':
        result = await createDirOp(safePath);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unsupported operation: ${operation}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
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

async function readFileOp(path: string): Promise<FileOpsResponse> {
  try {
    const content = await readFile(path, 'utf-8');
    const stats = await stat(path);
    
    return {
      success: true,
      data: {
        content,
        size: stats.size,
        modified: stats.mtime,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

async function writeFileOp(path: string, content: string): Promise<FileOpsResponse> {
  try {
    // Ensure parent directory exists
    const dir = join(path, '..');
    await mkdir(dir, { recursive: true });
    
    await writeFile(path, content, 'utf-8');
    
    return {
      success: true,
      data: { path, bytes: content.length },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write file',
    };
  }
}

async function deleteFileOp(path: string): Promise<FileOpsResponse> {
  try {
    await unlink(path);
    
    return {
      success: true,
      data: { deleted: path },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

async function listFilesOp(path: string): Promise<FileOpsResponse> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(path, entry.name);
        const stats = await stat(fullPath);
        
        return {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );
    
    return {
      success: true,
      data: { files },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

async function createDirOp(path: string): Promise<FileOpsResponse> {
  try {
    await mkdir(path, { recursive: true });
    
    return {
      success: true,
      data: { created: path },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create directory',
    };
  }
}
