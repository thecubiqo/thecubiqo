/**
 * Deployment API
 * Triggers and polls deployments via the Vercel Deployments API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VERCEL_API = 'https://api.vercel.com';

// POST /api/emergent/deploy - Trigger deployment
export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, environment = 'production', platform = 'vercel' } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Graceful degradation when VERCEL_TOKEN is absent
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      const deploymentId = `deploy-${Date.now()}`;
      return NextResponse.json({
        success: true,
        deployment: {
          id: deploymentId,
          projectId,
          environment,
          platform,
          status: 'pending',
          url: null,
          message:
            'VERCEL_TOKEN not configured — deployment cannot be triggered. Set the VERCEL_TOKEN environment variable to enable deployments.',
        },
      }, { status: 202 });
    }

    // Fetch project details for repository info
    const { data: project } = await supabase
      .from('projects')
      .select('name, repository, org_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Call Vercel Deployments API
    // https://vercel.com/docs/rest-api/endpoints/deployments#create-a-new-deployment
    const vercelResponse = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: project.name || projectId,
        target: environment === 'production' ? 'production' : undefined,
        gitSource: project.repository
          ? {
              type: 'github',
              repo: project.repository,
              ref: environment === 'production' ? 'main' : 'develop',
            }
          : undefined,
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    });

    if (!vercelResponse.ok) {
      const errorData = await vercelResponse.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `Vercel API error: ${vercelResponse.status}`,
        details: (errorData as any).error?.message || 'Unknown Vercel error',
      }, { status: vercelResponse.status });
    }

    const deployData = (await vercelResponse.json()) as any;

    // Persist deployment record
    await supabase.from('deployments').insert({
      project_id: projectId,
      version: deployData.id || `v-${Date.now()}`,
      environment,
      status: 'building',
      url: deployData.url ? `https://${deployData.url}` : null,
      build_logs: null,
      deployed_at: null,
    });

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployData.id,
        projectId,
        environment,
        platform: 'vercel',
        status: deployData.readyState || 'building',
        url: deployData.url ? `https://${deployData.url}` : null,
        inspectorUrl: deployData.inspectorUrl || null,
      },
    }, { status: 202 });
  } catch (error) {
    console.error('Failed to trigger deployment:', error);
    return NextResponse.json(
      { error: 'Failed to trigger deployment' },
      { status: 500 }
    );
  }
}

// GET /api/emergent/deploy?deploymentId=xxx - Get deployment status
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');

    if (!deploymentId) {
      return NextResponse.json({ error: 'Missing deploymentId' }, { status: 400 });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      return NextResponse.json({
        deployment: {
          id: deploymentId,
          status: 'unknown',
          url: null,
          message: 'VERCEL_TOKEN not configured — cannot check deployment status.',
        },
      });
    }

    const vercelResponse = await fetch(
      `${VERCEL_API}/v13/deployments/${deploymentId}`,
      {
        headers: { Authorization: `Bearer ${vercelToken}` },
      }
    );

    if (!vercelResponse.ok) {
      return NextResponse.json(
        {
          deployment: {
            id: deploymentId,
            status: 'error',
            url: null,
            message: `Vercel API returned ${vercelResponse.status}`,
          },
        },
        { status: vercelResponse.status === 404 ? 404 : 502 }
      );
    }

    const deployData = (await vercelResponse.json()) as any;

    return NextResponse.json({
      deployment: {
        id: deploymentId,
        status: deployData.readyState || 'unknown',
        url: deployData.url ? `https://${deployData.url}` : null,
        createdAt: deployData.createdAt,
        buildingAt: deployData.buildingAt,
        ready: deployData.ready,
        inspectorUrl: deployData.inspectorUrl || null,
      },
    });
  } catch (error) {
    console.error('Failed to get deployment status:', error);
    return NextResponse.json(
      { error: 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}
