import { NextRequest, NextResponse } from 'next/server'
import { applyNginxConfig, generateNginxConfig } from '@/lib/nginx'
import { prisma } from '@/lib/db'

// POST /api/nginx/[id] - Apply Nginx configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await applyNginxConfig(id)

    return NextResponse.json({
      message: 'Nginx configuration applied successfully',
      deploymentId: id,
    })
  } catch (error: any) {
    console.error('Error applying Nginx config:', error)
    return NextResponse.json(
      { error: 'Failed to apply Nginx configuration', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/nginx/[id] - Get Nginx configuration preview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        domain: true,
      },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    if (!deployment.port) {
      return NextResponse.json(
        { error: 'Deployment port not set' },
        { status: 400 }
      )
    }

    const config = generateNginxConfig({
      domain: deployment.domain.domainName,
      port: deployment.port,
      sslEnabled: deployment.sslEnabled,
      sslCertPath: deployment.sslCertPath || undefined,
      sslKeyPath: deployment.sslKeyPath || undefined,
    })

    return NextResponse.json({
      config,
      domain: deployment.domain.domainName,
      port: deployment.port,
      sslEnabled: deployment.sslEnabled,
    })
  } catch (error: any) {
    console.error('Error fetching Nginx config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Nginx configuration' },
      { status: 500 }
    )
  }
}

