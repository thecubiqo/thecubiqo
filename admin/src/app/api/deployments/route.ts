import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getNextAvailablePort } from '@/lib/build'

const createDeploymentSchema = z.object({
  domainId: z.string(),
  templateId: z.string(),
  config: z.record(z.any()).optional(),
})

// GET /api/deployments - List all deployments
export async function GET() {
  try {
    const deployments = await prisma.deployment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        domain: {
          select: {
            id: true,
            domainName: true,
            status: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error('Error fetching deployments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    )
  }
}

// POST /api/deployments - Create a new deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createDeploymentSchema.parse(body)

    // Verify domain and template exist
    const [domain, template] = await Promise.all([
      prisma.domain.findUnique({ where: { id: data.domainId } }),
      prisma.template.findUnique({ where: { id: data.templateId } }),
    ])

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Get next available port
    const port = await getNextAvailablePort()

    // Create deployment
    const deployment = await prisma.deployment.create({
      data: {
        domainId: data.domainId,
        templateId: data.templateId,
        port,
        status: 'DRAFT',
      },
    })

    // Create configuration if provided
    if (data.config) {
      await prisma.templateConfig.create({
        data: {
          deploymentId: deployment.id,
          configJson: data.config,
        },
      })
    }

    const deploymentWithRelations = await prisma.deployment.findUnique({
      where: { id: deployment.id },
      include: {
        domain: true,
        template: true,
        config: true,
      },
    })

    return NextResponse.json({ deployment: deploymentWithRelations }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating deployment:', error)
    return NextResponse.json(
      { error: 'Failed to create deployment' },
      { status: 500 }
    )
  }
}

