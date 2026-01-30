import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDnsInstructions } from '@/lib/settings'

// GET /api/deployments/[id] - Get a single deployment
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
        template: true,
        config: true,
        uploads: true,
      },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    // Dynamically generate DNS instructions if they contain placeholder or if server IP is now configured
    let dnsInstructions = deployment.domain.dnsInstructions
    if (!dnsInstructions || dnsInstructions.includes('YOUR_SERVER_IP')) {
      dnsInstructions = await generateDnsInstructions(deployment.domain.domainName)
    }

    // Return deployment with dynamically generated DNS instructions
    return NextResponse.json({
      deployment: {
        ...deployment,
        domain: {
          ...deployment.domain,
          dnsInstructions,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching deployment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment' },
      { status: 500 }
    )
  }
}

// DELETE /api/deployments/[id] - Delete a deployment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Stop server if running
    const { stopDeploymentServer } = await import('@/lib/deployment')
    await stopDeploymentServer(id).catch(() => {})

    await prisma.deployment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deployment:', error)
    return NextResponse.json(
      { error: 'Failed to delete deployment' },
      { status: 500 }
    )
  }
}

