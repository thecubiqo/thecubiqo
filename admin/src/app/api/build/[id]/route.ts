import { NextRequest, NextResponse } from 'next/server'
import { buildDeployment } from '@/lib/build'

// POST /api/build/[id] - Trigger build for a deployment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Start build asynchronously
    buildDeployment(id).catch((error) => {
      console.error('Build error:', error)
    })

    return NextResponse.json({
      message: 'Build started',
      deploymentId: id,
    })
  } catch (error: any) {
    console.error('Error starting build:', error)
    return NextResponse.json(
      { error: 'Failed to start build', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/build/[id] - Get build status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { prisma } = await import('@/lib/db')
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        buildPath: true,
      },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      deploymentId: id,
      status: deployment.status,
      buildPath: deployment.buildPath,
    })
  } catch (error: any) {
    console.error('Error fetching build status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build status' },
      { status: 500 }
    )
  }
}

