/**
 * File Operations API
 * Handles file CRUD operations within workspaces
 * Uses real Node.js fs operations sandboxed to per-session workspace directories.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readFile, writeFile, readdir, stat, mkdir, rm } from 'fs/promises';
import { dirname } from 'path';
import { ensureWorkspace, validatePath } from '@/lib/code-execution/sandbox';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/emergent/files?workspaceId=xxx&path=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const filePath = searchParams.get('path') || '/';

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    // Create / resolve workspace directory
    const workspaceDir = await ensureWorkspace(workspaceId);

    // Validate the requested path stays inside the workspace
    const validation = validatePath(filePath, workspaceDir);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason ?? 'Invalid path' },
        { status: 403 }
      );
    }

    const resolvedPath = validation.sanitizedCommand as string;

    // Check whether the path is a file or a directory
    let stats;
    try {
      stats = await stat(resolvedPath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return NextResponse.json(
          { error: `File not found: ${filePath}` },
          { status: 404 }
        );
      }
      throw err;
    }

    if (stats.isDirectory()) {
      // Return directory listing with basic metadata
      const entries = await readdir(resolvedPath, { withFileTypes: true });
      const files = entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
      }));

      return NextResponse.json({
        success: true,
        path: filePath,
        type: 'directory',
        files,
      });
    }

    // Read file content
    const content = await readFile(resolvedPath, 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
      type: 'file',
      content,
      size: stats.size,
    });
  } catch (error) {
    console.error('Failed to read file:', error);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}

// POST /api/emergent/files - Create or update file
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, path: filePath, content } = body;

    if (!workspaceId || !filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create / resolve workspace directory
    const workspaceDir = await ensureWorkspace(workspaceId);

    // Validate the requested path stays inside the workspace
    const validation = validatePath(filePath, workspaceDir);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason ?? 'Invalid path' },
        { status: 403 }
      );
    }

    const resolvedPath = validation.sanitizedCommand as string;

    // Ensure parent directories exist
    await mkdir(dirname(resolvedPath), { recursive: true });

    // Write (create or overwrite) the file
    await writeFile(resolvedPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
      resolvedPath,
      message: 'File written successfully',
    });
  } catch (error) {
    console.error('Failed to write file:', error);
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}

// DELETE /api/emergent/files?workspaceId=xxx&path=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const filePath = searchParams.get('path');

    if (!workspaceId || !filePath) {
      return NextResponse.json(
        { error: 'Missing workspaceId or path' },
        { status: 400 }
      );
    }

    // Create / resolve workspace directory
    const workspaceDir = await ensureWorkspace(workspaceId);

    // Validate the requested path stays inside the workspace
    const validation = validatePath(filePath, workspaceDir);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason ?? 'Invalid path' },
        { status: 403 }
      );
    }

    const resolvedPath = validation.sanitizedCommand as string;

    // Attempt to delete the file
    try {
      await rm(resolvedPath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return NextResponse.json(
          { error: `File not found: ${filePath}` },
          { status: 404 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
