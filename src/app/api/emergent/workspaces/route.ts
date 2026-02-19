/**
 * Workspace Management API
 * Handles creation, listing, and management of Docker workspaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDockerManager } from '@/lib/emergent/runner/docker-manager';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

// GET /api/emergent/workspaces - List all workspaces for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Query workspaces from database
    // For now, return mock data
    return NextResponse.json({
      workspaces: [
        {
          id: 'workspace-1',
          name: 'My E-commerce App',
          status: 'running',
          previewUrl: 'http://localhost:3000',
          createdAt: new Date().toISOString(),
        }
      ]
    });
  } catch (error) {
    console.error('Failed to list workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/emergent/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, runtime = 'nodejs', template } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    // Create workspace directory
    const workspaceDir = path.join('/tmp/workspaces', projectId);
    await fs.mkdir(workspaceDir, { recursive: true });

    // Initialize basic project structure
    await initializeProject(workspaceDir, template);

    // Get Docker manager
    const dockerManager = getDockerManager();

    // Check if Docker is accessible
    const dockerAvailable = await dockerManager.ping();
    
    if (!dockerAvailable) {
      return NextResponse.json({
        success: false,
        error: 'Docker daemon not accessible',
        message: 'Please ensure Docker is running and accessible',
      }, { status: 503 });
    }

    // Create Docker container
    const containerInfo = await dockerManager.createContainer({
      projectId,
      runtime: runtime as any,
      workspaceDir,
      resources: {
        cpus: 2,
        memory: 4096,
        storage: 10240,
      },
    });

    if (containerInfo.status === 'error') {
      return NextResponse.json({
        success: false,
        error: 'Failed to create container',
      }, { status: 500 });
    }

    // Start the container
    const startedInfo = await dockerManager.startContainer(containerInfo.containerId);

    // TODO: Store workspace in database
    // For now, return the workspace info
    
    return NextResponse.json({
      success: true,
      workspace: {
        id: containerInfo.containerId,
        projectId,
        name: name || 'New Workspace',
        status: startedInfo.status,
        previewUrl: startedInfo.previewUrl,
        ipAddress: startedInfo.ipAddress,
        port: startedInfo.port,
        runtime,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Initialize project structure in workspace
 */
async function initializeProject(workspaceDir: string, template?: string) {
  // Create basic package.json for Node.js projects
  const packageJson = {
    name: 'emergent-workspace',
    version: '1.0.0',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
  };

  await fs.writeFile(
    path.join(workspaceDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create basic app structure
  await fs.mkdir(path.join(workspaceDir, 'app'), { recursive: true });
  await fs.writeFile(
    path.join(workspaceDir, 'app', 'page.tsx'),
    `export default function Home() {
  return (
    <div>
      <h1>Welcome to your Emergent app!</h1>
      <p>Start building with AI assistance.</p>
    </div>
  );
}
`
  );
}
