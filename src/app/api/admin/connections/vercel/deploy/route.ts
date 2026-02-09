import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/connections/vercel/deploy
 * 
 * Trigger a new deployment for a Vercel project
 * 
 * Body: { projectId: string, target?: 'production' | 'preview' }
 */

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { projectId, target = 'production' } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    // Get Vercel connection
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('service', 'vercel')
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Vercel not connected' },
        { status: 404 }
      )
    }

    const { access_token, metadata } = connection
    const team_id = metadata?.team_id

    // Get project details
    const projectUrl = team_id
      ? `https://api.vercel.com/v9/projects/${projectId}?teamId=${team_id}`
      : `https://api.vercel.com/v9/projects/${projectId}`

    const projectResponse = await fetch(projectUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!projectResponse.ok) {
      throw new Error(`Failed to fetch project: ${projectResponse.statusText}`)
    }

    const project = await projectResponse.json()

    // Trigger deployment via hook or redeploy latest
    // Option 1: Redeploy the latest deployment
    const deploymentsUrl = team_id
      ? `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${team_id}&limit=1&target=${target}`
      : `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&target=${target}`

    const deploymentsResponse = await fetch(deploymentsUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const deploymentsData = await deploymentsResponse.json()
    const latestDeployment = deploymentsData.deployments?.[0]

    if (!latestDeployment) {
      // No deployments yet, trigger via build (requires Git connection)
      return NextResponse.json(
        { 
          error: 'No deployments found for this project. Please deploy via Git first.',
          requiresGit: true 
        },
        { status: 400 }
      )
    }

    // Trigger a redeploy of the latest deployment
    const redeployUrl = team_id
      ? `https://api.vercel.com/v13/deployments?teamId=${team_id}`
      : 'https://api.vercel.com/v13/deployments'

    const redeployResponse = await fetch(redeployUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: project.name,
        deploymentId: latestDeployment.uid,
        target,
      }),
    })

    if (!redeployResponse.ok) {
      const errorData = await redeployResponse.json()
      throw new Error(`Deployment failed: ${errorData.error?.message || redeployResponse.statusText}`)
    }

    const deployment = await redeployResponse.json()

    // Save deployment record
    const { data: deploymentRecord, error: deployError } = await supabase
      .from('deployments')
      .insert({
        user_id: user.id,
        connection_id: connection.id,
        vercel_deployment_id: deployment.id,
        vercel_project_id: projectId,
        project_name: project.name,
        url: deployment.url,
        state: deployment.readyState || 'BUILDING',
        commit_sha: deployment.meta?.githubCommitSha,
        commit_message: deployment.meta?.githubCommitMessage,
        branch: deployment.meta?.githubCommitRef,
        metadata: {
          target: deployment.target,
          creator: deployment.creator?.username,
          framework: project.framework,
        },
      })
      .select()
      .single()

    if (deployError) {
      console.error('Failed to save deployment record:', deployError)
      // Continue anyway - deployment was successful
    }

    // Update connection last_used_at
    await supabase
      .from('connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        url: `https://${deployment.url}`,
        state: deployment.readyState,
        inspectorUrl: deployment.inspectorUrl,
        createdAt: deployment.createdAt,
        target: deployment.target,
      },
      record: deploymentRecord,
    })
  } catch (error: any) {
    console.error('Deployment error:', error)
    return NextResponse.json(
      { error: error.message || 'Deployment failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/connections/vercel/deploy?deploymentId=xxx
 * 
 * Get deployment status and logs
 */
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const deploymentId = searchParams.get('deploymentId')

  if (!deploymentId) {
    return NextResponse.json(
      { error: 'deploymentId is required' },
      { status: 400 }
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get Vercel connection
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('service', 'vercel')
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Vercel not connected' }, { status: 404 })
    }

    const { access_token, metadata } = connection
    const team_id = metadata?.team_id

    // Fetch deployment status
    const deploymentUrl = team_id
      ? `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${team_id}`
      : `https://api.vercel.com/v13/deployments/${deploymentId}`

    const deploymentResponse = await fetch(deploymentUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!deploymentResponse.ok) {
      throw new Error(`Failed to fetch deployment: ${deploymentResponse.statusText}`)
    }

    const deployment = await deploymentResponse.json()

    // Update our database record
    await supabase
      .from('deployments')
      .update({
        state: deployment.readyState,
        ready_at: deployment.ready ? new Date(deployment.ready).toISOString() : null,
        build_duration_ms: deployment.buildingAt && deployment.ready
          ? new Date(deployment.ready).getTime() - new Date(deployment.buildingAt).getTime()
          : null,
      })
      .eq('vercel_deployment_id', deploymentId)
      .eq('user_id', user.id)

    return NextResponse.json({
      id: deployment.id,
      url: `https://${deployment.url}`,
      state: deployment.readyState,
      ready: deployment.ready,
      buildingAt: deployment.buildingAt,
      createdAt: deployment.createdAt,
      target: deployment.target,
      inspectorUrl: deployment.inspectorUrl,
    })
  } catch (error: any) {
    console.error('Error fetching deployment status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployment' },
      { status: 500 }
    )
  }
}
