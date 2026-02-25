/**
 * Deployment API — Vercel Integration
 *
 * POST /api/emergent/deploy   → Trigger a new deployment
 * GET  /api/emergent/deploy   → Query deployment status
 *
 * When VERCEL_TOKEN is configured, deploys via the Vercel REST API.
 * Otherwise returns a 202 with a clear message about the missing config.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const VERCEL_API_BASE = 'https://api.vercel.com/v13/deployments';

const VALID_ENVIRONMENTS = ['preview', 'production', 'development'] as const;
type Environment = (typeof VALID_ENVIRONMENTS)[number];

const VALID_PLATFORMS = ['vercel'] as const;

/** Map Vercel readyState → our DB status enum. */
function mapVercelStatus(
  readyState: string,
): 'queued' | 'building' | 'deploying' | 'success' | 'failed' | 'cancelled' {
  switch (readyState) {
    case 'QUEUED':
      return 'queued';
    case 'BUILDING':
      return 'building';
    case 'INITIALIZING':
      return 'deploying';
    case 'READY':
      return 'success';
    case 'ERROR':
      return 'failed';
    case 'CANCELED':
      return 'cancelled';
    default:
      return 'queued';
  }
}

// ---------------------------------------------------------------------------
// POST /api/emergent/deploy — Trigger deployment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Input validation ───────────────────────────────────────────────
    const body = await request.json();
    const {
      projectId,
      environment = 'production',
      platform = 'vercel',
      workspaceId,
      framework,
      buildCommand,
    } = body as {
      projectId?: string;
      environment?: string;
      platform?: string;
      workspaceId?: string;
      framework?: string;
      buildCommand?: string;
    };

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'projectId is required and must be a string' },
        { status: 400 },
      );
    }

    if (!VALID_ENVIRONMENTS.includes(environment as Environment)) {
      return NextResponse.json(
        {
          error: `environment must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    if (!VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])) {
      return NextResponse.json(
        { error: `platform must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 },
      );
    }

    // ── Vercel deployment ──────────────────────────────────────────────
    const vercelToken = process.env.VERCEL_TOKEN;

    let vercelDeploymentId: string | null = null;
    let deploymentUrl: string | null = null;
    let initialStatus: string = 'queued';

    if (vercelToken) {
      const vercelTarget = environment === 'production' ? 'production' : 'preview';

      const vercelBody: Record<string, unknown> = {
        name: `emergent-${projectId}`,
        target: vercelTarget,
        projectSettings: {
          ...(framework ? { framework } : {}),
          ...(buildCommand ? { buildCommand } : {}),
        },
      };

      const vercelRes = await fetch(VERCEL_API_BASE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vercelBody),
      });

      if (!vercelRes.ok) {
        const errBody = await vercelRes.text();
        console.error('Vercel API error:', vercelRes.status, errBody);
        return NextResponse.json(
          {
            error: 'Vercel deployment failed to start',
            detail: vercelRes.status === 403
              ? 'Invalid or insufficient Vercel token permissions'
              : `Vercel API responded with ${vercelRes.status}`,
          },
          { status: 502 },
        );
      }

      const vercelData = await vercelRes.json();
      vercelDeploymentId = vercelData.id ?? null;
      deploymentUrl = vercelData.url ? `https://${vercelData.url}` : null;
      initialStatus = mapVercelStatus(vercelData.readyState ?? 'QUEUED');
    }

    // ── Persist to database ────────────────────────────────────────────
    const { data: deployment, error: insertError } = await supabase
      .from('emergent_deployments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        workspace_id: workspaceId ?? null,
        vercel_deployment_id: vercelDeploymentId,
        environment,
        status: initialStatus,
        url: deploymentUrl,
        framework: framework ?? null,
        build_command: buildCommand ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to record deployment:', insertError);
      return NextResponse.json(
        { error: 'Failed to record deployment in database' },
        { status: 500 },
      );
    }

    // ── Response ───────────────────────────────────────────────────────
    if (!vercelToken) {
      return NextResponse.json(
        {
          success: true,
          deployment: {
            id: deployment.id,
            projectId,
            environment,
            platform,
            status: deployment.status,
            url: null,
            message:
              'Deployment recorded but VERCEL_TOKEN is not configured. ' +
              'Set the VERCEL_TOKEN environment variable to enable live deployments.',
          },
        },
        { status: 202 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        deployment: {
          id: deployment.id,
          vercelDeploymentId,
          projectId,
          environment,
          platform,
          status: deployment.status,
          url: deploymentUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to trigger deployment:', error);
    return NextResponse.json(
      { error: 'Failed to trigger deployment' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/emergent/deploy?deploymentId=xxx — Query deployment status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const supabase = (await createClient()) as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Input validation ───────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Missing deploymentId query parameter' },
        { status: 400 },
      );
    }

    // ── Look up in database ────────────────────────────────────────────
    const { data: deployment, error: queryError } = await supabase
      .from('emergent_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (queryError || !deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 },
      );
    }

    // ── Optionally refresh status from Vercel ──────────────────────────
    const vercelToken = process.env.VERCEL_TOKEN;
    let liveStatus: string | null = null;
    let liveUrl: string | null = null;
    let buildLogs: string | null = null;

    if (vercelToken && deployment.vercel_deployment_id) {
      try {
        const vercelRes = await fetch(
          `${VERCEL_API_BASE}/${deployment.vercel_deployment_id}`,
          {
            headers: { Authorization: `Bearer ${vercelToken}` },
          },
        );

        if (vercelRes.ok) {
          const vercelData = await vercelRes.json();

          liveStatus = mapVercelStatus(vercelData.readyState ?? '');
          liveUrl = vercelData.url ? `https://${vercelData.url}` : null;

          // Persist updated status back to DB when it changes
          const shouldUpdate =
            liveStatus !== deployment.status || liveUrl !== deployment.url;

          if (shouldUpdate) {
            const updatePayload: Record<string, unknown> = {
              status: liveStatus,
              url: liveUrl ?? deployment.url,
              updated_at: new Date().toISOString(),
            };

            if (liveStatus === 'success' && !deployment.deployed_at) {
              updatePayload.deployed_at = new Date().toISOString();
            }
            if (liveStatus === 'failed' && !deployment.failed_at) {
              updatePayload.failed_at = new Date().toISOString();
              updatePayload.error_message =
                vercelData.errorMessage ?? vercelData.error?.message ?? null;
            }

            await supabase
              .from('emergent_deployments')
              .update(updatePayload)
              .eq('id', deploymentId);
          }
        }
      } catch (vercelErr) {
        // Non-fatal: we still return what we have in DB
        console.error('Failed to fetch Vercel deployment status:', vercelErr);
      }
    }

    // ── Response ───────────────────────────────────────────────────────
    return NextResponse.json({
      deployment: {
        id: deployment.id,
        projectId: deployment.project_id,
        vercelDeploymentId: deployment.vercel_deployment_id,
        environment: deployment.environment,
        status: liveStatus ?? deployment.status,
        url: liveUrl ?? deployment.url,
        buildLogs: buildLogs ?? deployment.build_logs,
        errorMessage: deployment.error_message,
        framework: deployment.framework,
        deployedAt: deployment.deployed_at,
        failedAt: deployment.failed_at,
        createdAt: deployment.created_at,
        updatedAt: deployment.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 },
    );
  }
}
