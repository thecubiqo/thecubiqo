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
        const supabase = (await createClient()) as any;
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Query workspaces from database
        const { data: workspaces, error: dbError } = await supabase
            .from('emergent_workspaces')
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            console.error('Failed to fetch workspaces:', dbError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ workspaces });
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
        const supabase = (await createClient()) as any;
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
            // In a real Vercel environment, we might fallback to just DB creation if runner is separate
            // But for now, we return 503 if we can't talk to Docker
            // UNLESS we are "offloading" logic.

            // If we are on Vercel, we can't spin up Docker.
            // So we should just queue the request in DB?
            // Since architecture is "Separate Runner", the API should just WRITE TO DB
            // and the Runner (elsewhere) picks it up.

            // HOWEVER, the user asked to "host in Hostinger".
            // If this API runs on Vercel, it CANNOT run Docker.
            // So the logic here is actually WRONG for the architecture.

            // Let's adopt the QUEUE pattern.
            // 1. Insert "pending" workspace into DB.
            // 2. Return success.
            // 3. Runner picks it up.

            const { data: workspaceRecord, error: dbError } = await supabase
                .from('emergent_workspaces')
                .insert({
                    project_id: projectId,
                    workspace_id: `ws-${Date.now()}`, // Temporary ID
                    subdomain: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
                    status: 'initializing', // Runner will update to 'running'
                    container_id: null,
                    port: null,
                    cpu_limit_cores: 2,
                    memory_limit_mb: 4096,
                    storage_limit_mb: 10240,
                })
                .select()
                .single();

            if (dbError) {
                return NextResponse.json({ error: 'Failed to queue workspace' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'Workspace provisioning queued',
                workspace: workspaceRecord
            }, { status: 202 });
        }

        // If Docker IS available (e.g. local dev or API running on Hostinger), run immediately
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

        // Store workspace in database
        const { data: workspaceRecord, error: dbError } = await supabase
            .from('emergent_workspaces')
            .insert({
                project_id: projectId,
                workspace_id: `ws-${containerInfo.containerId.substring(0, 12)}`,
                subdomain: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
                status: 'running',
                container_id: containerInfo.containerId,
                port: startedInfo.port,
                cpu_limit_cores: 2,
                memory_limit_mb: 4096,
                storage_limit_mb: 10240,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (dbError) {
            console.error('Failed to save workspace to DB:', dbError);
            // Attempt to cleanup container
            await dockerManager.stopContainer(containerInfo.containerId);
            await dockerManager.removeContainer(containerInfo.containerId);

            return NextResponse.json(
                { error: 'Failed to save workspace record', details: dbError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            workspace: workspaceRecord,
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
