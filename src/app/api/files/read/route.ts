import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/tmp/cubiqo-workspace';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Missing path parameter' },
        { status: 400 }
      );
    }

    // Security: prevent directory traversal
    const safePath = join(WORKSPACE_ROOT, path);
    if (!safePath.startsWith(WORKSPACE_ROOT)) {
      return NextResponse.json(
        { success: false, error: 'Invalid path' },
        { status: 400 }
      );
    }

    const stats = await stat(safePath);
    
    if (!stats.isFile()) {
      return NextResponse.json(
        { success: false, error: 'Path is not a file' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB for now)
    if (stats.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 413 }
      );
    }

    const content = await readFile(safePath, 'utf-8');

    return NextResponse.json({
      success: true,
      data: {
        content,
        path,
        size: stats.size,
        modified: stats.mtime.toISOString(),
      },
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
