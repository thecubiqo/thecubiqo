import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/connections/vercel/projects
 * 
 * Fetch all Vercel projects for the connected account
 * Returns project list with latest deployment status
 */

export async function GET(request: Request) {
  const supabase = await createClient()

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
    // Get Vercel connection
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('service', 'vercel')
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Vercel not connected', connected: false },
        { status: 404 }
      )
    }

    const { access_token, metadata } = connection
    const team_id = (metadata as any)?.team_id

    // Fetch latest projects from Vercel API
    const projectsUrl = team_id
      ? `https://api.vercel.com/v9/projects?teamId=${team_id}`
      : 'https://api.vercel.com/v9/projects'

    const projectsResponse = await fetch(projectsUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!projectsResponse.ok) {
      throw new Error(`Vercel API error: ${projectsResponse.statusText}`)
    }

    const projectsData = await projectsResponse.json()

    // For each project, fetch latest deployment
    const projectsWithDeployments = await Promise.all(
      (projectsData.projects || []).map(async (project: any) => {
        try {
          const deploymentsUrl = team_id
            ? `https://api.vercel.com/v6/deployments?projectId=${project.id}&teamId=${team_id}&limit=1`
            : `https://api.vercel.com/v6/deployments?projectId=${project.id}&limit=1`

          const deploymentResponse = await fetch(deploymentsUrl, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })

          const deploymentData = await deploymentResponse.json()
          const latestDeployment = deploymentData.deployments?.[0]

          return {
            id: project.id,
            name: project.name,
            framework: project.framework,
            link: project.link,
            productionDomain: project.targets?.production?.alias?.[0] || null,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            latestDeployment: latestDeployment
              ? {
                id: latestDeployment.uid,
                url: latestDeployment.url,
                state: latestDeployment.state,
                readyState: latestDeployment.readyState,
                createdAt: latestDeployment.createdAt,
                ready: latestDeployment.ready,
                buildingAt: latestDeployment.buildingAt,
                creator: latestDeployment.creator?.username,
                target: latestDeployment.target,
              }
              : null,
          }
        } catch (error) {
          console.error(`Error fetching deployments for ${project.name}:`, error)
          return {
            id: project.id,
            name: project.name,
            framework: project.framework,
            link: project.link,
            productionDomain: null,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            latestDeployment: null,
          }
        }
      })
    )

    // Update cached projects in metadata
    await supabase
      .from('connections')
      .update({
        metadata: {
          ...(metadata as any),
          projects: projectsWithDeployments.map((p) => ({
            id: p.id,
            name: p.name,
            framework: p.framework,
          })),
          project_count: projectsWithDeployments.length,
        },
        last_used_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return NextResponse.json({
      connected: true,
      username: (metadata as any)?.username,
      team_id: (metadata as any)?.team_id,
      projects: projectsWithDeployments,
      total: projectsWithDeployments.length,
    })
  } catch (error: any) {
    console.error('Error fetching Vercel projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/connections/vercel/projects
 * 
 * Disconnect Vercel integration
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete connection (cascades to deployments)
    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', user.id)
      .eq('service', 'vercel')

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true, disconnected: true })
  } catch (error: any) {
    console.error('Error disconnecting Vercel:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
